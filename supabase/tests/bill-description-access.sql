BEGIN;
DO $test$
DECLARE actor uuid:=gen_random_uuid(); persona uuid; run_id uuid; receipt uuid; snapshot jsonb; expected text;
BEGIN
 SELECT persona_id INTO STRICT persona FROM public.personas WHERE name='Alex' AND version_id=(SELECT version_id FROM public.content_versions WHERE status='published' ORDER BY version_number DESC LIMIT 1);
 INSERT INTO auth.users(id,is_anonymous,aud,role) VALUES(actor,true,'authenticated','authenticated');
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated','is_anonymous',true)::text,true);
 run_id:=public.start_individual_playthrough(persona);
 SELECT e.playthrough_expense_id,s.description INTO STRICT receipt,expected FROM public.playthrough_expenses e JOIN public.scenario_bill_links l USING(expense_id,version_id) JOIN public.scenarios s ON s.scenario_id=l.scenario_id AND s.version_id=l.version_id WHERE e.playthrough_id=run_id ORDER BY e.due_day LIMIT 1;
 snapshot:=public.get_bill_snapshot(run_id);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(snapshot->'bills') b WHERE b->>'playthrough_expense_id'=receipt::text AND b->>'description'=expected) THEN RAISE EXCEPTION 'Owned snapshot description missing'; END IF;
 IF public.bill_description(receipt) IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Pinned description mismatch'; END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',gen_random_uuid(),'role','authenticated','is_anonymous',true)::text,true);
 IF public.bill_description(receipt) IS NOT NULL OR public.get_bill_snapshot(run_id) IS NOT NULL THEN RAISE EXCEPTION 'Cross-owner description exposed'; END IF;
END $test$;
SET LOCAL ROLE anon;
DO $denied$
BEGIN
 BEGIN
  PERFORM public.bill_description(gen_random_uuid());
  RAISE EXCEPTION 'Unauthenticated description access';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $denied$;
ROLLBACK;
