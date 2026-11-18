BEGIN;

CREATE FUNCTION public.get_group_scenario_facts(p_session_id uuid, p_scenario_id uuid)
RETURNS TABLE(scenario_id uuid, version_id uuid, fact_role text, semantic_key text,
              display_text text, source_url text, copy_kind text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT f.scenario_id, f.version_id, f.fact_role, f.semantic_key,
         f.display_text, f.source_url, f.copy_kind
  FROM public.group_sessions s
  JOIN public.scenario_fact_copy f ON f.scenario_id = s.current_scenario_id
    AND f.version_id = s.version_id
  WHERE s.session_id = p_session_id
    AND s.current_scenario_id = p_scenario_id
    AND s.status = 'open'
    AND s.round_type = 'scenario'
    AND s.round_state = 'results'
    AND auth.uid() IS NOT NULL
    AND coalesce((auth.jwt()->>'is_anonymous')::boolean, false)
    AND (s.host_user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.group_participants p
      WHERE p.session_id = s.session_id AND p.user_id = auth.uid()
    ))
    AND f.verified
    AND (f.fact_role = 'general' OR (f.fact_role = 'cac' AND s.cac_support_enabled IS TRUE))
  ORDER BY f.fact_role DESC;
$function$;

REVOKE ALL ON FUNCTION public.get_group_scenario_facts(uuid, uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_group_scenario_facts(uuid, uuid) TO authenticated;
NOTIFY pgrst, 'reload schema';

COMMIT;
