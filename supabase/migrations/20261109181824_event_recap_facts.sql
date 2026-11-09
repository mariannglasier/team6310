BEGIN;
CREATE TABLE public.scenario_bill_links (
 expense_id uuid PRIMARY KEY REFERENCES public.persona_expenses(expense_id),
 scenario_id uuid NOT NULL REFERENCES public.scenarios(scenario_id),
 version_id uuid NOT NULL REFERENCES public.content_versions(version_id)
);
ALTER TABLE public.scenario_bill_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.scenario_bill_links FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.scenario_bill_links TO service_role;

CREATE FUNCTION public.get_event_recap_facts(p_run_id uuid,p_event_key text)
RETURNS TABLE(scenario_id uuid,version_id uuid,fact_role text,semantic_key text,display_text text,source_url text,copy_kind text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.playthroughs%rowtype; sid uuid; allowed boolean := false; stage text;
BEGIN
 SELECT * INTO r FROM public.playthroughs p WHERE p.playthrough_id=p_run_id AND p.owner_user_id=auth.uid()
 AND p.session_id IS NULL AND coalesce((auth.jwt()->>'is_anonymous')::boolean,false);
 IF NOT FOUND THEN RETURN; END IF;
 stage:=r.employment_state->>'stage';
 IF p_event_key ~ '^D00[1-4]$' THEN
  SELECT m.scenario_id INTO sid FROM public.scenario_library_metadata m JOIN public.scenarios s USING(scenario_id,version_id)
  WHERE m.version_id=r.version_id AND m.library_key=p_event_key AND s.persona_intent=r.persona_id;
  allowed:=CASE p_event_key
   WHEN 'D001' THEN stage IN ('preparation-result','application-result')
   WHEN 'D002' THEN stage='interview-result' AND r.current_day=2
   WHEN 'D003' THEN stage='reapply-result'
   WHEN 'D004' THEN stage='interview-result' AND r.current_day=3 ELSE false END;
 ELSIF p_event_key LIKE 'bill:%' THEN
  SELECT l.scenario_id INTO sid FROM public.playthrough_expenses e JOIN public.scenario_bill_links l USING(expense_id,version_id)
  WHERE e.playthrough_id=r.playthrough_id AND e.playthrough_expense_id=substring(p_event_key from 6)::uuid
   AND e.version_id=r.version_id AND (e.paid_at IS NOT NULL OR e.ignored_at IS NOT NULL);
  allowed:=sid IS NOT NULL;
 ELSE
  sid:=p_event_key::uuid;
  SELECT EXISTS(SELECT 1 FROM public.player_responses pr JOIN public.choices c ON c.choice_id=pr.choice_id
   WHERE pr.playthrough_id=r.playthrough_id AND pr.version_id=r.version_id AND c.version_id=r.version_id AND c.scenario_id=sid) INTO allowed;
 END IF;
 IF NOT coalesce(allowed,false) THEN RETURN; END IF;
 RETURN QUERY SELECT f.scenario_id,f.version_id,f.fact_role,f.semantic_key,f.display_text,f.source_url,f.copy_kind
 FROM public.scenario_fact_copy f WHERE f.scenario_id=sid AND f.version_id=r.version_id AND f.verified
 AND (f.fact_role='general' OR r.cac_support_enabledabled IS TRUE)
 ORDER BY f.fact_role DESC;
END $$;
ALTER FUNCTION public.get_event_recap_facts(uuid,text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_event_recap_facts(uuid,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.get_event_recap_facts(uuid,text) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
