-- Fixed local verification stack only. Every fixture and assertion rolls back.
\set ON_ERROR_STOP on
BEGIN;
SELECT set_config('request.jwt.claim.sub',(SELECT user_id::text FROM public.cac_staff WHERE active LIMIT 1),true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
CREATE FUNCTION pg_temp.reject(query text, message text DEFAULT NULL) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN EXECUTE query;
  EXCEPTION WHEN OTHERS THEN
    IF message IS NOT NULL AND position(message IN SQLERRM)=0 THEN RAISE; END IF;
    RETURN;
  END;
  RAISE EXCEPTION 'Expected rejection: %', query;
END $$;
CREATE FUNCTION pg_temp.expenses(p uuid) RETURNS jsonb LANGUAGE sql AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('expense_id',expense_id,'name',name,'amount',amount,
   'first_due_day',first_due_day,'repeat_interval_days',repeat_interval_days,'late_fee_amount',late_fee_amount)
   ORDER BY expense_id),'[]') FROM public.persona_expenses WHERE persona_id=p
$$;
CREATE TABLE public.cms_persona_test_dependency(id uuid REFERENCES public.persona_expenses(expense_id) ON DELETE CASCADE);
DO $$
DECLARE
 source uuid:=gen_random_uuid(); p uuid:=gen_random_uuid(); j uuid:=gen_random_uuid(); s uuid:=gen_random_uuid();
 e uuid:=gen_random_uuid(); e2 uuid:=gen_random_uuid(); draft uuid; pid uuid; eid uuid; removed uuid; job uuid;
 newpid uuid; neweid uuid; cat uuid; req uuid:=gen_random_uuid(); result jsonb; body jsonb; fields jsonb;
 actor uuid:=auth.uid(); unmanaged uuid:=gen_random_uuid(); legacy uuid; source_before jsonb; previous jsonb;
BEGIN
 SELECT category_id INTO cat FROM public.categories LIMIT 1;
 INSERT INTO public.content_versions(version_id,version_number,status) VALUES(source,1,'draft');
 INSERT INTO public.jobs(job_id,version_id,soc_code,title,median_hourly_wage,needs_english_skills,needs_computer_skills)
 VALUES(j,source,'11-1111','Persona persistence job fixture',10,false,false);
 INSERT INTO public.personas(persona_id,version_id,name,description,general_starting_balance,weekly_income,starting_job_id,has_english_skills,has_computer_skills)
 VALUES(p,source,'Source persona','Source description',100,9,j,NULL,true);
 INSERT INTO public.scenarios(scenario_id,version_id,title,description,category_id,persona_intent,schedule_type,default_day)
 VALUES(s,source,'Scheduled fixture','Fixture',cat,p,'scheduled',10);
 INSERT INTO public.persona_expenses(expense_id,persona_id,version_id,name,amount,first_due_day,late_fee_amount)
 VALUES(e,p,source,' Linked expense ',15.25,6,2),(e2,p,source,'Removable expense',0,7,0);
 INSERT INTO public.scenario_bill_links VALUES(e,s,source);
 UPDATE public.content_versions SET status='published',published_at=now() WHERE version_id=source;
 SELECT to_jsonb(row(p0,pg_temp.expenses(p))) INTO source_before FROM public.personas p0 WHERE persona_id=p;
 draft:=public.cms_create_draft(source,'Persona suite',gen_random_uuid());
 SELECT draft_id INTO pid FROM cms_private.lineage WHERE version_id=draft AND table_name='personas' AND source_id=p;
 SELECT draft_id INTO eid FROM cms_private.lineage WHERE version_id=draft AND table_name='persona_expenses' AND source_id=e;
 SELECT draft_id INTO removed FROM cms_private.lineage WHERE version_id=draft AND table_name='persona_expenses' AND source_id=e2;
 SELECT draft_id INTO job FROM cms_private.lineage WHERE version_id=draft AND table_name='jobs' AND source_id=j;
 ASSERT pid<>p AND eid<>e;
 ASSERT (SELECT persona_id=pid AND version_id=draft AND amount=15.25 AND late_fee_amount=2 FROM public.persona_expenses WHERE expense_id=eid);
 ASSERT (SELECT starting_job_id=job AND weekly_income=9 AND has_english_skills IS NULL FROM public.personas WHERE persona_id=pid);
 result:=public.cms_read_draft(draft);
 ASSERT jsonb_array_length(result->'expenses')=2 AND jsonb_array_length(result->'bill_links')=1;
 ASSERT result ?& ARRAY['scenarios','choices','facts','categories'];
 ASSERT result->'personas'->0->>'description'='Source description';
 ASSERT (SELECT version_id=draft AND expense_id=eid AND scenario_id<>s FROM public.scenario_bill_links WHERE expense_id=eid);
 fields:='{"name":"New persona","description":"New details","general_starting_balance":"250.50","has_english_skills":true,"has_computer_skills":false}';
 body:='[{"expense_id":null,"client_key":"new-1","name":"New recurring expense","amount":"10.25","late_fee_amount":"0","first_due_day":11,"repeat_interval_days":7}]';
 result:=public.cms_save_persona_bundle(draft,0,req,NULL,fields,body);
 ASSERT result=public.cms_save_persona_bundle(draft,0,req,NULL,fields,body);
 newpid:=(result->>'persona_id')::uuid; neweid:=(result->'new_expenses'->0->>'expense_id')::uuid;
 ASSERT (SELECT weekly_income=0 AND starting_job_id IS NULL AND general_starting_balance=250.50 FROM public.personas WHERE persona_id=newpid);
 ASSERT (SELECT persona_id=newpid AND version_id=draft AND repeat_interval_days=7 FROM public.persona_expenses WHERE expense_id=neweid);
 ASSERT NOT EXISTS(SELECT 1 FROM cms_private.lineage WHERE draft_id IN(newpid,neweid));
 PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,0,%L,NULL,%L,%L)',draft,req,fields||'{"name":"Altered"}',body),'Request reused');
 PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,0,%L,%L,%L,%L)',draft,gen_random_uuid(),pid,'{}',pg_temp.expenses(pid)),'Draft changed');
 -- Existing identities, optional NULLs, job/income and source lineage survive an edit.
 SELECT jsonb_build_array(value) INTO body FROM jsonb_array_elements(pg_temp.expenses(pid)) WHERE value->>'expense_id'=eid::text;
 PERFORM public.cms_save_persona_bundle(draft,1,gen_random_uuid(),pid,'{"name":"Edited persona"}',body);
 ASSERT NOT EXISTS(SELECT 1 FROM public.persona_expenses WHERE expense_id=removed);
 ASSERT NOT EXISTS(SELECT 1 FROM cms_private.lineage WHERE draft_id=removed);
 ASSERT (SELECT weekly_income=9 AND starting_job_id=job AND has_english_skills IS NULL FROM public.personas WHERE persona_id=pid);
 ASSERT (SELECT persona_id=pid AND name=' Linked expense ' FROM public.persona_expenses WHERE expense_id=eid), 'Unchanged expense content was modified by persona detail save';
 -- Reopen via read API after an independent save: persisted full fields/expenses.
 ASSERT EXISTS(SELECT 1 FROM jsonb_array_elements(public.cms_read_draft(draft)->'personas') x WHERE x->>'persona_id'=pid::text AND x->>'name'='Edited persona');
 PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,2,%L,%L,%L,%L)',draft,gen_random_uuid(),pid,'{"weekly_income":0}',body),'Unsupported persona field');
 PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,2,%L,%L,%L,NULL)',draft,gen_random_uuid(),pid,'{}'),'Explicit expense array');
 PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,2,%L,%L,%L,%L)',draft,gen_random_uuid(),p,'{}',body),'Persona must belong');
 PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,2,%L,%L,%L,%L)',draft,gen_random_uuid(),pid,'{}',pg_temp.expenses(newpid)),'outside selected persona');
 PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,2,%L,%L,%L,%L)',draft,gen_random_uuid(),pid,'{}',body||body),'Duplicate expense');
 PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,2,%L,%L,%L,%L)',draft,gen_random_uuid(),pid,'{}',jsonb_set(body,'{0,persona_id}',to_jsonb(p))),'Unsupported expense field');
 FOREACH fields IN ARRAY ARRAY['{"general_starting_balance":"-1"}'::jsonb,'{"general_starting_balance":"NaN"}','{"general_starting_balance":"Infinity"}','{"general_starting_balance":"1.001"}','{"general_starting_balance":"10000000000"}','{"has_english_skills":"false"}'] LOOP
   PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,2,%L,%L,%L,%L)',draft,gen_random_uuid(),pid,fields,body));
 END LOOP;
 FOR fields IN SELECT value FROM jsonb_array_elements('["-1","NaN","Infinity","1.001","10000000000",null,true]') LOOP
   PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,2,%L,%L,%L,%L)',draft,gen_random_uuid(),pid,'{}',jsonb_set(body,'{0,amount}',fields)));
   PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,2,%L,%L,%L,%L)',draft,gen_random_uuid(),pid,'{}',jsonb_set(body,'{0,late_fee_amount}',fields)));
 END LOOP;
 FOR fields IN SELECT value FROM jsonb_array_elements('[0,-1,32768,1.5,"2",null]') LOOP
   PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,2,%L,%L,%L,%L)',draft,gen_random_uuid(),pid,'{}',jsonb_set(body,'{0,first_due_day}',fields)));
 END LOOP;
 PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,2,%L,NULL,%L,%L)',draft,gen_random_uuid(),'{"name":"Incomplete"}','[]'),'New persona requires');
 PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,2,%L,%L,%L,%L)',draft,gen_random_uuid(),pid,'{}',jsonb_set(body,'{0,repeat_interval_days}','0')),'Invalid repeat interval');
 PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,2,%L,%L,%L,%L)',draft,gen_random_uuid(),pid,'{}',jsonb_set(body,'{0,repeat_interval_days}','32768')),'Invalid repeat interval');
 fields:='[{"expense_id":null,"client_key":"duplicate","name":"Duplicate","amount":"0","first_due_day":31,"repeat_interval_days":null,"late_fee_amount":"0"}]';
 PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,2,%L,%L,%L,%L)',draft,gen_random_uuid(),pid,'{}',fields||fields),'Unique new expense client key');
 -- Late collision validation rolls back prior persona/expense updates and receipt.
 req:=gen_random_uuid();
 PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,2,%L,%L,%L,%L)',draft,req,pid,'{"name":"Must roll back"}',jsonb_set(body,'{0,first_due_day}','10')),'schedule collision');
 ASSERT (SELECT name='Edited persona' FROM public.personas WHERE persona_id=pid);
 ASSERT (SELECT first_due_day=6 FROM public.persona_expenses WHERE expense_id=eid);
 ASSERT NOT EXISTS(SELECT 1 FROM cms_private.receipts WHERE version_id=draft AND request_id=req);
 PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,2,%L,%L,%L,%L)',draft,gen_random_uuid(),pid,'{}','[]'),'external dependencies');
 INSERT INTO public.cms_persona_test_dependency VALUES(neweid);
 PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,2,%L,%L,%L,%L)',draft,gen_random_uuid(),newpid,'{}','[]'),'external dependencies');
 ASSERT EXISTS(SELECT 1 FROM public.cms_persona_test_dependency WHERE id=neweid);
 -- Pre-existing invalid schedule: unrelated text edit works; changed schedule does not.
 INSERT INTO public.persona_expenses(persona_id,version_id,name,amount,first_due_day,late_fee_amount)
 VALUES(pid,draft,'Legacy collision',1,10,0) RETURNING expense_id INTO legacy;
 body:=pg_temp.expenses(pid);
 PERFORM public.cms_save_persona_bundle(draft,2,gen_random_uuid(),pid,'{"description":"Preserved schedule"}',body);
 SELECT jsonb_agg(CASE WHEN value->>'expense_id'=legacy::text THEN value||'{"first_due_day":3,"repeat_interval_days":7}' ELSE value END) INTO body FROM jsonb_array_elements(body);
 PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,3,%L,%L,%L,%L)',draft,gen_random_uuid(),pid,'{}',body),'schedule collision');
 ASSERT (SELECT revision=3 FROM cms_private.workspaces WHERE version_id=draft);
 -- Out-of-month definitions remain valid content and generate no occurrences.
 fields:=jsonb_set(jsonb_set(pg_temp.expenses(newpid),'{0,first_due_day}','31'),'{0,repeat_interval_days}','null');
 PERFORM public.cms_save_persona_bundle(draft,3,gen_random_uuid(),newpid,'{}',fields);
 ASSERT (SELECT first_due_day=31 AND repeat_interval_days IS NULL FROM public.persona_expenses WHERE expense_id=neweid);
 ASSERT NOT EXISTS(SELECT 1 FROM generate_series(31,30,31));
 SELECT to_jsonb(row(p0,pg_temp.expenses(p))) INTO previous FROM public.personas p0 WHERE persona_id=p;
 ASSERT previous=source_before;
 PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,0,%L,%L,%L,%L)',source,gen_random_uuid(),p,'{}',pg_temp.expenses(p)));
 INSERT INTO public.content_versions(version_id,version_number,status) VALUES(unmanaged,1,'draft');
 PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,0,%L,NULL,%L,%L)',unmanaged,gen_random_uuid(),'{}','[]'));
 UPDATE public.cac_staff SET active=false WHERE user_id=actor;
 PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,4,%L,%L,%L,%L)',draft,gen_random_uuid(),pid,'{}',body),'Active staff');
 PERFORM pg_temp.reject(format('SELECT public.cms_read_draft(%L)',draft),'Active staff');
 UPDATE public.cac_staff SET active=true WHERE user_id=actor;
 PERFORM set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 PERFORM pg_temp.reject(format('SELECT public.cms_save_persona_bundle(%L,4,%L,%L,%L,%L)',draft,gen_random_uuid(),pid,'{}',body),'Active staff');
 ASSERT NOT has_function_privilege('anon','public.cms_save_persona_bundle(uuid,integer,uuid,uuid,jsonb,jsonb)','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','cms_private.persona_money(jsonb)','EXECUTE');
 ASSERT NOT has_table_privilege('authenticated','public.personas','UPDATE');
 ASSERT NOT has_table_privilege('authenticated','public.persona_expenses','DELETE');
 RAISE NOTICE 'Persona copy/create/edit/reopen/defaults/identity/deletion/relationship/money/collision/rollback/retry/authorization tests passed';
END $$;
ROLLBACK;
