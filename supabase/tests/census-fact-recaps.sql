-- Validate all nine published Census passages through the protected recap RPC.
-- Fixture history is deliberately constructed to cover every event independently
-- of random scenario selection and the six-bill cap. All rows are rolled back.
BEGIN;
DO $test$
DECLARE actor uuid:=gen_random_uuid(); persona uuid; edition uuid; run_id uuid;
 mode integer; item record; sid uuid; event_key text; receipt uuid; choice public.choices%rowtype;
 expected text; shown text; period text; n integer; cases integer:=0;
BEGIN
 SELECT version_id INTO STRICT edition FROM public.content_versions WHERE status='published' ORDER BY version_number DESC LIMIT 1;
 SELECT source_snapshot->'censusFacts'->>'period' INTO STRICT period FROM public.scenario_edition_prices WHERE version_id=edition;
 IF (SELECT count(DISTINCT m.library_key) FROM public.scenario_fact_copy f JOIN public.scenario_library_metadata m USING(scenario_id,version_id)
  WHERE f.version_id=edition AND f.fact_role='general' AND f.copy_kind='fact' AND m.library_key IN ('D001','D003','D004','D006','D020','D028','D032','D044','D055'))<>9
 THEN RAISE EXCEPTION 'Nine complete published Census facts required'; END IF;
 SELECT persona_id INTO STRICT persona FROM public.personas WHERE version_id=edition AND name='Sofia';
 INSERT INTO auth.users(id,is_anonymous,aud,role) VALUES(actor,true,'authenticated','authenticated');
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated','is_anonymous',true)::text,true);
 FOR mode IN 0..1 LOOP
  FOR item IN SELECT s.scenario_id,m.library_key,m.engine FROM public.scenarios s JOIN public.scenario_library_metadata m USING(scenario_id,version_id)
    WHERE s.version_id=edition AND s.persona_intent=persona AND m.library_key IN ('D001','D003','D004','D006','D020','D028','D032','D044','D055') ORDER BY m.library_key LOOP
   sid:=item.scenario_id;
   run_id:=public.start_individual_playthrough(persona);
   UPDATE public.playthroughs SET cac_support_enabledabled=(mode=1),current_balance=10000 WHERE playthrough_id=run_id;
   SELECT display_text INTO STRICT expected FROM public.scenario_fact_copy WHERE scenario_id=sid AND fact_role='general' AND version_id=edition;
   IF expected ~ '[{}]' OR period IS NULL OR position(period IN expected)=0 THEN RAISE EXCEPTION 'Missing dated observation'; END IF;
   IF item.engine='bill' THEN
    SELECT e.playthrough_expense_id INTO receipt FROM public.playthrough_expenses e JOIN public.scenario_bill_links l USING(expense_id,version_id) WHERE e.playthrough_id=run_id AND l.scenario_id=sid;
    IF receipt IS NULL THEN
     INSERT INTO public.playthrough_expenses(playthrough_id,expense_id,version_id,due_day,amount_due,name_snapshot,late_fee_amount)
     SELECT run_id,e.expense_id,e.version_id,e.first_due_day,e.amount,e.name,e.late_fee_amount FROM public.persona_expenses e JOIN public.scenario_bill_links l USING(expense_id,version_id) WHERE l.scenario_id=sid
     RETURNING playthrough_expense_id INTO receipt;
    END IF;
    event_key:='bill:'||receipt;
   ELSIF item.engine='employment' THEN event_key:=item.library_key;
   ELSE event_key:=sid::text; END IF;
   IF EXISTS(SELECT 1 FROM public.get_event_recap_facts(run_id,event_key)) THEN RAISE EXCEPTION 'Fact leaked before commitment'; END IF;
   IF item.engine='bill' THEN
    UPDATE public.playthrough_expenses SET ignored_at=clock_timestamp() WHERE playthrough_expense_id=receipt;
   ELSIF item.engine='employment' THEN
    UPDATE public.playthroughs SET current_day=CASE WHEN item.library_key='D004' THEN 3 ELSE 1 END,
      employment_state=jsonb_set(employment_state,'{stage}',to_jsonb(CASE item.library_key WHEN 'D001' THEN 'application-result' WHEN 'D003' THEN 'reapply-result' ELSE 'interview-result' END))
      WHERE playthrough_id=run_id;
   ELSE
    SELECT * INTO STRICT choice FROM public.choices WHERE scenario_id=sid AND version_id=edition AND NOT requires_cac ORDER BY balance_change DESC LIMIT 1;
    INSERT INTO public.player_responses(playthrough_id,choice_id,balance_change_applied,balance_after,answered_at,version_id)
    VALUES(run_id,choice.choice_id,choice.balance_change,10000+choice.balance_change,clock_timestamp(),edition);
   END IF;
   SELECT count(*),min(display_text) INTO n,shown FROM public.get_event_recap_facts(run_id,event_key) WHERE fact_role='general';
   IF n<>1 OR shown IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Missing or altered % fact in mode %',item.library_key,mode; END IF;
   IF mode=0 AND EXISTS(SELECT 1 FROM public.get_event_recap_facts(run_id,event_key) WHERE fact_role='cac') THEN RAISE EXCEPTION 'CAC fact leaked in regular mode'; END IF;
   PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',gen_random_uuid(),'role','authenticated','is_anonymous',true)::text,true);
   IF EXISTS(SELECT 1 FROM public.get_event_recap_facts(run_id,event_key)) THEN RAISE EXCEPTION 'Cross-owner fact exposure'; END IF;
   PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated','is_anonymous',true)::text,true);
   cases:=cases+1;
  END LOOP;
 END LOOP;
 IF cases<>18 THEN RAISE EXCEPTION 'Expected eighteen event/mode cases, got %',cases; END IF;
END $test$;
ROLLBACK;
