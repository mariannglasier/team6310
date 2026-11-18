BEGIN;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $test$
BEGIN
 INSERT INTO public.game_data_refresh_runs(period,status) VALUES('2099-01','running');
 IF NOT public.claim_rentcast_monthly_request('2099-01') THEN
  RAISE EXCEPTION 'First request was denied';
 END IF;
 IF public.claim_rentcast_monthly_request('2099-01') THEN
  RAISE EXCEPTION 'Second request was allowed';
 END IF;
 UPDATE public.game_data_refresh_runs SET status='blocked' WHERE period='2099-01';
 PERFORM public.claim_game_data_refresh('2099-01');
 IF public.claim_rentcast_monthly_request('2099-01') THEN
  RAISE EXCEPTION 'Refresh retry reset the monthly allowance';
 END IF;
END $test$;
SET LOCAL ROLE authenticated;
DO $deny$
BEGIN
 BEGIN
  PERFORM public.claim_rentcast_monthly_request('2099-01');
  RAISE EXCEPTION 'Player claimed a provider request';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $deny$;
ROLLBACK;
