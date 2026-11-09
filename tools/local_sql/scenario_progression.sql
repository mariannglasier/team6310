-- Local scheduled-scenario integration; original employment RPC is unchanged.
BEGIN;
-- Naming-only upgrade for verification databases installed before this rename.
DO $$ BEGIN
 IF to_regprocedure('public.integrate_local_day4_scenario()') IS NOT NULL THEN
   ALTER FUNCTION public.integrate_local_day4_scenario() RENAME TO manage_scheduled_scenario_progression;
 END IF;
 IF EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.playthroughs'::regclass AND tgname='integrate_local_day4_scenario') THEN
   ALTER TRIGGER integrate_local_day4_scenario ON public.playthroughs RENAME TO playthroughs_manage_scheduled_scenario_progression;
 END IF;
END $$;
CREATE OR REPLACE FUNCTION public.manage_scheduled_scenario_progression() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE candidates integer; selected_id uuid;
BEGIN
 IF OLD.current_scenario_id IS NOT NULL
 AND (NEW.current_day IS DISTINCT FROM OLD.current_day OR NEW.employment_state->>'stage'='complete')
 AND NOT EXISTS(SELECT 1 FROM public.player_responses pr JOIN public.choices c ON c.choice_id=pr.choice_id
 WHERE pr.playthrough_id=OLD.playthrough_id AND c.scenario_id=OLD.current_scenario_id AND pr.version_id=OLD.version_id)
 THEN RAISE EXCEPTION 'Complete the current scenario before continuing'; END IF;
 IF NEW.current_day IS DISTINCT FROM OLD.current_day THEN NEW.current_scenario_id:=NULL; END IF;
 IF NEW.current_scenario_id IS NULL AND NEW.employment_state->>'stage'='day' AND NEW.status='active'
 AND NEW.current_day BETWEEN 1 AND 30 AND NEW.current_day<>2
 AND (NEW.current_day<>3 OR NEW.employment_state->>'hiredDay'='2') THEN
   SELECT count(*),(array_agg(s.scenario_id))[1] INTO candidates,selected_id
   FROM public.scenarios s JOIN public.content_versions v ON v.version_id=s.version_id
   WHERE s.version_id=NEW.version_id AND s.persona_intent=NEW.persona_id
   AND s.schedule_type='scheduled' AND s.default_day=NEW.current_day
   AND v.status='published' AND v.published_at IS NOT NULL;
   IF candidates>1 THEN RAISE EXCEPTION 'Multiple scheduled scenarios for this persona/day; resolve content collision'; END IF;
   IF candidates=1 THEN NEW.current_scenario_id:=selected_id; END IF;
 END IF;
 RETURN NEW;
END $$;
ALTER FUNCTION public.manage_scheduled_scenario_progression() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.manage_scheduled_scenario_progression() FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE TRIGGER playthroughs_manage_scheduled_scenario_progression BEFORE UPDATE ON public.playthroughs
FOR EACH ROW EXECUTE FUNCTION public.manage_scheduled_scenario_progression();
NOTIFY pgrst,'reload schema';
COMMIT;
