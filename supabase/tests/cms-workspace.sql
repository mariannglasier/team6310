-- Existing LOCAL verification database only. All test writes roll back.
\set ON_ERROR_STOP on
BEGIN;
SELECT set_config('request.jwt.claim.sub',(SELECT user_id::text FROM public.cac_staff WHERE active LIMIT 1),true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',auth.uid(),'role','authenticated','is_anonymous',false)::text,true);
-- A complete synthetic source exercises empty legacy tables, cycles, facts and prices.
DO $$ DECLARE v uuid:=gen_random_uuid(); j uuid:=gen_random_uuid(); p uuid:=gen_random_uuid(); s1 uuid:=gen_random_uuid(); s2 uuid:=gen_random_uuid(); st uuid:=gen_random_uuid(); c uuid:=gen_random_uuid(); e uuid:=gen_random_uuid(); cat uuid;
BEGIN
 SELECT category_id INTO cat FROM public.categories LIMIT 1;
 INSERT INTO public.content_versions(version_id,version_number,status,created_by,created_at) VALUES(v,1,'draft',auth.uid(),now());
 INSERT INTO public.jobs(job_id,version_id,soc_code,title,median_hourly_wage,needs_english_skills,needs_computer_skills) VALUES(j,v,'11-1111','CMS source job',10,false,false);
 INSERT INTO public.personas(persona_id,version_id,name,description,general_starting_balance,weekly_income,has_english_skills,has_computer_skills) VALUES(p,v,'CMS source household','Fixture',100,0,true,true);
 UPDATE public.personas SET starting_job_id=j WHERE persona_id=p;
 INSERT INTO public.scenarios(scenario_id,version_id,title,description,category_id,persona_intent,schedule_type) VALUES(s1,v,'Source A','A',cat,p,'non_scheduled'),(s2,v,'Source B','B',cat,NULL,'non_scheduled');
 INSERT INTO public.scenario_library_metadata(scenario_id,version_id,library_key,engine) VALUES(s1,v,'D061','ordinary'),(s2,v,'D062','ordinary');
 INSERT INTO public.choices(choice_id,version_id,scenario_id,choice_text,response_text,balance_change,next_scenario_id) VALUES(c,v,s1,'A','Response',0,s2),(gen_random_uuid(),v,s2,'B','Response',0,s1);
 INSERT INTO public.cac_support_effects(support_effect_id,version_id,choice_id,assistance_amount) VALUES(gen_random_uuid(),v,c,1);
 INSERT INTO public.statistics(statistic_id,version_id,description,value,unit) VALUES(st,v,'Read-only reference',123,'Number');
 INSERT INTO public.scenario_statistics(scenario_id,statistic_id,version_id,fact_role) VALUES(s1,st,v,'general');
 INSERT INTO public.scenario_fact_copy(scenario_id,version_id,fact_role,semantic_key,display_text,source_url,evidence,verified) VALUES(s1,v,'general','test','Authored passage','https://example.org','{"original":"preserve"}',false),(s1,v,'cac','test-cac','CAC passage','https://example.org','{}',true);
 INSERT INTO public.persona_expenses(expense_id,persona_id,version_id,name,amount,first_due_day,late_fee_amount) VALUES(e,p,v,'Source bill',5,6,1);
 INSERT INTO public.scenario_bill_links VALUES(e,s1,v);
 INSERT INTO public.scenario_edition_prices VALUES(v,60,'{"original":"snapshot"}');
 UPDATE public.content_versions SET status='published',published_at=now() WHERE version_id=v;
END $$;
CREATE TEMP TABLE cms_original_content(table_name text PRIMARY KEY, digest text);
DO $$ DECLARE t text; h text; BEGIN
 FOREACH t IN ARRAY ARRAY['jobs','personas','scenarios','choices','persona_expenses','statistics','cac_support_effects','scenario_statistics','scenario_library_metadata','scenario_fact_copy','scenario_bill_links','scenario_edition_prices'] LOOP
  EXECUTE format('SELECT md5(coalesce(jsonb_agg(to_jsonb(r) ORDER BY to_jsonb(r)::text),''[]''::jsonb)::text) FROM public.%I r JOIN public.content_versions v USING(version_id) WHERE NOT v.cms_managed',t) INTO h;
  INSERT INTO cms_original_content VALUES(t,h);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['playthroughs','player_responses','playthrough_expenses','group_sessions','group_session_questions','group_votes','group_participants','group_job_votes','group_employment_votes'] LOOP
  EXECUTE format('SELECT md5(coalesce(jsonb_agg(to_jsonb(r) ORDER BY to_jsonb(r)::text),''[]''::jsonb)::text) FROM public.%I r',t) INTO h;
  INSERT INTO cms_original_content VALUES(t,h);
 END LOOP;
END $$;
CREATE TEMP TABLE cms_before AS SELECT md5(string_agg(row_to_json(v)::text,'' ORDER BY version_id)) AS digest FROM public.content_versions v WHERE NOT cms_managed;
DO $$
DECLARE source uuid; draft uuid; other uuid; result jsonb; req uuid:=gen_random_uuid(); cat uuid; persona uuid; original jsonb; t text; a integer; b integer; x record;
BEGIN
 SELECT version_id INTO source FROM public.content_versions WHERE status='published' ORDER BY version_number DESC LIMIT 1;
 draft:=public.cms_create_draft(source,'CMS test',req);
 ASSERT draft=public.cms_create_draft(source,'CMS test',req),'Creation retry changed identity';
 ASSERT jsonb_array_length(public.cms_list_drafts())>=1;
 ASSERT (public.cms_read_draft(draft)->'workspace'->>'revision')::integer=0;
 FOREACH t IN ARRAY ARRAY['jobs','personas','scenarios','choices','persona_expenses','statistics','cac_support_effects','scenario_statistics','scenario_library_metadata','scenario_fact_copy','scenario_bill_links','scenario_edition_prices'] LOOP
  EXECUTE format('SELECT count(*) FROM public.%I WHERE version_id=$1',t) INTO a USING source;
  EXECUTE format('SELECT count(*) FROM public.%I WHERE version_id=$1',t) INTO b USING draft;
  ASSERT a=b,'Copy count mismatch: '||t;
 END LOOP;
 -- Every copied record retains all non-identity fields, including evidence/eligibility.
 FOR x IN SELECT * FROM cms_private.lineage WHERE version_id=draft LOOP
  EXECUTE format('SELECT to_jsonb(r)-ARRAY[''version_id'',''job_id'',''persona_id'',''scenario_id'',''choice_id'',''expense_id'',''statistic_id'',''support_effect_id'',''starting_job_id'',''next_scenario_id'',''persona_intent''] FROM public.%I r WHERE to_jsonb(r)->>%L=$1',x.table_name,CASE x.table_name WHEN 'jobs' THEN 'job_id' WHEN 'personas' THEN 'persona_id' WHEN 'scenarios' THEN 'scenario_id' WHEN 'choices' THEN 'choice_id' WHEN 'persona_expenses' THEN 'expense_id' WHEN 'statistics' THEN 'statistic_id' ELSE 'support_effect_id' END) INTO original USING x.source_id::text;
  EXECUTE format('SELECT to_jsonb(r)-ARRAY[''version_id'',''job_id'',''persona_id'',''scenario_id'',''choice_id'',''expense_id'',''statistic_id'',''support_effect_id'',''starting_job_id'',''next_scenario_id'',''persona_intent''] FROM public.%I r WHERE to_jsonb(r)->>%L=$1',x.table_name,CASE x.table_name WHEN 'jobs' THEN 'job_id' WHEN 'personas' THEN 'persona_id' WHEN 'scenarios' THEN 'scenario_id' WHEN 'choices' THEN 'choice_id' WHEN 'persona_expenses' THEN 'expense_id' WHEN 'statistics' THEN 'statistic_id' ELSE 'support_effect_id' END) INTO result USING x.draft_id::text;
  ASSERT original=result,'Copy data mismatch';
 END LOOP;
 ASSERT NOT EXISTS(SELECT 1 FROM public.scenario_fact_copy f JOIN public.scenarios s USING(scenario_id) WHERE f.version_id=draft AND s.version_id<>draft);
 ASSERT EXISTS(SELECT 1 FROM public.scenario_fact_copy WHERE version_id=draft AND NOT verified AND evidence=' {"original":"preserve"}'::jsonb);
 ASSERT NOT EXISTS(SELECT 1 FROM public.choices c JOIN public.scenarios s USING(scenario_id) WHERE c.version_id=draft AND s.version_id<>draft);
 ASSERT NOT EXISTS(SELECT 1 FROM public.scenarios s JOIN public.personas p ON p.persona_id=s.persona_intent WHERE s.version_id=draft AND p.version_id<>draft);
 SELECT category_id INTO cat FROM public.categories LIMIT 1;
 SELECT persona_id INTO persona FROM public.personas WHERE version_id=draft LIMIT 1;
 req:=gen_random_uuid();
 result:=public.cms_save_scenario(draft,0,req,NULL,'New ordinary','Saved description',cat,persona);
 ASSERT result=public.cms_save_scenario(draft,0,req,NULL,'New ordinary','Saved description',cat,persona),'Save retry mismatch';
 ASSERT EXISTS(SELECT 1 FROM public.scenarios WHERE scenario_id=(result->>'scenario_id')::uuid AND description='Saved description' AND schedule_type='non_scheduled');
 BEGIN PERFORM public.cms_save_scenario(draft,0,gen_random_uuid(),NULL,'Stale','Stale',cat,NULL); RAISE EXCEPTION 'Stale save accepted'; EXCEPTION WHEN serialization_failure THEN NULL; END;
 BEGIN PERFORM public.cms_save_scenario(source,0,gen_random_uuid(),NULL,'Published','Published',cat,NULL); RAISE EXCEPTION 'Published save accepted'; EXCEPTION WHEN no_data_found THEN NULL; END;
 BEGIN PERFORM public.cms_save_scenario(draft,1,gen_random_uuid(),NULL,'Invalid persona','Bad',cat,gen_random_uuid()); RAISE EXCEPTION 'Invalid persona accepted'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM='Persona must belong to this draft'; END;
 BEGIN UPDATE public.content_versions SET status='published' WHERE version_id=draft; RAISE EXCEPTION 'CMS publish accepted'; EXCEPTION WHEN raise_exception THEN ASSERT SQLERRM='CMS editions cannot be published, reassigned or deleted'; END;
 -- Maintenance may not update even read-only copied job definitions.
 PERFORM set_config('request.jwt.claim.role','service_role',true);
 BEGIN UPDATE public.jobs SET title='Maintenance overwrite' WHERE version_id=draft; RAISE EXCEPTION 'Maintenance overwrite accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claim.role','authenticated',true);
 other:=public.cms_create_draft(source,'Second CMS test',gen_random_uuid());
 ASSERT (SELECT count(DISTINCT version_number)=count(*) FROM public.content_versions),'Edition collision';
 RAISE NOTICE 'CMS copy, persistence, retry, stale-save, invalid-input, publication and maintenance tests passed';
END $$;
-- Original source editions and run state must remain unchanged.
DO $$ DECLARE x record; h text; BEGIN
 FOR x IN SELECT * FROM cms_original_content LOOP
  IF x.table_name=ANY(ARRAY['playthroughs','player_responses','playthrough_expenses','group_sessions','group_session_questions','group_votes','group_participants','group_job_votes','group_employment_votes']) THEN
   EXECUTE format('SELECT md5(coalesce(jsonb_agg(to_jsonb(r) ORDER BY to_jsonb(r)::text),''[]''::jsonb)::text) FROM public.%I r',x.table_name) INTO h;
  ELSE
   EXECUTE format('SELECT md5(coalesce(jsonb_agg(to_jsonb(r) ORDER BY to_jsonb(r)::text),''[]''::jsonb)::text) FROM public.%I r JOIN public.content_versions v USING(version_id) WHERE NOT v.cms_managed',x.table_name) INTO h;
  END IF;
  ASSERT h=x.digest,'Historical content or gameplay changed: '||x.table_name;
 END LOOP;
END $$;
DO $$ BEGIN
 ASSERT (SELECT md5(string_agg(row_to_json(v)::text,'' ORDER BY version_id)) FROM public.content_versions v WHERE NOT cms_managed)=(SELECT digest FROM cms_before);
END $$;
SET LOCAL ROLE authenticated;
SELECT public.cms_list_drafts();
DO $$ BEGIN
 BEGIN UPDATE public.scenarios SET title='Direct overwrite'; RAISE EXCEPTION 'Direct write accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
DO $$ BEGIN
 BEGIN PERFORM public.cms_list_drafts(); RAISE EXCEPTION 'Non-staff admitted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM public.cms_list_drafts(); RAISE EXCEPTION 'Public visitor admitted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub',(SELECT user_id::text FROM public.cac_staff WHERE active LIMIT 1),true);
UPDATE public.cac_staff SET active=false WHERE user_id=auth.uid();
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 BEGIN PERFORM public.cms_list_drafts(); RAISE EXCEPTION 'Revoked staff admitted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;
