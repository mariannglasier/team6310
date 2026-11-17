BEGIN;
DO $patch$
DECLARE definition text;
BEGIN
 definition:=pg_get_functiondef('public.publish_scenario_source_edition(jsonb)'::regprocedure);
 IF position('Your estimated Earned Income Tax Credit was $' IN definition)=0 THEN
  RAISE EXCEPTION 'Review tax response patch';
 END IF;
 definition:=replace(definition,'Your estimated Earned Income Tax Credit was $','Your tax credit was $');
 EXECUTE definition;
END $patch$;
NOTIFY pgrst,'reload schema';
COMMIT;
