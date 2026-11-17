\set ON_ERROR_STOP on
BEGIN;
SELECT set_config('request.jwt.claim.sub',(SELECT user_id::text FROM public.cac_staff WHERE active LIMIT 1),true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
CREATE TABLE cms_private.unexpected_dependency(scenario_id uuid REFERENCES public.scenarios(scenario_id) ON DELETE CASCADE);
DO $$ DECLARE other uuid:=gen_random_uuid(); st uuid:=gen_random_uuid(); ch uuid; e uuid; source uuid; v uuid; sid uuid; t text; n integer; BEGIN
 SELECT version_id INTO source FROM public.content_versions WHERE status='published' ORDER BY version_number DESC LIMIT 1;
 INSERT INTO public.content_versions(version_id,version_number,status,created_by) VALUES(other,1,'draft',auth.uid());
 BEGIN PERFORM public.cms_delete_draft(other,0); RAISE EXCEPTION 'Non-CMS deletion accepted'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM='CMS draft required'; END;
 v:=public.cms_create_draft(source,'Delete test',gen_random_uuid());
 SELECT scenario_id INTO sid FROM public.scenarios WHERE version_id=v LIMIT 1;
 SELECT choice_id INTO ch FROM public.choices WHERE scenario_id=sid LIMIT 1;
 SELECT expense_id INTO e FROM public.persona_expenses WHERE version_id=v LIMIT 1;
 INSERT INTO public.statistics(statistic_id,version_id,description,value) VALUES(st,v,'Delete reference',42);
 INSERT INTO public.scenario_statistics(scenario_id,version_id,statistic_id) VALUES(sid,v,st) ON CONFLICT DO NOTHING;
 INSERT INTO public.scenario_fact_copy(scenario_id,version_id,fact_role,semantic_key,display_text,source_url) VALUES(sid,v,'general','delete-test','Draft context','https://example.org') ON CONFLICT DO NOTHING;
 INSERT INTO public.scenario_library_metadata(scenario_id,version_id,library_key,engine) VALUES(sid,v,'D900','ordinary') ON CONFLICT DO NOTHING;
 INSERT INTO public.scenario_edition_prices VALUES(v,60,'{}') ON CONFLICT DO NOTHING;
 IF ch IS NOT NULL THEN
 INSERT INTO public.cac_support_effects(support_effect_id,version_id,choice_id,assistance_amount) VALUES(gen_random_uuid(),v,ch,1);
 INSERT INTO cms_private.choice_order VALUES(v,ch,0) ON CONFLICT DO NOTHING;
 END IF;
 IF e IS NOT NULL THEN INSERT INTO public.scenario_bill_links VALUES(e,sid,v) ON CONFLICT DO NOTHING; END IF;
 INSERT INTO cms_private.receipts VALUES(v,gen_random_uuid(),auth.uid(),'[]','{}',now());
 INSERT INTO cms_private.unexpected_dependency VALUES(sid);
 BEGIN PERFORM public.cms_delete_draft(v,0); RAISE EXCEPTION 'External dependency accepted'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM='Draft has external dependencies; nothing was deleted'; END;
 ASSERT EXISTS(SELECT 1 FROM public.scenarios WHERE scenario_id=sid);
 ASSERT EXISTS(SELECT 1 FROM cms_private.workspaces WHERE version_id=v);
 DELETE FROM cms_private.unexpected_dependency;
 BEGIN PERFORM public.cms_delete_draft(v,99); RAISE EXCEPTION 'Stale deletion accepted'; EXCEPTION WHEN serialization_failure THEN NULL; END;
 BEGIN PERFORM public.cms_delete_draft(source,0); RAISE EXCEPTION 'Published deletion accepted'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM='CMS draft required'; END;
 PERFORM public.cms_delete_draft(v,0);
 PERFORM public.cms_delete_draft(v,0); -- retry succeeds without recreating anything
 FOREACH t IN ARRAY ARRAY['public.content_versions','public.jobs','public.personas','public.scenarios','public.choices','public.persona_expenses','public.statistics','public.scenario_statistics','public.cac_support_effects','public.scenario_library_metadata','public.scenario_fact_copy','public.scenario_bill_links','public.scenario_edition_prices','cms_private.workspaces','cms_private.lineage','cms_private.receipts','cms_private.choice_order'] LOOP
 EXECUTE format('SELECT count(*) FROM %s WHERE version_id=$1',t) INTO n USING v;
 ASSERT n=0,'Draft remnants in '||t;
 END LOOP;
 ASSERT EXISTS(SELECT 1 FROM public.content_versions WHERE version_id=source AND status='published');
 PERFORM set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 BEGIN PERFORM public.cms_delete_draft(source,0); RAISE EXCEPTION 'Nonstaff admitted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 ASSERT NOT has_function_privilege('anon','public.cms_delete_draft(uuid,integer)','EXECUTE');
 ASSERT NOT has_function_privilege('service_role','public.cms_delete_draft(uuid,integer)','EXECUTE');
 RAISE NOTICE 'Complete deletion, foreign dependency rollback, stale revision, retry and authorization passed';
END $$;
ROLLBACK;
