\set ON_ERROR_STOP on
BEGIN;
SELECT set_config('request.jwt.claim.sub',(SELECT user_id::text FROM public.cac_staff WHERE active LIMIT 1),true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
CREATE TABLE public.cms_job_dependency_test(id uuid REFERENCES public.jobs(job_id) ON DELETE CASCADE);
CREATE FUNCTION pg_temp.job_reject(query text, expected text DEFAULT NULL) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
 BEGIN EXECUTE query; EXCEPTION WHEN OTHERS THEN IF expected IS NOT NULL AND position(expected IN SQLERRM)=0 THEN RAISE; END IF; RETURN; END;
 RAISE EXCEPTION 'Expected rejection: %',query;
END $$;
DO $$
DECLARE source uuid:=gen_random_uuid(); j uuid:=gen_random_uuid(); p uuid:=gen_random_uuid(); draft uuid; jid uuid; pid uuid;
 req uuid:=gen_random_uuid(); result jsonb; fields jsonb; nj uuid; group_id uuid; actor uuid:=auth.uid(); v jsonb;
BEGIN
 INSERT INTO public.content_versions(version_id,version_number,status) VALUES(source,1,'draft');
 INSERT INTO public.jobs(job_id,version_id,soc_code,title,median_hourly_wage,hours_per_week,simulation_requirements,last_synced_at,needs_english_skills,needs_computer_skills)
 VALUES(j,source,'11-1111','Source job',10.25,37.50,'{"notes":{"raw":true},"legacy":{"keep":[1,2]}}','2025-01-01Z',NULL,false);
 INSERT INTO public.personas(persona_id,version_id,name,general_starting_balance,weekly_income,starting_job_id) VALUES(p,source,'Source persona',100,9,j);
 UPDATE public.content_versions SET status='published',published_at=now() WHERE version_id=source;
 draft:=public.cms_create_draft(source,'Job suite',gen_random_uuid());
 SELECT draft_id INTO jid FROM cms_private.lineage WHERE version_id=draft AND table_name='jobs' AND source_id=j;
 SELECT draft_id INTO pid FROM cms_private.lineage WHERE version_id=draft AND table_name='personas' AND source_id=p;
 ASSERT jid<>j;
 ASSERT (SELECT starting_job_id=jid FROM public.personas WHERE persona_id=pid);
 ASSERT (SELECT weekly_gross_income=384.38 AND simulation_requirements='{"notes":{"raw":true},"legacy":{"keep":[1,2]}}'::jsonb FROM public.jobs WHERE job_id=jid);
 ASSERT jsonb_array_length(public.cms_read_draft(draft)->'jobs')=1;
 fields:='{"title":"Edited job","median_hourly_wage":"12.34","hours_per_week":"30.25","requirements_notes":"Shown note"}';
 result:=public.cms_save_job(draft,0,req,jid,fields);
 ASSERT result=public.cms_save_job(draft,0,req,jid,fields);
 ASSERT (SELECT weekly_gross_income=373.29 AND needs_english_skills IS NULL AND wage_year IS NULL AND last_synced_at='2025-01-01Z'::timestamptz
   AND simulation_requirements='{"notes":"Shown note","legacy":{"keep":[1,2]}}'::jsonb FROM public.jobs WHERE job_id=jid);
 ASSERT (SELECT starting_job_id=jid AND weekly_income=9 FROM public.personas WHERE persona_id=pid);
 PERFORM pg_temp.job_reject(format('SELECT public.cms_save_job(%L,0,%L,%L,%L)',draft,gen_random_uuid(),jid,'{}'),'Draft changed');
 PERFORM pg_temp.job_reject(format('SELECT public.cms_save_job(%L,0,%L,%L,%L)',draft,req,jid,'{"title":"Different"}'),'Request reused');
 PERFORM pg_temp.job_reject(format('SELECT public.cms_save_job(%L,1,%L,%L,%L)',draft,gen_random_uuid(),j,'{}'),'belong to this draft');
 FOREACH fields IN ARRAY ARRAY['{"weekly_gross_income":100}'::jsonb,'{"job_id":"00000000-0000-4000-8000-000000000001"}','{"version_id":null}','{"last_synced_at":null}','{"created_at":null}','{"simulation_requirements":{}}'] LOOP
  PERFORM pg_temp.job_reject(format('SELECT public.cms_save_job(%L,1,%L,%L,%L)',draft,gen_random_uuid(),jid,fields),'read-only');
 END LOOP;
 FOREACH fields IN ARRAY ARRAY['{"median_hourly_wage":"1.001"}'::jsonb,'{"median_hourly_wage":"NaN"}','{"median_hourly_wage":"Infinity"}','{"median_hourly_wage":"-1"}','{"hours_per_week":"0"}','{"hours_per_week":"168.01"}','{"hours_per_week":"1.001"}','{"wage_year":1999}','{"soc_code":"bad"}','{"is_active":true}','{"geography_level":"CITY"}','{"reviewed_at":"not a timestamp"}'] LOOP
  PERFORM pg_temp.job_reject(format('SELECT public.cms_save_job(%L,1,%L,%L,%L)',draft,gen_random_uuid(),jid,fields));
 END LOOP;
 ASSERT (SELECT revision=1 FROM cms_private.workspaces WHERE version_id=draft);
 ASSERT (SELECT title='Edited job' AND weekly_gross_income=373.29 FROM public.jobs WHERE job_id=jid);
 fields:='{"soc_code":"22-2222","title":"New incomplete","area_code":"12060","area_name":"Authored area","geography_level":"MSA","hours_per_week":"40","wage_source_url":"https://example.org"}';
 req:=gen_random_uuid(); result:=public.cms_save_job(draft,1,req,NULL,fields); nj:=(result->>'job_id')::uuid;
 ASSERT result=public.cms_save_job(draft,1,req,NULL,fields);
 ASSERT (SELECT weekly_gross_income IS NULL AND median_hourly_wage IS NULL AND NOT is_active AND NOT is_approved AND last_synced_at IS NULL FROM public.jobs WHERE job_id=nj);
 ASSERT NOT EXISTS(SELECT 1 FROM cms_private.lineage WHERE draft_id=nj);
 PERFORM pg_temp.job_reject(format('SELECT public.cms_save_job(%L,2,%L,NULL,%L)',draft,gen_random_uuid(),fields),'jobs_version_id_soc_code_key');
 PERFORM pg_temp.job_reject(format('SELECT public.cms_save_job(%L,2,%L,%L,%L)',draft,gen_random_uuid(),nj,'{"median_hourly_wage":"99999999.99","hours_per_week":"168"}'));
 PERFORM public.cms_save_job(draft,2,gen_random_uuid(),nj,'{"median_hourly_wage":"15.25","wage_year":2026,"reviewed_at":"2026-11-18T12:00:00Z","is_approved":true,"is_active":true}');
 ASSERT (SELECT weekly_gross_income=610 AND is_active AND is_approved FROM public.jobs WHERE job_id=nj);
 ASSERT EXISTS(SELECT 1 FROM jsonb_array_elements(public.cms_read_draft(draft)->'jobs') x WHERE x->>'job_id'=nj::text AND x->>'weekly_gross_income'='610.00');
 PERFORM pg_temp.job_reject(format('SELECT public.cms_delete_job(%L,3,%L,%L)',draft,gen_random_uuid(),jid),'persona references');
 INSERT INTO public.cms_job_dependency_test VALUES(nj);
 PERFORM pg_temp.job_reject(format('SELECT public.cms_delete_job(%L,3,%L,%L)',draft,gen_random_uuid(),nj),'external dependencies');
 ASSERT EXISTS(SELECT 1 FROM public.cms_job_dependency_test WHERE id=nj);
 DELETE FROM public.cms_job_dependency_test WHERE id=nj;
 INSERT INTO public.group_sessions(join_code,version_id,current_scenario_id,selected_job_id,host_user_id) VALUES('ZXJ876',draft,NULL,nj,actor) RETURNING session_id INTO group_id;
 PERFORM pg_temp.job_reject(format('SELECT public.cms_save_job(%L,3,%L,%L,%L)',draft,gen_random_uuid(),nj,'{"title":"Historical mutation"}'),'historical gameplay');
 PERFORM pg_temp.job_reject(format('SELECT public.cms_delete_job(%L,3,%L,%L)',draft,gen_random_uuid(),nj),'historical gameplay');
 DELETE FROM public.group_sessions WHERE session_id=group_id;
 UPDATE public.cac_staff SET active=false WHERE user_id=actor;
 PERFORM pg_temp.job_reject(format('SELECT public.cms_save_job(%L,3,%L,%L,%L)',draft,gen_random_uuid(),nj,'{}'),'Active staff');
 PERFORM pg_temp.job_reject(format('SELECT public.cms_delete_job(%L,3,%L,%L)',draft,gen_random_uuid(),nj),'Active staff');
 UPDATE public.cac_staff SET active=true WHERE user_id=actor;
 PERFORM set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 PERFORM pg_temp.job_reject(format('SELECT public.cms_save_job(%L,3,%L,%L,%L)',draft,gen_random_uuid(),nj,'{}'),'Active staff');
 PERFORM set_config('request.jwt.claim.sub',actor::text,true);
 req:=gen_random_uuid(); result:=public.cms_delete_job(draft,3,req,nj);
 ASSERT result=public.cms_delete_job(draft,3,req,nj);
 ASSERT NOT EXISTS(SELECT 1 FROM public.jobs WHERE job_id=nj);
 ASSERT (SELECT title='Source job' AND weekly_gross_income=384.38 FROM public.jobs WHERE job_id=j);
 PERFORM pg_temp.job_reject(format('SELECT public.cms_save_job(%L,0,%L,%L,%L)',source,gen_random_uuid(),j,'{}'));
 PERFORM pg_temp.job_reject(format('SELECT public.cms_delete_job(%L,0,%L,%L)',source,gen_random_uuid(),j));
 ASSERT NOT has_function_privilege('anon','public.cms_save_job(uuid,integer,uuid,uuid,jsonb)','EXECUTE');
 ASSERT NOT has_function_privilege('anon','public.cms_delete_job(uuid,integer,uuid,uuid)','EXECUTE');
 ASSERT NOT has_table_privilege('authenticated','public.jobs','UPDATE');
 ASSERT NOT has_function_privilege('authenticated','cms_private.job_history(uuid,uuid)','EXECUTE');
 RAISE NOTICE 'Job copy/generated income/create/edit/reopen/legacy metadata/relationships/delete blockers/money/rollback/retry/stale/authorization passed';
END $$;
ROLLBACK;
