BEGIN;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $test$
DECLARE zip text;
BEGIN
 FOREACH zip IN ARRAY ARRAY['30327','30328','30338','30342','30346','30350'] LOOP
  IF NOT public.claim_rentcast_zip_request('2099-02',zip) THEN RAISE EXCEPTION 'First request denied'; END IF;
  IF public.claim_rentcast_zip_request('2099-02',zip) THEN RAISE EXCEPTION 'Duplicate request allowed'; END IF;
 END LOOP;
 IF (SELECT count(*) FROM public.rentcast_monthly_zip_cache WHERE period='2099-02')<>6 THEN RAISE EXCEPTION 'Expected six claims'; END IF;
 BEGIN
  PERFORM public.claim_rentcast_zip_request('2099-02','99999');
  RAISE EXCEPTION 'Unknown ZIP accepted';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
END $test$;
SET LOCAL ROLE authenticated;
DO $deny$
BEGIN
 BEGIN
  PERFORM public.claim_rentcast_zip_request('2099-02','30327');
  RAISE EXCEPTION 'Player claimed request';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $deny$;
ROLLBACK;
