BEGIN;
CREATE FUNCTION public.claim_game_data_refresh_for_policy(p_period text,p_policy text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE claimed text;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Maintenance access required' USING ERRCODE='42501'; END IF;
 IF p_policy IS NULL OR length(p_policy)<1 THEN RAISE EXCEPTION 'Refresh policy required'; END IF;
 INSERT INTO public.game_data_refresh_runs(period,status) VALUES(p_period,'running')
 ON CONFLICT(period) DO UPDATE SET status='running',claimed_at=now()
 WHERE (game_data_refresh_runs.status<>'running' OR game_data_refresh_runs.claimed_at<now()-interval '15 minutes')
 AND (game_data_refresh_runs.status<>'published' OR game_data_refresh_runs.result->'catalog'->>'refreshPolicy' IS DISTINCT FROM p_policy)
 RETURNING period INTO claimed;
 RETURN claimed IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.claim_game_data_refresh_for_policy(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_game_data_refresh_for_policy(text,text) TO service_role;

DO $patch$
DECLARE definition text; anchor text := ' INSERT INTO public.personas(persona_id,name,description,general_starting_balance,weekly_income,version_id,starting_job_id,has_english_skills,has_computer_skills)';
BEGIN
 definition:=pg_get_functiondef('public.publish_scenario_source_edition(jsonb)'::regprocedure);
 IF position(anchor IN definition)=0 THEN RAISE EXCEPTION 'Review monthly wage publication patch'; END IF;
 definition:=replace(definition,anchor,$wages$
 IF settings ? 'wages' THEN
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(settings->'wages') AS wage(value)
    WHERE (wage.value->>'hourly')::numeric NOT BETWEEN 5 AND 200)
  THEN RAISE EXCEPTION 'Invalid refreshed wage'; END IF;
  UPDATE public.jobs j SET
   median_hourly_wage=(wage.value->>'hourly')::numeric,
   wage_year=(wage.value->>'year')::integer,
   wage_source_url=wage.value->>'sourceUrl',
   last_synced_at=(wage.value->>'lastSyncedAt')::timestamptz
  FROM jsonb_array_elements(settings->'wages') AS wage(value)
  WHERE j.version_id=new_version AND j.soc_code=wage.value->>'socCode'
   AND (wage.value->>'year')::integer>=j.wage_year;
 END IF;
$wages$||anchor);
 EXECUTE definition;
END $patch$;

CREATE FUNCTION public.get_edition_price_updates(p_version_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('checkedAt',p.source_snapshot->>'checkedAt',
   'items',coalesce((SELECT jsonb_agg(jsonb_build_object(
    'label',entry.value->>'label','status',entry.value->>'status',
    'lastSuccessfulAt',entry.value->>'lastSuccessfulAt',
    'observationPeriod',entry.value->>'observationPeriod'
   ) ORDER BY entry.value->>'label')
   FROM jsonb_each(coalesce(p.source_snapshot->'freshness','{}'::jsonb)) entry),'[]'::jsonb))
 FROM public.scenario_edition_prices p JOIN public.content_versions v USING(version_id)
 WHERE p.version_id=p_version_id AND v.status='published';
$$;
REVOKE ALL ON FUNCTION public.get_edition_price_updates(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_edition_price_updates(uuid) TO anon,authenticated,service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
