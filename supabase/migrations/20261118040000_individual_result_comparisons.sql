BEGIN;

-- Keep the existing initialization, authorization and idempotency checks.
-- An owned terminal individual run can now be the source of an assisted replay.
DO $migration$
DECLARE
  definition text;
  previous_check text := $old$prev.status is distinct from 'completed'
        or prev.cac_support_enabledabled is distinct from false
        or not public.valid_employment_document(prev.employment_state)
        or prev.employment_state->>'engine' is distinct from 'employment-v1'
        or prev.employment_state->'schemaVersion' is distinct from '1'::jsonb
        or prev.employment_state->>'stage' is distinct from 'complete' or prev.current_day is distinct from 30$old$;
BEGIN
  SELECT replace(pg_get_functiondef('public.submit_employment_action(uuid,uuid,integer,jsonb)'::regprocedure), chr(13), '')
    INTO definition;
  previous_check := replace(previous_check, chr(13), '');
  IF strpos(definition, previous_check) = 0 THEN
    RAISE EXCEPTION 'Employment replay eligibility has drifted';
  END IF;
  EXECUTE replace(definition, previous_check, $new$
    prev.session_id is not null or (case prev.status
      when 'completed' then not public.valid_employment_document(prev.employment_state)
        or prev.employment_state->>'engine' is distinct from 'employment-v1'
        or prev.employment_state->'schemaVersion' is distinct from '1'::jsonb
        or prev.employment_state->>'stage' is distinct from 'complete'
        or prev.current_day is distinct from 30
      when 'ended' then prev.employment_state->>'stage' is distinct from 'ended'
      else true
    end)$new$);
END;
$migration$;

CREATE FUNCTION public.get_individual_result_comparisons(p_run_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  viewer_id uuid := auth.uid();
  run public.playthroughs%ROWTYPE;
BEGIN
  SELECT p.* INTO run
    FROM public.playthroughs p
    WHERE p.playthrough_id = p_run_id
      AND p.owner_user_id = viewer_id
      AND p.session_id IS NULL
      AND p.status IN ('completed', 'ended');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Result is unavailable' USING ERRCODE = '42501';
  END IF;

  RETURN (
    WITH featured AS (
      SELECT DISTINCT ON (s.category_id)
        s.category_id, s.scenario_id, s.description AS question,
        c.choice_text AS answer
      FROM public.player_responses r
      JOIN public.choices c USING (choice_id, version_id)
      JOIN public.scenarios s USING (scenario_id, version_id)
      WHERE r.playthrough_id = p_run_id AND r.version_id = run.version_id
        AND s.category_id IS NOT NULL
      ORDER BY s.category_id, r.answered_at, r.response_id
    ), peer_answers AS (
      SELECT DISTINCT ON (c.scenario_id, p.playthrough_id)
        c.scenario_id, r.choice_id
      FROM public.player_responses r
      JOIN public.choices c USING (choice_id, version_id)
      JOIN featured f USING (scenario_id)
      JOIN public.playthroughs p ON p.playthrough_id = r.playthrough_id
        AND p.version_id = r.version_id
      WHERE p.version_id = run.version_id AND p.persona_id = run.persona_id
        AND p.session_id IS NULL AND p.owner_user_id IS NOT NULL
        AND p.owner_user_id <> viewer_id
        AND p.cac_support_enabledabled IS NOT DISTINCT FROM run.cac_support_enabledabled
        AND (c.requires_cac IS NOT TRUE OR run.cac_support_enabledabled IS TRUE)
      ORDER BY c.scenario_id, p.playthrough_id, r.answered_at, r.response_id
    ), choice_counts AS (
      SELECT scenario_id, choice_id, count(*) AS votes
      FROM peer_answers GROUP BY scenario_id, choice_id
    ), totals AS (
      SELECT scenario_id, sum(votes) AS responses
      FROM choice_counts GROUP BY scenario_id
    )
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'category', cat.name,
      'question', f.question,
      'answer', f.answer,
      'responses', CASE WHEN t.responses >= 5 THEN t.responses END,
      'options', CASE WHEN t.responses >= 5 THEN (
        SELECT jsonb_agg(jsonb_build_object(
          'id', c.choice_id,
          'label', c.choice_text,
          'percent', round(100 * coalesce(cc.votes, 0) / t.responses)
        ) ORDER BY c.choice_id)
        FROM public.choices c
        LEFT JOIN choice_counts cc ON cc.scenario_id = c.scenario_id AND cc.choice_id = c.choice_id
        WHERE c.scenario_id = f.scenario_id AND c.version_id = run.version_id
          AND (c.requires_cac IS NOT TRUE OR run.cac_support_enabledabled IS TRUE)
      ) ELSE '[]'::jsonb END
    ) ORDER BY cat.name, f.category_id), '[]'::jsonb)
    FROM featured f
    JOIN public.categories cat USING (category_id)
    LEFT JOIN totals t USING (scenario_id)
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_individual_result_comparisons(uuid) FROM PUBLIC;
DO $permissions$
DECLARE
  grantee name;
BEGIN
  FOR grantee IN
    SELECT role.rolname
    FROM pg_proc p
    CROSS JOIN LATERAL aclexplode(p.proacl) acl
    JOIN pg_roles role ON role.oid = acl.grantee
    WHERE p.oid = 'public.get_individual_result_comparisons(uuid)'::regprocedure
      AND acl.grantee <> p.proowner
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.get_individual_result_comparisons(uuid) FROM %I CASCADE', grantee);
  END LOOP;
END;
$permissions$;
GRANT EXECUTE ON FUNCTION public.get_individual_result_comparisons(uuid) TO authenticated;

COMMIT;
