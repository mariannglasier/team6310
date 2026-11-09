BEGIN;
ALTER TABLE public.choices
 ADD COLUMN requires_cac boolean NOT NULL DEFAULT false,
 ADD COLUMN upfront_cost numeric NOT NULL DEFAULT 0 CHECK (upfront_cost>=0 AND upfront_cost=round(upfront_cost,2));
CREATE TABLE public.scenario_library_metadata (
 scenario_id uuid PRIMARY KEY REFERENCES public.scenarios(scenario_id),
 version_id uuid NOT NULL REFERENCES public.content_versions(version_id),
 library_key text NOT NULL CHECK(library_key ~ '^D[0-9]{3}$'),
 engine text NOT NULL CHECK(engine IN ('ordinary','employment','bill')),
 requires_employment boolean NOT NULL DEFAULT false,
 enabled boolean NOT NULL DEFAULT true,
 UNIQUE(version_id,library_key,scenario_id)
);
ALTER TABLE public.scenario_library_metadata ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.scenario_library_metadata FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.scenario_library_metadata TO service_role;
CREATE POLICY library_metadata_published ON public.scenario_library_metadata FOR SELECT TO authenticated
USING(EXISTS(SELECT 1 FROM public.content_versions v WHERE v.version_id=scenario_library_metadata.version_id AND v.status='published'));
GRANT SELECT ON public.scenario_library_metadata TO authenticated;

-- Only library editions use the pool selector. Older editions retain the
-- existing scheduler and pinned content unchanged.
CREATE OR REPLACE FUNCTION public.manage_scheduled_scenario_progression() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE candidates integer; selected_id uuid; library_edition boolean;
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
   IF EXISTS(SELECT 1 FROM public.playthrough_expenses e WHERE e.playthrough_id=NEW.playthrough_id AND e.due_day=NEW.current_day)
   THEN RETURN NEW; END IF;
   SELECT EXISTS(SELECT 1 FROM public.scenario_library_metadata m WHERE m.version_id=NEW.version_id) INTO library_edition;
   IF library_edition THEN
     SELECT s.scenario_id INTO selected_id
     FROM public.scenarios s JOIN public.scenario_library_metadata m USING(scenario_id,version_id)
     JOIN public.content_versions v USING(version_id)
     WHERE s.version_id=NEW.version_id AND s.persona_intent=NEW.persona_id
       AND v.status='published' AND v.published_at IS NOT NULL AND m.enabled AND m.engine='ordinary'
       AND (NOT m.requires_employment OR NEW.current_job_id IS NOT NULL)
       AND ((s.schedule_type='scheduled' AND s.default_day=NEW.current_day)
         OR (s.schedule_type='non_scheduled' AND m.library_key<>'D005'))
       AND NOT EXISTS(SELECT 1 FROM public.player_responses pr JOIN public.choices c ON c.choice_id=pr.choice_id
         WHERE pr.playthrough_id=NEW.playthrough_id AND c.scenario_id=s.scenario_id AND pr.version_id=NEW.version_id)
     ORDER BY (s.schedule_type='scheduled') DESC,md5(NEW.playthrough_id::text||NEW.current_day::text||s.scenario_id::text)
     LIMIT 1;
     IF selected_id IS NULL THEN RAISE EXCEPTION 'No eligible unused scenario for this day'; END IF;
   ELSE
     SELECT count(*),(array_agg(s.scenario_id))[1] INTO candidates,selected_id
     FROM public.scenarios s JOIN public.content_versions v ON v.version_id=s.version_id
     WHERE s.version_id=NEW.version_id AND s.persona_intent=NEW.persona_id
       AND s.schedule_type='scheduled' AND s.default_day=NEW.current_day
       AND v.status='published' AND v.published_at IS NOT NULL;
     IF candidates>1 THEN RAISE EXCEPTION 'Multiple scheduled scenarios for this persona/day'; END IF;
   END IF;
   NEW.current_scenario_id:=selected_id;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.manage_scheduled_scenario_progression() FROM PUBLIC,anon,authenticated,service_role;

-- Retain the original ownership/idempotency/atomic response implementation.
-- The following changes only broaden its day check for the routed pool and
-- add CAC-mode and upfront-fee guards before any financial mutation.
DO $$
DECLARE def text;
BEGIN
 SELECT pg_get_functiondef('public.submit_scenario_decision(uuid,uuid,uuid)'::regprocedure) INTO def;
 IF position('IF r.current_day IS DISTINCT FROM s.default_day OR' IN def)=0
 OR position('IF r.current_balance+delta<0 THEN' IN def)=0
 OR position('delta:=c.balance_change;' IN def)=0
 THEN RAISE EXCEPTION 'Scenario submission function has drifted; review before upgrading'; END IF;
 def:=replace(def,'IF r.current_day IS DISTINCT FROM s.default_day OR',
   'IF (s.schedule_type=''scheduled'' AND r.current_day IS DISTINCT FROM s.default_day) OR');
 def:=replace(def,'delta:=c.balance_change;',
   'IF c.requires_cac AND r.cac_support_enabledabled IS NOT TRUE THEN RAISE EXCEPTION ''CAC choice unavailable''; END IF; delta:=c.balance_change;');
 def:=replace(def,'IF r.current_balance+delta<0 THEN',
   'IF r.current_balance<c.upfront_cost OR r.current_balance+delta<0 THEN');
 def:=replace(def,'UPDATE public.playthroughs SET current_balance=current_balance+delta WHERE',
   'UPDATE public.playthroughs SET current_balance=current_balance+delta, employment_state=CASE WHEN c.requires_cac THEN jsonb_set(employment_state,''{assistanceUsed}'',''true''::jsonb) ELSE employment_state END WHERE');
 EXECUTE def;
END $$;
NOTIFY pgrst,'reload schema';
COMMIT;
