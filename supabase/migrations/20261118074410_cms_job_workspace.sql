-- CMS jobs: draft authoring only; generated wages and gameplay remain unchanged.
BEGIN;
ALTER FUNCTION public.cms_read_draft(uuid) RENAME TO cms_read_draft_persona_content;
REVOKE ALL ON FUNCTION public.cms_read_draft_persona_content(uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.cms_read_draft(p_version uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
  RETURN public.cms_read_draft_persona_content(p_version) || jsonb_build_object('jobs',
    coalesce((SELECT jsonb_agg(to_jsonb(j) ORDER BY title,job_id) FROM public.jobs j WHERE version_id=p_version),'[]'::jsonb));
END $$;

CREATE FUNCTION cms_private.job_history(p_version uuid,p_job uuid) RETURNS boolean
LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.playthroughs r WHERE r.version_id=p_version OR r.current_job_id=p_job
    OR position(p_job::text IN lower(r.employment_state::text))>0)
 OR EXISTS(SELECT 1 FROM public.group_sessions g WHERE g.version_id=p_version OR g.selected_job_id=p_job
    OR position(p_job::text IN lower(to_jsonb(g)::text))>0)
 OR EXISTS(SELECT 1 FROM public.group_job_votes WHERE job_id=p_job)
$$;

CREATE FUNCTION public.cms_save_job(p_version uuid,p_revision integer,p_request uuid,p_job uuid,p_fields jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
 w cms_private.workspaces; receipt cms_private.receipts; previous public.jobs; edited public.jobs;
 jid uuid:=p_job; k text; value jsonb; number_value numeric; result jsonb;
 payload jsonb:=jsonb_build_array('job_save',p_revision,p_job,p_fields);
BEGIN
 PERFORM cms_private.require_staff();
 PERFORM set_config('lock_timeout','5s',true);
 SELECT * INTO STRICT w FROM cms_private.workspaces WHERE version_id=p_version FOR UPDATE;
 SELECT * INTO receipt FROM cms_private.receipts WHERE version_id=p_version AND request_id=p_request;
 IF FOUND THEN
   IF receipt.actor<>auth.uid() OR receipt.payload<>payload THEN RAISE EXCEPTION 'Request reused with different input'; END IF;
   RETURN receipt.result;
 END IF;
 IF p_request IS NULL OR w.revision IS DISTINCT FROM p_revision THEN
   RAISE EXCEPTION 'Draft changed. Reload before saving.' USING ERRCODE='40001'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.content_versions WHERE version_id=p_version AND cms_managed AND status='draft' AND published_at IS NULL)
 THEN RAISE EXCEPTION 'Editable CMS draft required'; END IF;
 IF jsonb_typeof(p_fields) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Job fields required'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_fields) key WHERE key NOT IN
 ('soc_code','title','description','area_code','area_name','geography_level','wage_year','median_hourly_wage','hours_per_week',
 'entry_education','related_experience','on_job_training','wage_source_url','requirements_source_url','reviewed_at',
 'is_approved','is_active','needs_english_skills','needs_computer_skills','requirements_notes')) THEN RAISE EXCEPTION 'Unsupported or read-only job field'; END IF;
 IF jid IS NULL THEN
   IF NOT(p_fields ?& ARRAY['soc_code','title','area_code','area_name','geography_level','hours_per_week','wage_source_url']) THEN
     RAISE EXCEPTION 'New jobs require SOC, title, area, geography, hours and wage source'; END IF;
   previous.simulation_requirements:='{}'; previous.is_approved:=false; previous.is_active:=false;
 ELSE
   SELECT * INTO previous FROM public.jobs WHERE job_id=jid AND version_id=p_version FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Job must belong to this draft'; END IF;
   -- Include non-FK employment receipt/history references in the protection.
   LOCK TABLE public.playthroughs,public.group_sessions,public.group_job_votes IN SHARE ROW EXCLUSIVE MODE;
   IF cms_private.job_history(p_version,jid) THEN RAISE EXCEPTION 'Job has historical gameplay references; no changes were saved'; END IF;
 END IF;
 FOR k,value IN SELECT * FROM jsonb_each(p_fields) LOOP
   IF k IN ('is_approved','is_active','needs_english_skills','needs_computer_skills') THEN
     IF jsonb_typeof(value) IS DISTINCT FROM 'boolean' AND NOT(k IN ('needs_english_skills','needs_computer_skills') AND value='null'::jsonb)
     THEN RAISE EXCEPTION 'Job flags must be boolean, or unconfigured skills'; END IF;
   ELSIF k IN ('median_hourly_wage','hours_per_week') THEN
     IF NOT(k='median_hourly_wage' AND value='null'::jsonb) THEN
       IF jsonb_typeof(value) NOT IN ('number','string') OR (value#>>'{}') !~ '^[0-9]+(\.[0-9]{1,2})?$'
       THEN RAISE EXCEPTION 'Wage and hours must be finite exact nonnegative decimals with at most two places'; END IF;
       number_value:=(value#>>'{}')::numeric;
       IF (k='median_hourly_wage' AND number_value>=100000000) OR (k='hours_per_week' AND (number_value<=0 OR number_value>168))
       THEN RAISE EXCEPTION 'Hourly wage or weekly hours out of range'; END IF;
     END IF;
   ELSIF k='wage_year' THEN
     IF value<>'null'::jsonb AND (jsonb_typeof(value)<>'number' OR (value#>>'{}') !~ '^[0-9]+$') THEN RAISE EXCEPTION 'Wage year must be an integer or empty'; END IF;
   ELSE
     IF jsonb_typeof(value) IS DISTINCT FROM 'string' AND NOT(value='null'::jsonb AND k IN
       ('description','entry_education','related_experience','on_job_training','requirements_source_url','reviewed_at','requirements_notes'))
     THEN RAISE EXCEPTION 'Job text field has invalid type'; END IF;
     IF k IN ('soc_code','title','area_code','area_name','wage_source_url') AND length(btrim(value#>>'{}'))=0
       AND (jid IS NULL OR value IS DISTINCT FROM to_jsonb(previous)->k) THEN RAISE EXCEPTION 'Required job text cannot be blank'; END IF;
   END IF;
 END LOOP;
 edited:=jsonb_populate_record(previous,p_fields-'requirements_notes');
 IF p_fields ? 'requirements_notes' THEN
   edited.simulation_requirements:=CASE WHEN p_fields->'requirements_notes'='null'::jsonb
     THEN previous.simulation_requirements-'notes'
     ELSE jsonb_set(previous.simulation_requirements,'{notes}',p_fields->'requirements_notes') END;
 END IF;
 IF edited.soc_code !~ '^[0-9]{2}-[0-9]{4}$' THEN RAISE EXCEPTION 'SOC must have format NN-NNNN'; END IF;
 IF edited.is_active AND (NOT edited.is_approved OR edited.median_hourly_wage IS NULL OR edited.wage_year IS NULL OR edited.reviewed_at IS NULL)
 THEN RAISE EXCEPTION 'Active jobs require approval, hourly wage, wage year and reviewed date'; END IF;
 -- PostgreSQL owns weekly_gross_income. Never supply or overwrite that column.
 IF jid IS NULL THEN
   jid:=gen_random_uuid();
   INSERT INTO public.jobs(job_id,version_id,soc_code,title,description,area_code,area_name,geography_level,wage_year,median_hourly_wage,hours_per_week,
     entry_education,related_experience,on_job_training,simulation_requirements,wage_source_url,requirements_source_url,reviewed_at,is_approved,is_active,needs_english_skills,needs_computer_skills)
   VALUES(jid,p_version,edited.soc_code,edited.title,edited.description,edited.area_code,edited.area_name,edited.geography_level,edited.wage_year,edited.median_hourly_wage,edited.hours_per_week,
     edited.entry_education,edited.related_experience,edited.on_job_training,edited.simulation_requirements,edited.wage_source_url,edited.requirements_source_url,edited.reviewed_at,edited.is_approved,edited.is_active,edited.needs_english_skills,edited.needs_computer_skills);
 ELSE
   UPDATE public.jobs SET soc_code=edited.soc_code,title=edited.title,description=edited.description,area_code=edited.area_code,area_name=edited.area_name,
     geography_level=edited.geography_level,wage_year=edited.wage_year,median_hourly_wage=edited.median_hourly_wage,hours_per_week=edited.hours_per_week,
     entry_education=edited.entry_education,related_experience=edited.related_experience,on_job_training=edited.on_job_training,
     simulation_requirements=edited.simulation_requirements,wage_source_url=edited.wage_source_url,requirements_source_url=edited.requirements_source_url,
     reviewed_at=edited.reviewed_at,is_approved=edited.is_approved,is_active=edited.is_active,needs_english_skills=edited.needs_english_skills,needs_computer_skills=edited.needs_computer_skills
   WHERE job_id=jid AND version_id=p_version;
 END IF;
 UPDATE cms_private.workspaces SET revision=revision+1,updated_at=now() WHERE version_id=p_version;
 result:=jsonb_build_object('job_id',jid,'revision',w.revision+1);
 INSERT INTO cms_private.receipts VALUES(p_version,p_request,auth.uid(),payload,result,now());
 RETURN result;
END $$;

CREATE FUNCTION public.cms_delete_job(p_version uuid,p_revision integer,p_request uuid,p_job uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE w cms_private.workspaces; receipt cms_private.receipts; x record; joins text; blocked boolean; result jsonb;
 payload jsonb:=jsonb_build_array('job_delete',p_revision,p_job);
BEGIN
 PERFORM cms_private.require_staff();
 PERFORM set_config('lock_timeout','5s',true);
 SELECT * INTO STRICT w FROM cms_private.workspaces WHERE version_id=p_version FOR UPDATE;
 SELECT * INTO receipt FROM cms_private.receipts WHERE version_id=p_version AND request_id=p_request;
 IF FOUND THEN
   IF receipt.actor<>auth.uid() OR receipt.payload<>payload THEN RAISE EXCEPTION 'Request reused with different input'; END IF;
   RETURN receipt.result;
 END IF;
 IF p_request IS NULL OR w.revision IS DISTINCT FROM p_revision THEN RAISE EXCEPTION 'Draft changed. Reload before deleting.' USING ERRCODE='40001'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.content_versions WHERE version_id=p_version AND cms_managed AND status='draft' AND published_at IS NULL)
 THEN RAISE EXCEPTION 'Unpublished CMS draft required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.jobs WHERE job_id=p_job AND version_id=p_version) THEN RAISE EXCEPTION 'Job must belong to this draft'; END IF;
 FOR x IN SELECT DISTINCT rel FROM (SELECT 'public.jobs'::regclass::oid rel UNION SELECT conrelid FROM pg_constraint
   WHERE contype='f' AND confrelid='public.jobs'::regclass UNION SELECT 'public.playthroughs'::regclass::oid UNION SELECT 'public.group_sessions'::regclass::oid) q ORDER BY rel LOOP
   EXECUTE format('LOCK TABLE %s IN SHARE ROW EXCLUSIVE MODE',x.rel::regclass);
 END LOOP;
 IF EXISTS(SELECT 1 FROM public.personas WHERE starting_job_id=p_job) THEN
   RAISE EXCEPTION 'A persona references this starting job. Persona assignments are read-only; this job cannot be deleted'; END IF;
 IF cms_private.job_history(p_version,p_job) THEN RAISE EXCEPTION 'Job has historical gameplay references and cannot be deleted'; END IF;
 FOR x IN SELECT * FROM pg_constraint WHERE contype='f' AND confrelid='public.jobs'::regclass LOOP
   SELECT string_agg(format('c.%I=j.%I',ca.attname,pa.attname),' AND ') INTO joins FROM unnest(x.conkey,x.confkey) k(ca,pa)
     JOIN pg_attribute ca ON ca.attrelid=x.conrelid AND ca.attnum=k.ca JOIN pg_attribute pa ON pa.attrelid=x.confrelid AND pa.attnum=k.pa;
   EXECUTE format('SELECT EXISTS(SELECT 1 FROM %s c JOIN public.jobs j ON %s WHERE j.job_id=$1)',x.conrelid::regclass,joins) INTO blocked USING p_job;
   IF blocked THEN RAISE EXCEPTION 'Job has external dependencies; nothing was deleted' USING DETAIL=format('Referencing table: %s',x.conrelid::regclass); END IF;
 END LOOP;
 DELETE FROM cms_private.lineage WHERE version_id=p_version AND table_name='jobs' AND draft_id=p_job;
 DELETE FROM public.jobs WHERE job_id=p_job AND version_id=p_version;
 UPDATE cms_private.workspaces SET revision=revision+1,updated_at=now() WHERE version_id=p_version;
 result:=jsonb_build_object('job_id',p_job,'revision',w.revision+1);
 INSERT INTO cms_private.receipts VALUES(p_version,p_request,auth.uid(),payload,result,now());
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION cms_private.job_history(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.cms_read_draft_persona_content(uuid) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.cms_read_draft(uuid),public.cms_save_job(uuid,integer,uuid,uuid,jsonb),public.cms_delete_job(uuid,integer,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cms_read_draft(uuid),public.cms_save_job(uuid,integer,uuid,uuid,jsonb),public.cms_delete_job(uuid,integer,uuid,uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
