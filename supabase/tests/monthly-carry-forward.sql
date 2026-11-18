BEGIN;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $test$
DECLARE payload jsonb; source_id uuid; new_id uuid; job record; display jsonb;
BEGIN
 IF NOT public.claim_game_data_refresh_for_policy('2099-03','test-v1') THEN RAISE EXCEPTION 'Initial claim denied'; END IF;
 IF public.claim_game_data_refresh_for_policy('2099-03','test-v1') THEN RAISE EXCEPTION 'Concurrent claim allowed'; END IF;
 UPDATE public.game_data_refresh_runs SET status='published',result='{"catalog":{"refreshPolicy":"test-v1"}}' WHERE period='2099-03';
 IF public.claim_game_data_refresh_for_policy('2099-03','test-v1') THEN RAISE EXCEPTION 'Published month repeated'; END IF;
 IF NOT public.claim_game_data_refresh_for_policy('2099-03','test-v2') THEN RAISE EXCEPTION 'Policy migration denied'; END IF;

 SELECT version_id INTO STRICT source_id FROM public.content_versions WHERE status='published' ORDER BY version_number DESC LIMIT 1;
 SELECT source_snapshot INTO STRICT payload FROM public.scenario_edition_prices WHERE version_id=source_id;
 SELECT * INTO STRICT job FROM public.jobs WHERE version_id=source_id ORDER BY job_id LIMIT 1;
 payload:=payload||jsonb_build_object('wages',jsonb_build_array(jsonb_build_object(
   'socCode',job.soc_code,'hourly',job.median_hourly_wage+0.01,'year',job.wage_year,
   'sourceUrl',job.wage_source_url,'lastSyncedAt',job.last_synced_at)),
   'checkedAt','2099-03-26T00:00:00Z','freshness',jsonb_build_object('test',jsonb_build_object(
   'label','Test price','status','carried_forward','lastSuccessfulAt','2026-10-27T00:00:00Z','observationPeriod','2025')));
 new_id:=public.publish_scenario_source_edition(payload);
 IF NOT EXISTS(SELECT 1 FROM public.jobs WHERE version_id=new_id AND soc_code=job.soc_code
   AND median_hourly_wage=job.median_hourly_wage+0.01
   AND weekly_gross_income=round((job.median_hourly_wage+0.01)*hours_per_week,2))
 THEN RAISE EXCEPTION 'Wage publication failed'; END IF;
 display:=public.get_edition_price_updates(new_id);
 IF display#>>'{items,0,status}'<>'carried_forward' OR display#>>'{items,0,lastSuccessfulAt}'<>'2026-10-27T00:00:00Z'
 THEN RAISE EXCEPTION 'Carry-forward date lost'; END IF;
 IF public.publish_scenario_source_edition(payload)<>new_id THEN RAISE EXCEPTION 'Duplicate publication'; END IF;
END $test$;
SET LOCAL ROLE authenticated;
DO $deny$
BEGIN
 BEGIN
  PERFORM public.claim_game_data_refresh_for_policy('2099-03','test');
  RAISE EXCEPTION 'Player claimed refresh';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $deny$;
ROLLBACK;
