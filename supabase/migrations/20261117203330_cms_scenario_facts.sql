-- Scenario-specific copy only. No service-fact, statistic or gameplay changes.
BEGIN;
ALTER FUNCTION public.cms_read_draft(uuid) RENAME TO cms_read_draft_choices;
REVOKE ALL ON FUNCTION public.cms_read_draft_choices(uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.cms_read_draft(p_version uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 RETURN public.cms_read_draft_choices(p_version)||jsonb_build_object('facts',coalesce((SELECT jsonb_agg(to_jsonb(f) ORDER BY scenario_id,fact_role) FROM public.scenario_fact_copy f WHERE version_id=p_version),'[]'));
END $$;
CREATE FUNCTION public.cms_save_scenario_content(p_version uuid,p_revision integer,p_request uuid,p_scenario uuid,p_title text,p_description text,p_category uuid,p_persona uuid,p_schedule text,p_day integer,p_choices jsonb,p_facts jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE bundle_payload jsonb:=jsonb_build_array('scenario_content',p_revision,p_scenario,p_title,p_description,p_category,p_persona,p_schedule,p_day,p_choices,p_facts); receipt cms_private.receipts; result jsonb; sid uuid; f jsonb; roles text[]:='{}'; originals text[]:='{}'; role text; original text;
BEGIN
 PERFORM cms_private.require_staff();
 PERFORM 1 FROM cms_private.workspaces WHERE version_id=p_version FOR UPDATE;
 SELECT * INTO receipt FROM cms_private.receipts WHERE version_id=p_version AND request_id=p_request;
 IF FOUND THEN
 IF receipt.actor<>auth.uid() OR receipt.payload<>bundle_payload THEN RAISE EXCEPTION 'Request reused with different input'; END IF;
 RETURN receipt.result; END IF;
 IF jsonb_typeof(p_facts) IS DISTINCT FROM 'array' OR jsonb_array_length(p_facts)>2 THEN RAISE EXCEPTION 'At most one scenario fact per role'; END IF;
 -- Validate identities/allowed fields before any mutation. Evidence and semantic keys
 -- are immutable through this editor; omitted eligibility preserves existing values.
 FOR f IN SELECT value FROM jsonb_array_elements(p_facts) LOOP
 IF jsonb_typeof(f) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid fact'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(f) k WHERE k NOT IN ('original_role','fact_role','display_text','source_url','reporting_period','copy_kind','verified')) THEN RAISE EXCEPTION 'Unsupported fact field or relationship'; END IF;
 role:=f->>'fact_role'; original:=f->>'original_role';
 IF role IS NULL OR role NOT IN ('general','cac') OR role=ANY(roles) THEN RAISE EXCEPTION 'Invalid or duplicate fact role'; END IF;
 roles:=array_append(roles,role);
 IF original IS NOT NULL THEN
 IF original<>role OR NOT EXISTS(SELECT 1 FROM public.scenario_fact_copy WHERE scenario_id=p_scenario AND version_id=p_version AND fact_role=original) THEN RAISE EXCEPTION 'Fact must belong to selected scenario and edition'; END IF;
 originals:=array_append(originals,original);
 END IF;
 IF length(btrim(coalesce(f->>'display_text',''))) NOT BETWEEN 1 AND 20000 OR (f->>'display_text') ~ '[{}]' OR coalesce(f->>'source_url','') !~ '^https://[^[:space:]]+$' OR coalesce(f->>'copy_kind','') NOT IN ('fact','context') THEN RAISE EXCEPTION 'Invalid scenario fact content'; END IF;
 IF f ? 'verified' AND jsonb_typeof(f->'verified') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Invalid display eligibility'; END IF;
 IF f ? 'reporting_period' AND jsonb_typeof(f->'reporting_period') NOT IN ('string','null') THEN RAISE EXCEPTION 'Invalid reporting period'; END IF;
 END LOOP;
 result:=public.cms_save_scenario_bundle(p_version,p_revision,p_request,p_scenario,p_title,p_description,p_category,p_persona,p_schedule,p_day,p_choices);
 sid:=(result->>'scenario_id')::uuid;
 DELETE FROM public.scenario_fact_copy WHERE scenario_id=sid AND version_id=p_version AND NOT(fact_role=ANY(originals));
 FOR f IN SELECT value FROM jsonb_array_elements(p_facts) LOOP
 role:=f->>'fact_role'; original:=f->>'original_role';
 IF original IS NULL THEN
 INSERT INTO public.scenario_fact_copy(scenario_id,version_id,fact_role,semantic_key,display_text,source_url,reporting_period,copy_kind,verified)
 VALUES(sid,p_version,role,'cms:'||gen_random_uuid()::text,f->>'display_text',f->>'source_url',f->>'reporting_period',f->>'copy_kind',coalesce((f->>'verified')::boolean,false));
 ELSE
 UPDATE public.scenario_fact_copy SET display_text=f->>'display_text',source_url=f->>'source_url',reporting_period=CASE WHEN f ? 'reporting_period' THEN f->>'reporting_period' ELSE reporting_period END,copy_kind=f->>'copy_kind',verified=CASE WHEN f ? 'verified' THEN (f->>'verified')::boolean ELSE verified END
 WHERE scenario_id=sid AND version_id=p_version AND fact_role=original;
 END IF;
 END LOOP;
 UPDATE cms_private.receipts r SET payload=bundle_payload WHERE r.version_id=p_version AND r.request_id=p_request;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.cms_read_draft(uuid),public.cms_save_scenario_content(uuid,integer,uuid,uuid,text,text,uuid,uuid,text,integer,jsonb,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cms_read_draft(uuid),public.cms_save_scenario_content(uuid,integer,uuid,uuid,text,text,uuid,uuid,text,integer,jsonb,jsonb) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
