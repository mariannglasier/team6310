-- Real creation path; all fixtures are rolled back.
BEGIN;
DO $test$
DECLARE actor uuid:=gen_random_uuid(); p record; run_id uuid; actual integer;
BEGIN
 INSERT INTO auth.users(id,is_anonymous,aud,role) VALUES(actor,true,'authenticated','authenticated');
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated','is_anonymous',true)::text,true);
 FOR p IN SELECT * FROM public.personas WHERE version_id=(SELECT version_id FROM public.content_versions WHERE status='published' ORDER BY version_number DESC LIMIT 1) LOOP
  run_id:=public.start_individual_playthrough(p.persona_id);
  SELECT count(*) INTO actual FROM public.playthrough_expenses WHERE playthrough_id=run_id;
  IF actual<>6 THEN RAISE EXCEPTION '% has % bills instead of six',p.name,actual; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.playthrough_expenses e JOIN public.scenario_bill_links l USING(expense_id,version_id)
    JOIN public.scenario_library_metadata m USING(scenario_id,version_id) WHERE e.playthrough_id=run_id AND m.library_key='D006')
  THEN RAISE EXCEPTION 'Rent was excluded'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.playthrough_expenses WHERE playthrough_id=run_id AND due_day>=25)
  THEN RAISE EXCEPTION 'Bills were crowded into the beginning of the run'; END IF;
  IF EXISTS(SELECT 1 FROM public.playthrough_expenses e JOIN public.persona_expenses d USING(expense_id,version_id)
   WHERE e.playthrough_id=run_id AND (e.amount_due<>d.amount OR e.late_fee_amount<>d.late_fee_amount))
  THEN RAISE EXCEPTION 'Cap changed prices or fees'; END IF;
 END LOOP;
END $test$;
SET LOCAL ROLE authenticated;
DO $denied$
BEGIN
 BEGIN
  PERFORM * FROM public.capped_bill_schedule(gen_random_uuid(),gen_random_uuid());
  RAISE EXCEPTION 'Client called private scheduler';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $denied$;
ROLLBACK;
