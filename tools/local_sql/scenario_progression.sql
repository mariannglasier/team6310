-- Local Day 4 integration; original employment RPC is unchanged.
BEGIN;
-- Remove only the temporary adapter introduced during this integration task.
DROP FUNCTION IF EXISTS public.submit_individual_action(uuid,uuid,integer,jsonb);
CREATE OR REPLACE FUNCTION public.integrate_local_day4_scenario() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF OLD.current_scenario_id='63100000-0000-4000-8000-000000000004'
 AND NEW.current_day IS DISTINCT FROM OLD.current_day AND NOT EXISTS(
 SELECT 1 FROM public.player_responses pr JOIN public.choices c ON c.choice_id=pr.choice_id
 WHERE pr.playthrough_id=OLD.playthrough_id AND c.scenario_id=OLD.current_scenario_id AND pr.version_id=OLD.version_id)
 THEN RAISE EXCEPTION 'Complete the current scenario before continuing'; END IF;
 IF NEW.current_day=4 AND NEW.employment_state->>'stage'='day' AND NEW.status='active'
 AND EXISTS(SELECT 1 FROM public.scenarios s WHERE s.scenario_id='63100000-0000-4000-8000-000000000004'
 AND s.version_id=NEW.version_id AND s.default_day=4 AND s.persona_intent=NEW.persona_id) THEN
 NEW.current_scenario_id:='63100000-0000-4000-8000-000000000004';
 ELSIF NEW.current_day<>4 AND OLD.current_scenario_id='63100000-0000-4000-8000-000000000004' THEN NEW.current_scenario_id:=NULL;
 END IF;
 RETURN NEW;
END $$;
ALTER FUNCTION public.integrate_local_day4_scenario() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.integrate_local_day4_scenario() FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE TRIGGER integrate_local_day4_scenario BEFORE UPDATE ON public.playthroughs
FOR EACH ROW EXECUTE FUNCTION public.integrate_local_day4_scenario();
NOTIFY pgrst,'reload schema';
COMMIT;
