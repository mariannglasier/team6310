-- Run after the content SQL in the SAME transaction, then ROLLBACK.
-- Disposable identities and runs; never commit this test fixture.
CREATE TEMP TABLE library_smoke_results(persona text,cac boolean,day integer,status text,responses integer,facts integer);
DO $test$
DECLARE actor uuid:=gen_random_uuid(); pe record; rid uuid; previous uuid; mode integer; steps integer;
 r public.playthroughs%rowtype; stage text; action jsonb; jid uuid; cid uuid; bill uuid; cnt integer; facts_seen integer; last_scenario uuid;
BEGIN
 INSERT INTO auth.users(id,is_anonymous,aud,role) VALUES(actor,true,'authenticated','authenticated');
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated','is_anonymous',true)::text,true);
 FOR pe IN SELECT * FROM public.personas WHERE version_id='cba0ec75-2dbf-d329-324c-c6bae6a374e2' LOOP
  previous:=NULL;
  FOR mode IN 0..1 LOOP
   rid:=public.start_individual_playthrough(pe.persona_id);
   -- Isolate routing/persistence from affordability in this full-route test.
   UPDATE public.playthroughs SET current_balance=10000 WHERE playthrough_id=rid;
   steps:=0; facts_seen:=0;
   LOOP
    steps:=steps+1;
    IF steps>180 THEN RAISE EXCEPTION 'Route did not finish'; END IF;
    SELECT * INTO STRICT r FROM public.playthroughs WHERE playthrough_id=rid;
    IF r.status='completed' THEN EXIT; END IF;
    IF r.status='ended' THEN RAISE EXCEPTION 'Unexpected test ending'; END IF;
    stage:=r.employment_state->>'stage';
    action:=NULL;
    IF stage='uninitialized' THEN
      action:=jsonb_build_object('type','initialize');
      IF mode=1 THEN action:=action||jsonb_build_object('replayOf',previous); END IF;
    ELSIF stage IN ('board','reapply') THEN
      IF mode=1 AND stage='board' AND NOT (r.employment_state->>'prepared')::boolean THEN action:=jsonb_build_object('type','prepare');
      ELSE
      SELECT job_id INTO STRICT jid FROM public.jobs WHERE version_id=r.version_id AND is_active AND is_approved
        AND NOT needs_english_skills AND NOT needs_computer_skills
        AND (stage<>'reapply' OR job_id::text<>r.employment_state->>'initialTargetId') ORDER BY job_id LIMIT 1;
      action:=jsonb_build_object('type','apply','jobId',jid);
      END IF;
    ELSIF stage='interview' THEN action:=jsonb_build_object('type','interview','choice',CASE WHEN r.employment_state->>'clothing'<>'none' THEN 'owned' WHEN mode=1 THEN 'cac' ELSE 'current' END);
    ELSIF stage='day' THEN
      FOR bill IN SELECT playthrough_expense_id FROM public.playthrough_expenses
        WHERE playthrough_id=rid AND due_day<=r.current_day AND paid_at IS NULL AND ignored_at IS NULL LOOP
        PERFORM public.ignore_bill(rid,bill);
        SELECT count(*) INTO cnt FROM public.get_event_recap_facts(rid,'bill:'||bill);
        IF cnt<1 THEN RAISE EXCEPTION 'Missing bill context'; END IF;
        facts_seen:=facts_seen+cnt;
      END LOOP;
      IF r.current_scenario_id IS NOT NULL THEN
        SELECT count(*) INTO cnt FROM public.get_event_recap_facts(rid,r.current_scenario_id::text);
        IF cnt<>0 THEN RAISE EXCEPTION 'Fact leaked before decision'; END IF;
        IF mode=0 AND EXISTS(SELECT 1 FROM public.choices WHERE scenario_id=r.current_scenario_id AND requires_cac) THEN
          SELECT choice_id INTO cid FROM public.choices WHERE scenario_id=r.current_scenario_id AND requires_cac LIMIT 1;
          BEGIN
            PERFORM public.submit_scenario_decision(rid,r.current_scenario_id,cid);
            RAISE EXCEPTION 'CAC guard failed';
          EXCEPTION WHEN raise_exception THEN IF SQLERRM='CAC guard failed' THEN RAISE; END IF; END;
        END IF;
        SELECT choice_id INTO STRICT cid FROM public.choices WHERE scenario_id=r.current_scenario_id
          AND (NOT requires_cac OR mode=1) ORDER BY balance_change DESC,choice_id LIMIT 1;
        PERFORM public.submit_scenario_decision(rid,r.current_scenario_id,cid);
        PERFORM public.submit_scenario_decision(rid,r.current_scenario_id,cid); -- idempotent retry
        SELECT count(*) INTO cnt FROM public.get_event_recap_facts(rid,r.current_scenario_id::text);
        IF cnt<1 THEN RAISE EXCEPTION 'Missing committed context'; END IF;
        facts_seen:=facts_seen+cnt;
        IF mode=0 AND EXISTS(SELECT 1 FROM public.get_event_recap_facts(rid,r.current_scenario_id::text) WHERE fact_role='cac')
        THEN RAISE EXCEPTION 'CAC fact leaked'; END IF;
      END IF;
      action:=jsonb_build_object('type','continue');
    ELSE action:=jsonb_build_object('type','continue'); END IF;
    SELECT * INTO r FROM public.playthroughs WHERE playthrough_id=rid;
    PERFORM public.submit_employment_action(rid,gen_random_uuid(),(r.employment_state->>'revision')::integer,action);
   END LOOP;
   IF (SELECT count(*) FROM public.player_responses pr JOIN public.choices c USING(choice_id)
       JOIN public.scenario_library_metadata m USING(scenario_id) WHERE pr.playthrough_id=rid AND m.library_key='D005')<>1
   THEN RAISE EXCEPTION 'Tax event must occur exactly once'; END IF;
   IF (SELECT count(*) FROM public.player_responses WHERE playthrough_id=rid)<20 THEN RAISE EXCEPTION 'Route missing scenarios'; END IF;
   INSERT INTO library_smoke_results SELECT pe.name,mode=1,r.current_day,r.status,
     (SELECT count(*) FROM public.player_responses WHERE playthrough_id=rid),facts_seen;
   -- Own-run fact reads must not expose another participant's history.
   SELECT c.scenario_id INTO last_scenario FROM public.player_responses pr JOIN public.choices c USING(choice_id) WHERE pr.playthrough_id=rid ORDER BY answered_at DESC LIMIT 1;
   IF NOT EXISTS(SELECT 1 FROM public.get_event_recap_facts(rid,last_scenario::text)) THEN RAISE EXCEPTION 'Missing own historical fact'; END IF;
   PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',gen_random_uuid(),'role','authenticated','is_anonymous',true)::text,true);
   IF EXISTS(SELECT 1 FROM public.get_event_recap_facts(rid,last_scenario::text)) THEN RAISE EXCEPTION 'Cross-owner fact read'; END IF;
   PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated','is_anonymous',true)::text,true);
   previous:=rid;
  END LOOP;
 END LOOP;
END $test$;
SELECT * FROM library_smoke_results ORDER BY persona,cac;
