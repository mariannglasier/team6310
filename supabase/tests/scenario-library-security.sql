BEGIN;
DO $test$
DECLARE actor uuid:=gen_random_uuid(); rid uuid; pid uuid; sid uuid; cid uuid; result jsonb;
BEGIN
 INSERT INTO auth.users(id,is_anonymous,aud,role) VALUES(actor,true,'authenticated','authenticated');
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated','is_anonymous',true)::text,true);
 SELECT persona_id INTO STRICT pid FROM public.personas WHERE version_id='cba0ec75-2dbf-d329-324c-c6bae6a374e2' AND name='Alex';
 rid:=public.start_individual_playthrough(pid);
 PERFORM public.submit_employment_action(rid,gen_random_uuid(),0,'{"type":"initialize"}'::jsonb);
 -- Isolate the upfront-fee guard: the positive net refund cannot fund the fee.
 UPDATE public.playthroughs SET current_day=18,current_balance=0,
   employment_state=jsonb_set(employment_state,'{stage}','"day"') WHERE playthrough_id=rid;
 SELECT current_scenario_id INTO STRICT sid FROM public.playthroughs WHERE playthrough_id=rid;
 SELECT choice_id INTO STRICT cid FROM public.choices WHERE scenario_id=sid AND upfront_cost=99;
 -- Another participant must not submit a choice on this owned run.
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',gen_random_uuid(),'role','authenticated','is_anonymous',true)::text,true);
 BEGIN
  PERFORM public.submit_scenario_decision(rid,sid,cid);
  RAISE EXCEPTION 'Cross-owner submission accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Cross-owner submission accepted' THEN RAISE; END IF; END;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated','is_anonymous',true)::text,true);
 result:=public.submit_scenario_decision(rid,sid,cid);
 IF result->'run'->>'status'<>'ended' OR (result->'run'->>'current_balance')::numeric<>0
 OR result->'response'<>'null'::jsonb OR EXISTS(SELECT 1 FROM public.player_responses WHERE playthrough_id=rid)
 THEN RAISE EXCEPTION 'Unaffordable preparation must not apply a fee or refund'; END IF;
 IF EXISTS(SELECT 1 FROM public.get_event_recap_facts(rid,sid::text)) THEN RAISE EXCEPTION 'Uncommitted fact read'; END IF;
END $test$;
SELECT 'ownership and upfront-fee guards passed; all test data rolled back' AS verification;
ROLLBACK;
