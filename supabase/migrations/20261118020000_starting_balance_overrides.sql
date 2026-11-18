-- Approved Alex starting-cash adjustment; preserve all existing publisher guards.
BEGIN;
DO $migration$
DECLARE definition text; original text:='SELECT md5(new_version::text||persona_id::text)::uuid,name,description,general_starting_balance,weekly_income,new_version,';
BEGIN
 definition:=pg_get_functiondef('public.publish_scenario_source_edition(jsonb)'::regprocedure);
 IF position(original IN definition)=0 THEN RAISE EXCEPTION 'Review changed persona publisher before applying balance override'; END IF;
 definition:=replace(definition,original,'SELECT md5(new_version::text||persona_id::text)::uuid,name,description,coalesce((settings->''startingBalances''->>name)::numeric,general_starting_balance),weekly_income,new_version,');
 definition:=replace(definition,' INSERT INTO public.personas(', $validation$
 IF settings ? 'startingBalances' THEN
  IF jsonb_typeof(settings->'startingBalances') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Starting balances must be an object'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_each_text(settings->'startingBalances') AS balance(key,value)
    WHERE balance.key NOT IN ('Alex','Jordan','Sofia','Patricia') OR balance.value IS NULL
      OR balance.value::numeric NOT BETWEEN 0 AND 1000000 OR balance.value::numeric<>round(balance.value::numeric,2))
  THEN RAISE EXCEPTION 'Invalid starting balance override'; END IF;
 END IF;
 INSERT INTO public.personas($validation$);
 EXECUTE definition;
END $migration$;
COMMIT;
