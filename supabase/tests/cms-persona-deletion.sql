-- Local-only rollback verification: persona deletion never cascades into references.
\set ON_ERROR_STOP on
BEGIN;
SELECT set_config('request.jwt.claim.sub',(SELECT user_id::text FROM public.cac_staff WHERE active LIMIT 1),true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
CREATE TABLE public.cms_persona_delete_test_ref(id uuid REFERENCES public.personas(persona_id) ON DELETE CASCADE);
CREATE TABLE public.cms_expense_delete_test_ref(id uuid REFERENCES public.persona_expenses(expense_id) ON DELETE CASCADE);
DO $$
DECLARE source uuid:=gen_random_uuid(); p uuid:=gen_random_uuid(); e uuid:=gen_random_uuid(); s uuid:=gen_random_uuid();
 draft uuid; pid uuid; eid uuid; sid uuid; cat uuid; req uuid:=gen_random_uuid(); actor uuid:=auth.uid(); result jsonb; historical_group uuid;
BEGIN
 SELECT category_id INTO cat FROM public.categories LIMIT 1;
 INSERT INTO public.content_versions(version_id,version_number,status) VALUES(source,1,'draft');
 INSERT INTO public.personas(persona_id,version_id,name,description,general_starting_balance,weekly_income,has_english_skills,has_computer_skills)
 VALUES(p,source,'Deletion persona','Fixture',100,0,true,false);
 INSERT INTO public.scenarios(scenario_id,version_id,title,description,persona_intent,category_id,schedule_type)
 VALUES(s,source,'Reference scenario','Fixture',p,cat,'non_scheduled');
 INSERT INTO public.persona_expenses(expense_id,persona_id,version_id,name,amount,first_due_day,late_fee_amount)
 VALUES(e,p,source,'Owned bill',1.25,6,0);
 INSERT INTO public.scenario_bill_links VALUES(e,s,source);
 UPDATE public.content_versions SET status='published',published_at=now() WHERE version_id=source;
 draft:=public.cms_create_draft(source,'Persona deletion suite',gen_random_uuid());
 SELECT draft_id INTO pid FROM cms_private.lineage WHERE version_id=draft AND table_name='personas' AND source_id=p;
 SELECT draft_id INTO eid FROM cms_private.lineage WHERE version_id=draft AND table_name='persona_expenses' AND source_id=e;
 SELECT draft_id INTO sid FROM cms_private.lineage WHERE version_id=draft AND table_name='scenarios' AND source_id=s;
 BEGIN PERFORM public.cms_delete_persona(draft,0,req,pid); RAISE EXCEPTION 'Scenario reference accepted';
 EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM LIKE 'Persona still has linked scenarios%'; END;
 ASSERT (SELECT revision=0 FROM cms_private.workspaces WHERE version_id=draft);
 ASSERT EXISTS(SELECT 1 FROM public.persona_expenses WHERE expense_id=eid);
 -- Fixture-only removal of blockers; neither operation is part of persona deletion.
 UPDATE public.scenarios SET persona_intent=NULL WHERE scenario_id=sid;
 BEGIN PERFORM public.cms_delete_persona(draft,0,req,pid); RAISE EXCEPTION 'Bill recap reference accepted';
 EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM LIKE 'Persona has expenses linked to bill recaps%'; END;
 ASSERT EXISTS(SELECT 1 FROM public.scenario_bill_links WHERE expense_id=eid);
 DELETE FROM public.scenario_bill_links WHERE expense_id=eid;
 INSERT INTO public.cms_expense_delete_test_ref VALUES(eid);
 BEGIN PERFORM public.cms_delete_persona(draft,0,req,pid); RAISE EXCEPTION 'Expense cascade accepted';
 EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM LIKE 'Persona or its expenses have historical or external dependencies%'; END;
 ASSERT EXISTS(SELECT 1 FROM public.cms_expense_delete_test_ref WHERE id=eid);
 DELETE FROM public.cms_expense_delete_test_ref WHERE id=eid;
 INSERT INTO public.cms_persona_delete_test_ref VALUES(pid);
 BEGIN PERFORM public.cms_delete_persona(draft,0,req,pid); RAISE EXCEPTION 'Persona cascade accepted';
 EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM LIKE 'Persona or its expenses have historical or external dependencies%'; END;
 ASSERT EXISTS(SELECT 1 FROM public.cms_persona_delete_test_ref WHERE id=pid);
 DELETE FROM public.cms_persona_delete_test_ref WHERE id=pid;
 INSERT INTO public.group_sessions(join_code,selected_persona_id,version_id,current_scenario_id,host_user_id,selected_job_id)
 VALUES('ZXY987',pid,draft,NULL,actor,NULL) RETURNING session_id INTO historical_group;
 BEGIN PERFORM public.cms_delete_persona(draft,0,req,pid); RAISE EXCEPTION 'Historical group accepted';
 EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM LIKE 'Persona or its expenses have historical or external dependencies%'; END;
 ASSERT EXISTS(SELECT 1 FROM public.group_sessions WHERE session_id=historical_group);
 DELETE FROM public.group_sessions WHERE session_id=historical_group;

 BEGIN PERFORM public.cms_delete_persona(draft,0,gen_random_uuid(),p); RAISE EXCEPTION 'Source persona accepted';
 EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM='Persona must belong to this draft'; END;
 BEGIN PERFORM public.cms_delete_persona(source,0,gen_random_uuid(),p); RAISE EXCEPTION 'Published accepted'; EXCEPTION WHEN no_data_found THEN NULL; END;
 UPDATE public.cac_staff SET active=false WHERE user_id=actor;
 BEGIN PERFORM public.cms_delete_persona(draft,0,gen_random_uuid(),pid); RAISE EXCEPTION 'Revoked staff accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 UPDATE public.cac_staff SET active=true WHERE user_id=actor;
 PERFORM set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 BEGIN PERFORM public.cms_delete_persona(draft,0,gen_random_uuid(),pid); RAISE EXCEPTION 'Nonstaff accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claim.sub',actor::text,true);
 result:=public.cms_delete_persona(draft,0,req,pid);
 ASSERT result=public.cms_delete_persona(draft,0,req,pid);
 ASSERT NOT EXISTS(SELECT 1 FROM public.personas WHERE persona_id=pid);
 ASSERT NOT EXISTS(SELECT 1 FROM public.persona_expenses WHERE expense_id=eid);
 ASSERT NOT EXISTS(SELECT 1 FROM cms_private.lineage WHERE draft_id IN(pid,eid));
 ASSERT EXISTS(SELECT 1 FROM public.scenarios WHERE scenario_id=sid);
 ASSERT EXISTS(SELECT 1 FROM public.personas WHERE persona_id=p AND version_id=source);
 ASSERT EXISTS(SELECT 1 FROM public.persona_expenses WHERE expense_id=e AND version_id=source);
 ASSERT EXISTS(SELECT 1 FROM public.scenario_bill_links WHERE expense_id=e AND version_id=source);
 ASSERT (SELECT revision=1 FROM cms_private.workspaces WHERE version_id=draft);
 BEGIN PERFORM public.cms_delete_persona(draft,0,gen_random_uuid(),pid); RAISE EXCEPTION 'Stale accepted'; EXCEPTION WHEN serialization_failure THEN NULL; END;
 BEGIN PERFORM public.cms_delete_persona(draft,0,req,p); RAISE EXCEPTION 'Reused request accepted'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM='Request reused with different input'; END;
 ASSERT NOT has_function_privilege('anon','public.cms_delete_persona(uuid,integer,uuid,uuid)','EXECUTE');
 ASSERT NOT has_function_privilege('service_role','public.cms_delete_persona(uuid,integer,uuid,uuid)','EXECUTE');
 RAISE NOTICE 'Persona deletion/owned expenses/lineage/scenario and recap blockers/unexpected cascades/rollback/source isolation/retry/stale/authorization passed';
END $$;
ROLLBACK;
