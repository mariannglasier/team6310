-- LOCAL verification only. No tables or employment routines are changed.
BEGIN;
CREATE OR REPLACE FUNCTION public.submit_scenario_decision(p_run_id uuid,p_scenario_id uuid,p_choice_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.playthroughs%rowtype; s public.scenarios%rowtype;
 c public.choices%rowtype; prior public.player_responses%rowtype; delta numeric;
BEGIN
 IF auth.uid() IS NULL OR coalesce((auth.jwt()->>'is_anonymous')::boolean,false) IS NOT TRUE THEN RAISE EXCEPTION 'Anonymous participant required'; END IF;
 SELECT * INTO r FROM public.playthroughs WHERE playthrough_id=p_run_id AND owner_user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Run unavailable'; END IF;
 IF r.current_scenario_id IS DISTINCT FROM p_scenario_id OR r.version_id IS NULL OR r.session_id IS NOT NULL THEN RAISE EXCEPTION 'Scenario unavailable'; END IF;
 SELECT * INTO s FROM public.scenarios WHERE scenario_id=p_scenario_id AND version_id=r.version_id;
 IF NOT FOUND OR (s.persona_intent IS NOT NULL AND s.persona_intent<>r.persona_id) THEN RAISE EXCEPTION 'Scenario edition or persona mismatch'; END IF;
 SELECT * INTO c FROM public.choices WHERE choice_id=p_choice_id AND scenario_id=s.scenario_id AND version_id=r.version_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Choice edition or scenario mismatch'; END IF;
 SELECT pr.* INTO prior FROM public.player_responses pr JOIN public.choices ch ON ch.choice_id=pr.choice_id
 WHERE pr.playthrough_id=r.playthrough_id AND ch.scenario_id=s.scenario_id ORDER BY pr.answered_at,pr.response_id LIMIT 1;
 IF FOUND THEN
   IF prior.choice_id IS DISTINCT FROM p_choice_id OR prior.version_id IS DISTINCT FROM r.version_id THEN RAISE EXCEPTION 'Scenario already completed'; END IF;
   RETURN jsonb_build_object('run',to_jsonb(r),'response',to_jsonb(prior),'response_text',c.response_text);
 END IF;
 IF r.status IS DISTINCT FROM 'active' OR r.current_balance IS NULL OR r.current_balance::text IN ('NaN','Infinity','-Infinity') OR r.current_balance<>round(r.current_balance,2) THEN RAISE EXCEPTION 'Run not active or invalid balance'; END IF;
 IF r.current_day IS DISTINCT FROM s.default_day OR r.current_day=2 OR (r.current_day=3 AND (r.employment_state->>'hiredDay' IS DISTINCT FROM '2' OR r.employment_state->>'stage' IS DISTINCT FROM 'day')) THEN RAISE EXCEPTION 'Not an ordinary scenario day'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.content_versions WHERE version_id=r.version_id AND status='published' AND published_at IS NOT NULL) THEN RAISE EXCEPTION 'Edition unavailable'; END IF;
 -- This slice only supports direct balance effects, not CAC effects or expense settlement.
 IF EXISTS(SELECT 1 FROM public.cac_support_effects WHERE choice_id=c.choice_id) THEN RAISE EXCEPTION 'Unsupported support effect'; END IF;
 delta:=c.balance_change;
 IF delta IS NULL OR delta::text IN ('NaN','Infinity','-Infinity') OR delta<>round(delta,2) THEN RAISE EXCEPTION 'Invalid choice amount'; END IF;
 IF r.current_balance+delta<0 THEN
   UPDATE public.playthroughs SET status='ended' WHERE playthrough_id=r.playthrough_id RETURNING * INTO r;
   RETURN jsonb_build_object('run',to_jsonb(r),'response',null,'response_text','Your household could not afford this choice.');
 END IF;
 UPDATE public.playthroughs SET current_balance=current_balance+delta WHERE playthrough_id=r.playthrough_id RETURNING * INTO r;
 INSERT INTO public.player_responses(response_id,playthrough_id,choice_id,balance_change_applied,balance_after,answered_at,version_id)
 VALUES(gen_random_uuid(),r.playthrough_id,c.choice_id,delta,r.current_balance,clock_timestamp(),r.version_id) RETURNING * INTO prior;
 RETURN jsonb_build_object('run',to_jsonb(r),'response',to_jsonb(prior),'response_text',c.response_text);
END $$;
ALTER FUNCTION public.submit_scenario_decision(uuid,uuid,uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.submit_scenario_decision(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.submit_scenario_decision(uuid,uuid,uuid) TO authenticated;

-- One STABLE SQL statement supplies one MVCC snapshot for run, persona and response.
-- Invoker security retains existing RLS and grants; no elevated read authority.
CREATE OR REPLACE FUNCTION public.restore_scenario_decision(p_run_id uuid,p_scenario_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT jsonb_build_object('run',to_jsonb(p),'persona',to_jsonb(pe),
   'response',saved.items->0->'response','response_text',saved.items->0->'response_text',
   'response_count',saved.n)
 FROM public.playthroughs p
 JOIN public.scenarios s ON s.scenario_id=p.current_scenario_id AND s.version_id=p.version_id
 LEFT JOIN public.personas pe ON pe.persona_id=p.persona_id AND pe.version_id=p.version_id
 CROSS JOIN LATERAL (
   SELECT count(*) AS n,jsonb_agg(jsonb_build_object('response',to_jsonb(pr),'response_text',ch.response_text)
     ORDER BY pr.answered_at,pr.response_id) AS items
   FROM public.player_responses pr JOIN public.choices ch ON ch.choice_id=pr.choice_id
   WHERE pr.playthrough_id=p.playthrough_id AND ch.scenario_id=s.scenario_id
 ) saved
 WHERE p.playthrough_id=p_run_id AND p.current_scenario_id=p_scenario_id
 AND p.owner_user_id=auth.uid() AND coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
 AND p.session_id IS NULL;
$$;
ALTER FUNCTION public.restore_scenario_decision(uuid,uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.restore_scenario_decision(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.restore_scenario_decision(uuid,uuid) TO authenticated;

-- Local fixture provisioning only. Explicit user action; no existing run is upgraded.
CREATE OR REPLACE FUNCTION public.open_local_day4_run() RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE id uuid; p public.personas%rowtype;
BEGIN
 IF auth.uid() IS NULL OR coalesce((auth.jwt()->>'is_anonymous')::boolean,false) IS NOT TRUE THEN RAISE EXCEPTION 'Anonymous participant required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,6310));
 SELECT playthrough_id INTO id FROM public.playthroughs WHERE owner_user_id=auth.uid()
 AND current_scenario_id='63100000-0000-4000-8000-000000000004' AND current_day=4
 AND version_id='3c463a7f-7036-4e0c-9c1b-1f5db7c502f3' AND session_id IS NULL ORDER BY started_at,playthrough_id LIMIT 1;
 IF FOUND THEN RETURN id; END IF;
 SELECT * INTO p FROM public.personas WHERE persona_id='cfe33068-d657-482f-b770-ef3918a87e03'
 AND version_id='3c463a7f-7036-4e0c-9c1b-1f5db7c502f3' AND name='[LOCAL TEST] Alex';
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.scenarios WHERE scenario_id='63100000-0000-4000-8000-000000000004' AND version_id=p.version_id AND default_day=4 AND persona_intent=p.persona_id) THEN RAISE EXCEPTION 'Local fixture unavailable'; END IF;
 INSERT INTO public.playthroughs(playthrough_id,persona_id,version_id,owner_user_id,current_scenario_id,current_balance,current_day,status,started_at,session_id,current_job_id,employment_state,cac_support_enabledabled)
 VALUES(gen_random_uuid(),p.persona_id,p.version_id,auth.uid(),'63100000-0000-4000-8000-000000000004',p.general_starting_balance,4,'active',clock_timestamp(),null,null,null,false)
 RETURNING playthrough_id INTO id;
 RETURN id;
END $$;
ALTER FUNCTION public.open_local_day4_run() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.open_local_day4_run() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.open_local_day4_run() TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
