BEGIN;
-- New unaffordable decisions commit the terminal display state with the run
-- status. Existing ended runs are restored by status in the frontend, without
-- backfilling their financial records or inventing a submitted answer.
DO $$
DECLARE def text;
BEGIN
 SELECT pg_get_functiondef('public.submit_scenario_decision(uuid,uuid,uuid)'::regprocedure) INTO def;
 IF position('UPDATE public.playthroughs SET status=''ended'' WHERE' IN def)=0
 THEN RAISE EXCEPTION 'Scenario ending function has drifted; review before upgrading'; END IF;
 def:=replace(def,'UPDATE public.playthroughs SET status=''ended'' WHERE',
   'UPDATE public.playthroughs SET status=''ended'', employment_state=employment_state || jsonb_build_object(''stage'',''ended'',''reason'',''Your household could not afford this choice.'') WHERE');
 EXECUTE def;
END $$;
COMMIT;
