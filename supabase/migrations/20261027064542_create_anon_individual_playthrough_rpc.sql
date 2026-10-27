-- Recorded from the live project's migration history.
CREATE OR REPLACE FUNCTION public.start_individual_playthrough(p_persona_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_version uuid; v_balance numeric; v_id uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in anonymously first'; END IF;
 SELECT p.version_id,coalesce(p.general_starting_balance,0) INTO v_version,v_balance
 FROM public.personas p JOIN public.content_versions v ON v.version_id=p.version_id
 WHERE p.persona_id=p_persona_id AND v.status='published' AND v.published_at IS NOT NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Persona is not available'; END IF;
 INSERT INTO public.playthroughs(persona_id,version_id,owner_user_id,current_balance,current_day,status,started_at,session_id,current_scenario_id,current_job_id,employment_state,cac_support_enabledabled)
 VALUES (p_persona_id,v_version,auth.uid(),v_balance,1,'active',now(),NULL,NULL,NULL,NULL,NULL)
 RETURNING playthrough_id INTO v_id;
 RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.start_individual_playthrough(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.start_individual_playthrough(uuid) TO authenticated;
