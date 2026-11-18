BEGIN;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $test$
DECLARE payload jsonb; invalid jsonb; count_before integer; current_edition uuid;
BEGIN
 SELECT source_snapshot INTO STRICT payload FROM public.scenario_edition_prices WHERE version_id=(SELECT version_id FROM public.content_versions WHERE status='published' ORDER BY version_number DESC LIMIT 1);
 current_edition:=public.publish_scenario_source_edition(payload);
 IF (SELECT general_starting_balance FROM public.personas WHERE version_id=current_edition AND name='Alex')<>1500 THEN RAISE EXCEPTION 'Published starting cash missing'; END IF;
 SELECT count(*) INTO count_before FROM public.content_versions;
 FOR invalid IN SELECT value FROM jsonb_array_elements('[{"Alex":-1},{"Alex":1000001},{"Alex":1500.001},{"Unknown":1500},{"Alex":null},[]]'::jsonb) LOOP
  BEGIN
   PERFORM public.publish_scenario_source_edition(payload||jsonb_build_object('startingBalances',invalid));
   RAISE EXCEPTION 'Invalid starting balance accepted';
  EXCEPTION WHEN OTHERS THEN
   IF SQLERRM='Invalid starting balance accepted' THEN RAISE; END IF;
  END;
 END LOOP;
 IF (SELECT count(*) FROM public.content_versions)<>count_before THEN RAISE EXCEPTION 'Failed override left partial editions'; END IF;
END $test$;
ROLLBACK;
