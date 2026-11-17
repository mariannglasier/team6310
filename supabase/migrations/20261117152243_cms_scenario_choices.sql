BEGIN;
CREATE TABLE cms_private.choice_order (
 version_id uuid NOT NULL REFERENCES cms_private.workspaces(version_id),
 choice_id uuid PRIMARY KEY REFERENCES public.choices(choice_id) ON DELETE CASCADE,
 position integer NOT NULL CHECK(position>=0)
);
ALTER TABLE cms_private.choice_order ENABLE ROW LEVEL SECURITY;
ALTER FUNCTION public.cms_read_draft(uuid) RENAME TO cms_read_draft_core;
REVOKE ALL ON FUNCTION public.cms_read_draft_core(uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.cms_read_draft(p_version uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 RETURN public.cms_read_draft_core(p_version)||jsonb_build_object('choices',coalesce((
 SELECT jsonb_agg(to_jsonb(c) ORDER BY coalesce(o.position,0),c.choice_id) FROM public.choices c
 LEFT JOIN cms_private.choice_order o USING(choice_id) WHERE c.version_id=p_version),'[]'));
END $$;
CREATE FUNCTION public.cms_save_scenario_bundle(p_version uuid,p_revision integer,p_request uuid,p_scenario uuid,p_title text,p_description text,p_category uuid,p_persona uuid,p_schedule text,p_day integer,p_choices jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE bundle_payload jsonb:=jsonb_build_array(p_revision,p_scenario,p_title,p_description,p_category,p_persona,p_schedule,p_day,p_choices); receipt cms_private.receipts; result jsonb; sid uuid; ch jsonb; cid uuid; seen uuid[]:='{}'; pos integer:=0; amount numeric; upfront numeric;
BEGIN
 PERFORM cms_private.require_staff();
 PERFORM 1 FROM cms_private.workspaces WHERE version_id=p_version FOR UPDATE;
 SELECT * INTO receipt FROM cms_private.receipts WHERE version_id=p_version AND request_id=p_request;
 IF FOUND THEN
 IF receipt.actor<>auth.uid() OR receipt.payload<>bundle_payload THEN RAISE EXCEPTION 'Request reused with different input'; END IF;
 RETURN receipt.result; END IF;
 IF p_schedule IS NULL OR p_schedule NOT IN ('scheduled','non_scheduled') OR (p_schedule='scheduled' AND (p_day IS NULL OR p_day NOT BETWEEN 1 AND 30)) OR (p_schedule='non_scheduled' AND p_day IS NOT NULL) THEN RAISE EXCEPTION 'Invalid schedule'; END IF;
 IF jsonb_typeof(p_choices) IS DISTINCT FROM 'array' OR jsonb_array_length(p_choices)>50 THEN RAISE EXCEPTION 'Invalid choices'; END IF;
 UPDATE public.scenarios SET schedule_type=p_schedule,default_day=p_day,persona_intent=p_persona WHERE scenario_id=p_scenario AND version_id=p_version;
 result:=public.cms_save_scenario(p_version,p_revision,p_request,p_scenario,p_title,p_description,p_category,p_persona);
 sid:=(result->>'scenario_id')::uuid;
 UPDATE public.scenarios SET schedule_type=p_schedule,default_day=p_day WHERE scenario_id=sid AND version_id=p_version;
 FOR ch IN SELECT value FROM jsonb_array_elements(p_choices) LOOP
 cid:=nullif(ch->>'choice_id','')::uuid;
 IF cid IS NOT NULL AND (cid=ANY(seen) OR NOT EXISTS(SELECT 1 FROM public.choices WHERE choice_id=cid AND scenario_id=sid AND version_id=p_version)) THEN RAISE EXCEPTION 'Invalid choice ownership'; END IF;
 IF length(btrim(coalesce(ch->>'choice_text',''))) NOT BETWEEN 1 AND 2000 OR length(btrim(coalesce(ch->>'response_text',''))) NOT BETWEEN 1 AND 10000 OR jsonb_typeof(ch->'requires_cac') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Complete choice text and response required'; END IF;
 amount:=(ch->>'balance_change')::numeric; upfront:=(ch->>'upfront_cost')::numeric;
 IF amount IS NULL OR upfront IS NULL OR amount::text IN ('NaN','Infinity','-Infinity') OR upfront::text IN ('NaN','Infinity','-Infinity') OR abs(amount)>=10000000000 OR upfront<0 OR upfront>=10000000000 OR amount<>round(amount,2) OR upfront<>round(upfront,2) THEN RAISE EXCEPTION 'Invalid choice money'; END IF;
 IF nullif(ch->>'next_scenario_id','') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.scenarios WHERE scenario_id=(ch->>'next_scenario_id')::uuid AND version_id=p_version) THEN RAISE EXCEPTION 'Destination must belong to draft'; END IF;
 IF cid IS NULL THEN cid:=gen_random_uuid(); INSERT INTO public.choices(choice_id,scenario_id,version_id,next_scenario_id) VALUES(cid,sid,p_version,NULL); END IF;
 UPDATE public.choices SET choice_text=ch->>'choice_text',response_text=ch->>'response_text',balance_change=amount,upfront_cost=upfront,requires_cac=(ch->>'requires_cac')::boolean,next_scenario_id=nullif(ch->>'next_scenario_id','')::uuid WHERE choice_id=cid;
 INSERT INTO cms_private.choice_order VALUES(p_version,cid,pos) ON CONFLICT(choice_id) DO UPDATE SET position=excluded.position;
 seen:=array_append(seen,cid); pos:=pos+1;
 END LOOP;
 DELETE FROM public.choices WHERE scenario_id=sid AND version_id=p_version AND NOT(choice_id=ANY(seen));
 UPDATE cms_private.receipts r SET payload=bundle_payload WHERE r.version_id=p_version AND r.request_id=p_request;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.cms_read_draft(uuid),public.cms_save_scenario_bundle(uuid,integer,uuid,uuid,text,text,uuid,uuid,text,integer,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cms_read_draft(uuid),public.cms_save_scenario_bundle(uuid,integer,uuid,uuid,text,text,uuid,uuid,text,integer,jsonb) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
