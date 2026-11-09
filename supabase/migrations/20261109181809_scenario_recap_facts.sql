-- Edition-bound display copy. No content publication or historical run mutation.
BEGIN;
CREATE TABLE public.scenario_fact_copy (
  scenario_id uuid NOT NULL REFERENCES public.scenarios(scenario_id),
  version_id uuid NOT NULL REFERENCES public.content_versions(version_id),
  fact_role text NOT NULL CHECK (fact_role IN ('general','cac')),
  semantic_key text NOT NULL CHECK (length(trim(semantic_key)) > 0),
  display_text text NOT NULL CHECK (length(trim(display_text)) > 0 AND display_text !~ '[{}]'),
  source_url text NOT NULL CHECK (source_url ~ '^https://'),
  reporting_period text,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  copy_kind text NOT NULL DEFAULT 'fact' CHECK(copy_kind IN ('fact','context')),
  verified boolean NOT NULL DEFAULT false,
  PRIMARY KEY(scenario_id,version_id,fact_role)
);
ALTER TABLE public.scenario_fact_copy ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.scenario_fact_copy FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.scenario_fact_copy TO service_role;

CREATE FUNCTION public.guard_scenario_fact_copy() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  IF TG_OP <> 'INSERT' AND EXISTS (
    SELECT 1 FROM public.content_versions WHERE version_id=OLD.version_id AND status='published'
  ) THEN RAISE EXCEPTION 'Published fact copy is immutable'; END IF;
  IF TG_OP <> 'DELETE' THEN
    IF NOT EXISTS (SELECT 1 FROM public.scenarios s WHERE s.scenario_id=NEW.scenario_id AND s.version_id=NEW.version_id)
    THEN RAISE EXCEPTION 'Fact scenario edition mismatch'; END IF;
    IF EXISTS (SELECT 1 FROM public.content_versions WHERE version_id=NEW.version_id AND status='published')
    THEN RAISE EXCEPTION 'Author facts in a draft edition'; END IF;
    RETURN NEW;
  END IF;
  RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION public.guard_scenario_fact_copy() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER scenario_fact_copy_guard BEFORE INSERT OR UPDATE OR DELETE ON public.scenario_fact_copy
FOR EACH ROW EXECUTE FUNCTION public.guard_scenario_fact_copy();

CREATE FUNCTION public.get_scenario_recap_facts(p_run_id uuid,p_scenario_id uuid)
RETURNS TABLE(scenario_id uuid,version_id uuid,fact_role text,semantic_key text,display_text text,source_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT f.scenario_id,f.version_id,f.fact_role,f.semantic_key,f.display_text,f.source_url
  FROM public.playthroughs p
  JOIN public.scenario_fact_copy f ON f.version_id=p.version_id AND f.scenario_id=p_scenario_id
  JOIN public.scenarios s ON s.scenario_id=f.scenario_id AND s.version_id=f.version_id
  WHERE p.playthrough_id=p_run_id AND p.owner_user_id=auth.uid()
    AND coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
    AND p.session_id IS NULL AND f.verified
    AND (f.fact_role='general' OR p.cac_support_enabledabled IS TRUE)
    AND EXISTS (
      SELECT 1 FROM public.player_responses pr JOIN public.choices c ON c.choice_id=pr.choice_id
      WHERE pr.playthrough_id=p.playthrough_id AND pr.version_id=p.version_id
        AND c.scenario_id=f.scenario_id AND c.version_id=p.version_id
    )
  ORDER BY f.fact_role DESC;
$$;
ALTER FUNCTION public.get_scenario_recap_facts(uuid,uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_scenario_recap_facts(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.get_scenario_recap_facts(uuid,uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
