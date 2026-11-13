-- Forward-only extension of the existing end action. No gameplay initialization,
-- financial rules, permissions, existing records, or initialized actions change.
BEGIN;
DO $migration$
DECLARE definition text; extension text;
BEGIN
 SELECT pg_get_functiondef('public.submit_employment_action(uuid,uuid,integer,jsonb)'::regprocedure)
 INTO definition;
 IF md5(definition) <> 'aa41a0b9b4cf8f7e9501bb8d0a4ff2e5' THEN
   RAISE EXCEPTION 'Employment action definition has drifted; review before extending';
 END IF;
 extension := $extension$
 -- This branch runs after authentication, request validation and the owned-row
 -- lock, but before employment-specific validation. All other actions, including
 -- initialized end requests, execute the original implementation below unchanged.
 IF a='end' AND jsonb_typeof(s)='object'
 AND (s->>'stage'='uninitialized'
      OR (s->>'stage'='ended' AND NOT (s ? 'prepared'))) THEN
   IF r.session_id IS NOT NULL OR r.current_day IS DISTINCT FROM 1
      OR r.current_job_id IS NOT NULL OR r.current_scenario_id IS NOT NULL
      OR r.cac_support_enabledabled IS NOT NULL OR r.current_balance IS NULL THEN
     RAISE EXCEPTION 'Not a fresh individual run';
   END IF;
   receipt := jsonb_build_object('action',p_action,'expectedRevision',0,
     'revision',1,'day',r.current_day,'change','0','stage','ended');
   IF s->>'stage'='ended' THEN
     IF r.status IS DISTINCT FROM 'ended' THEN RAISE EXCEPTION 'Inconsistent terminal run'; END IF;
     IF p_revision<>0 OR s IS DISTINCT FROM jsonb_build_object(
       'engine','employment-v1','schemaVersion',1,'stage','ended','revision',1,
       'reason','You ended the walkthrough.',
       'receipts',jsonb_build_object(p_request_id::text,receipt)) THEN
       RAISE EXCEPTION 'Run is not active or request identity reused';
     END IF;
     RETURN jsonb_build_object('run',to_jsonb(r),'receipt',receipt);
   END IF;
   IF r.status IS DISTINCT FROM 'active' THEN RAISE EXCEPTION 'Run is not active individual gameplay'; END IF;
   IF s IS DISTINCT FROM jsonb_build_object('engine','employment-v1','schemaVersion',1,
     'revision',0,'stage','uninitialized','receipts','{}'::jsonb) THEN
     RAISE EXCEPTION 'Unsupported fresh employment marker';
   END IF;
   IF p_revision<>0 THEN RAISE EXCEPTION 'Stale revision'; END IF;
   s := s || jsonb_build_object('stage','ended','reason','You ended the walkthrough.',
     'revision',1,'receipts',jsonb_build_object(p_request_id::text,receipt));
   UPDATE public.playthroughs SET status='ended',employment_state=s
   WHERE playthrough_id=p_run_id AND owner_user_id=auth.uid() RETURNING * INTO r;
   IF NOT FOUND THEN RAISE EXCEPTION 'Run unavailable'; END IF;
   RETURN jsonb_build_object('run',to_jsonb(r),'receipt',receipt);
 END IF;
$extension$;
 definition := replace(definition, 's := r.employment_state;',
   's := r.employment_state;' || extension);
 EXECUTE definition;
END $migration$;
NOTIFY pgrst, 'reload schema';
COMMIT;
