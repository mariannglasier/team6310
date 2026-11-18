-- Affordability check using the real starting cash: no balance top-ups.
-- Pay every due bill and choose the cheapest available ordinary option.
BEGIN;
CREATE TEMP TABLE alex_payday_trials(mode integer,day integer,balance_after numeric) ON COMMIT DROP;
DO $test$
DECLARE actor uuid:=gen_random_uuid(); persona uuid; rid uuid; prior_run uuid; r public.playthroughs%rowtype;
 mode integer; trial integer; steps integer; action jsonb; job uuid; choice uuid; bill uuid;
BEGIN
 SELECT persona_id INTO STRICT persona FROM public.personas WHERE name='Alex' AND version_id=(SELECT version_id FROM public.content_versions WHERE status='published' ORDER BY version_number DESC LIMIT 1);
 INSERT INTO auth.users(id,is_anonymous,aud,role) VALUES(actor,true,'authenticated','authenticated');
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated','is_anonymous',true)::text,true);
 FOR trial IN 1..10 LOOP
  prior_run:=NULL;
  FOR mode IN 0..1 LOOP
   rid:=public.start_individual_playthrough(persona);
   IF (SELECT current_balance FROM public.playthroughs WHERE playthrough_id=rid)<>1500 THEN RAISE EXCEPTION 'Alex must start with 1500'; END IF;
   steps:=0;
   LOOP
    steps:=steps+1;
    SELECT * INTO STRICT r FROM public.playthroughs WHERE playthrough_id=rid;
    IF steps>80 OR r.status<>'active' THEN RAISE EXCEPTION 'Alex failed before payday, trial %, mode %, day %, balance %',trial,mode,r.current_day,r.current_balance; END IF;
    IF jsonb_array_length(r.employment_state->'creditedDays')>0 THEN
     IF r.current_day<>(CASE WHEN mode=1 THEN 9 ELSE 10 END) THEN RAISE EXCEPTION 'Unexpected first payday'; END IF;
     INSERT INTO alex_payday_trials VALUES(mode,r.current_day,r.current_balance);
     -- The verified segment ends here. Mark only this disposable fixture as
     -- complete to make its CAC replay eligible, without funding the next run.
     UPDATE public.playthroughs SET status='completed',current_day=30,current_scenario_id=NULL,
       employment_state=jsonb_set(employment_state,'{stage}','"complete"') WHERE playthrough_id=rid;
     EXIT;
    END IF;
    action:=NULL;
    CASE r.employment_state->>'stage'
     WHEN 'uninitialized' THEN
      action:=jsonb_build_object('type','initialize');
      IF mode=1 THEN action:=action||jsonb_build_object('replayOf',prior_run); END IF;
     WHEN 'board','reapply' THEN
      IF mode=1 AND r.employment_state->>'stage'='board' AND NOT (r.employment_state->>'prepared')::boolean THEN action:=jsonb_build_object('type','prepare');
      ELSE
       SELECT job_id INTO STRICT job FROM public.jobs WHERE version_id=r.version_id AND is_active AND is_approved AND NOT needs_english_skills AND NOT needs_computer_skills
        AND (r.employment_state->>'stage'<>'reapply' OR job_id::text<>r.employment_state->>'initialTargetId') ORDER BY median_hourly_wage DESC,job_id LIMIT 1;
       action:=jsonb_build_object('type','apply','jobId',job);
      END IF;
     WHEN 'interview' THEN action:=jsonb_build_object('type','interview','choice',CASE WHEN r.employment_state->>'clothing'<>'none' THEN 'owned' WHEN mode=1 THEN 'cac' ELSE 'purchase' END);
     WHEN 'day' THEN
      FOR bill IN SELECT playthrough_expense_id FROM public.playthrough_expenses WHERE playthrough_id=rid AND due_day<=r.current_day AND paid_at IS NULL LOOP
       PERFORM public.pay_bill(rid,bill);
       IF EXISTS(SELECT 1 FROM public.playthrough_expenses WHERE playthrough_expense_id=bill AND paid_at IS NULL) THEN RAISE EXCEPTION 'Cannot afford early bill'; END IF;
      END LOOP;
      IF r.current_scenario_id IS NOT NULL THEN
       SELECT choice_id INTO STRICT choice FROM public.choices WHERE scenario_id=r.current_scenario_id AND (NOT requires_cac OR mode=1) ORDER BY balance_change DESC,choice_id LIMIT 1;
       PERFORM public.submit_scenario_decision(rid,r.current_scenario_id,choice);
      END IF;
      action:=jsonb_build_object('type','continue');
     ELSE action:=jsonb_build_object('type','continue');
    END CASE;
    SELECT * INTO STRICT r FROM public.playthroughs WHERE playthrough_id=rid;
    PERFORM public.submit_employment_action(rid,gen_random_uuid(),(r.employment_state->>'revision')::integer,action);
   END LOOP;
   prior_run:=rid;
  END LOOP;
 END LOOP;
END $test$;
SELECT mode,count(*) AS trials,min(day) AS first_payday,min(balance_after) AS lowest_payday_balance FROM alex_payday_trials GROUP BY mode ORDER BY mode;
ROLLBACK;
