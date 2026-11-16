-- Actual isolated local Supabase only. All test users, runs and trusted fixture
-- changes roll back. Apply the forward migration locally before running this.
BEGIN;
SET LOCAL statement_timeout = '20s';
CREATE FUNCTION pg_temp.must_fail(statement text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
 BEGIN
   EXECUTE statement;
 EXCEPTION WHEN others THEN RETURN;
 END;
 RAISE EXCEPTION 'Expected rejection: %', statement;
END $$;
DO $$
DECLARE owner_id uuid:=gen_random_uuid(); other_id uuid:=gen_random_uuid();
BEGIN
 INSERT INTO auth.users(id,is_anonymous) VALUES(owner_id,true),(other_id,true);
 PERFORM set_config('test.owner',owner_id::text,true);
 PERFORM set_config('test.other',other_id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'is_anonymous',true)::text,true);
END $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE persona uuid; id uuid; initialized uuid; request_id uuid:=gen_random_uuid();
 before_run jsonb; after_run jsonb; before_bills jsonb; result jsonb; retry jsonb; action jsonb;
BEGIN
 SELECT persona_id INTO STRICT persona FROM public.personas WHERE name='[LOCAL TEST] Bills Alex';
 id:=public.start_individual_playthrough(persona);
 SELECT to_jsonb(p) INTO before_run FROM public.playthroughs p WHERE playthrough_id=id;
 before_bills:=public.get_bill_snapshot(id)-'run';
 IF before_run->'employment_state'->>'stage'<>'uninitialized' THEN RAISE EXCEPTION 'Fresh marker missing'; END IF;
 -- The new path must not enable any other employment action before initialization.
 FOREACH action IN ARRAY ARRAY['{"type":"prepare"}'::jsonb,'{"type":"continue"}'::jsonb,
   '{"type":"interview","choice":"current"}'::jsonb,
   jsonb_build_object('type','apply','jobId',gen_random_uuid())] LOOP
   PERFORM pg_temp.must_fail(format('SELECT public.submit_employment_action(%L,%L,0,%L::jsonb)',id,gen_random_uuid(),action));
 END LOOP;
 PERFORM pg_temp.must_fail(format('SELECT public.submit_employment_action(%L,%L,1,%L::jsonb)',id,request_id,'{"type":"end"}'));
 PERFORM pg_temp.must_fail(format('SELECT public.submit_employment_action(%L,%L,0,%L::jsonb)',id,request_id,'{"type":"end","balance":0}'));
 result:=public.submit_employment_action(id,request_id,0,'{"type":"end"}');
 SELECT to_jsonb(p) INTO after_run FROM public.playthroughs p WHERE playthrough_id=id;
 IF after_run->>'status'<>'ended' OR (after_run-'status'-'employment_state') IS DISTINCT FROM (before_run-'status'-'employment_state') THEN
   RAISE EXCEPTION 'Termination changed gameplay or financial state'; END IF;
 IF public.get_bill_snapshot(id)-'run' IS DISTINCT FROM before_bills THEN RAISE EXCEPTION 'Bills or financial totals changed'; END IF;
 IF (SELECT count(*) FROM jsonb_object_keys(after_run->'employment_state'))<>6
   OR after_run->'employment_state' ?| ARRAY['prepared','history','weeklyIncome','clothing','hiredDay'] THEN
   RAISE EXCEPTION 'Fabricated employment data'; END IF;
 retry:=public.submit_employment_action(id,request_id,0,'{"type":"end"}');
 IF retry IS DISTINCT FROM result THEN RAISE EXCEPTION 'Lost-response receipt recovery changed result'; END IF;
 PERFORM pg_temp.must_fail(format('SELECT public.submit_employment_action(%L,%L,1,%L::jsonb)',id,gen_random_uuid(),'{"type":"end"}'));
 PERFORM pg_temp.must_fail(format('SELECT public.submit_employment_action(%L,%L,1,%L::jsonb)',id,request_id,'{"type":"end"}'));
 PERFORM pg_temp.must_fail(format('SELECT public.submit_employment_action(%L,%L,1,%L::jsonb)',id,request_id,'{"type":"initialize"}'));
 -- Another caller must not read/replay the receipt or end another player's run.
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.other'),'is_anonymous',true)::text,true);
 PERFORM pg_temp.must_fail(format('SELECT public.submit_employment_action(%L,%L,0,%L::jsonb)',id,request_id,'{"type":"end"}'));
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.owner'),'is_anonymous',false)::text,true);
 PERFORM pg_temp.must_fail(format('SELECT public.submit_employment_action(%L,%L,0,%L::jsonb)',id,request_id,'{"type":"end"}'));
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.owner'),'is_anonymous',true)::text,true);
 -- Initialized end remains on the original path, including its existing receipt.
 initialized:=public.start_individual_playthrough(persona);
 PERFORM public.submit_employment_action(initialized,gen_random_uuid(),0,'{"type":"initialize"}');
 SELECT to_jsonb(p) INTO before_run FROM public.playthroughs p WHERE playthrough_id=initialized;
 before_bills:=public.get_bill_snapshot(initialized)-'run';
 request_id:=gen_random_uuid();
 result:=public.submit_employment_action(initialized,request_id,1,'{"type":"end"}');
 SELECT to_jsonb(p) INTO after_run FROM public.playthroughs p WHERE playthrough_id=initialized;
 IF (after_run-'status'-'employment_state') IS DISTINCT FROM (before_run-'status'-'employment_state')
   OR ((after_run->'employment_state')-'stage'-'reason'-'revision'-'receipts') IS DISTINCT FROM
      ((before_run->'employment_state')-'stage'-'reason'-'revision'-'receipts')
   OR public.get_bill_snapshot(initialized)-'run' IS DISTINCT FROM before_bills THEN
   RAISE EXCEPTION 'Initialized end behavior changed'; END IF;
 IF public.submit_employment_action(initialized,request_id,1,'{"type":"end"}') IS DISTINCT FROM result THEN
   RAISE EXCEPTION 'Initialized receipt recovery changed'; END IF;
 PERFORM set_config('test.initialized',initialized::text,true);
END $$;
RESET ROLE;
-- Trusted local fixture construction only; no gameplay operation is bypassed by
-- the actual authenticated termination requests tested below.
DO $$
DECLARE id uuid; persona uuid; due_day integer;
BEGIN
 SELECT persona_id INTO STRICT persona FROM public.personas WHERE name='[LOCAL TEST] Bills Alex';
 id:=public.start_individual_playthrough(persona);
 PERFORM public.submit_employment_action(id,gen_random_uuid(),0,'{"type":"initialize"}');
 SELECT min(e.due_day) INTO due_day FROM public.playthrough_expenses e WHERE playthrough_id=id;
 IF due_day IS NULL THEN RAISE EXCEPTION 'Unresolved bill fixture missing'; END IF;
 UPDATE public.playthroughs SET current_day=due_day,employment_state=jsonb_set(employment_state,'{stage}','"day"') WHERE playthrough_id=id;
 PERFORM set_config('test.bill_run',id::text,true);
 SELECT persona_id INTO STRICT persona FROM public.personas WHERE name='[LOCAL TEST] Alex';
 id:=public.start_individual_playthrough(persona);
 PERFORM public.submit_employment_action(id,gen_random_uuid(),0,'{"type":"initialize"}');
 UPDATE public.playthroughs SET current_day=4,employment_state=jsonb_set(employment_state,'{stage}','"day"'),
   current_scenario_id='63100000-0000-4000-8000-000000000004' WHERE playthrough_id=id;
 PERFORM set_config('test.scenario_run',id::text,true);
 -- Local verification schema lacks hosted's group FK, so a non-null session
 -- suffices to verify this RPC rejects group association before mutation.
 id:=public.start_individual_playthrough(persona);
 UPDATE public.playthroughs SET session_id=gen_random_uuid() WHERE playthrough_id=id;
 PERFORM set_config('test.group_run',id::text,true);
 id:=public.start_individual_playthrough(persona);
 PERFORM public.submit_employment_action(id,gen_random_uuid(),0,'{"type":"initialize"}');
 UPDATE public.playthroughs SET status='completed',current_day=30,
   employment_state=jsonb_set(employment_state,'{stage}','"complete"') WHERE playthrough_id=id;
 PERFORM set_config('test.completed_run',id::text,true);
 id:=public.start_individual_playthrough(persona);
 UPDATE public.playthroughs SET employment_state=employment_state||'{"prepared":false}'::jsonb WHERE playthrough_id=id;
 PERFORM set_config('test.malformed_run',id::text,true);
END $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE id uuid; before_snapshot jsonb; before_run jsonb; request_id uuid;
BEGIN
 FOREACH id IN ARRAY ARRAY[current_setting('test.bill_run')::uuid,current_setting('test.scenario_run')::uuid] LOOP
   before_snapshot:=public.get_bill_snapshot(id);
   before_run:=before_snapshot->'run';
   request_id:=gen_random_uuid();
   PERFORM public.submit_employment_action(id,request_id,1,'{"type":"end"}');
   IF public.get_bill_snapshot(id)-'run' IS DISTINCT FROM before_snapshot-'run' THEN
     RAISE EXCEPTION 'Termination paid/ignored a bill, added fees, or changed decisions/totals'; END IF;
   IF ((public.get_bill_snapshot(id)->'run')-'status'-'employment_state') IS DISTINCT FROM (before_run-'status'-'employment_state') THEN
     RAISE EXCEPTION 'Termination changed day/balance/scenario'; END IF;
 END LOOP;
 PERFORM pg_temp.must_fail(format('SELECT public.submit_employment_action(%L,%L,0,%L::jsonb)',
   current_setting('test.group_run'),gen_random_uuid(),'{"type":"end"}'));
 PERFORM pg_temp.must_fail(format('UPDATE public.playthroughs SET status=''ended'' WHERE playthrough_id=%L',current_setting('test.group_run')));
 PERFORM pg_temp.must_fail(format('SELECT public.submit_employment_action(%L,%L,1,%L::jsonb)',
   current_setting('test.completed_run'),gen_random_uuid(),'{"type":"end"}'));
 PERFORM pg_temp.must_fail(format('SELECT public.submit_employment_action(%L,%L,0,%L::jsonb)',
   current_setting('test.malformed_run'),gen_random_uuid(),'{"type":"end"}'));
END $$;
RESET ROLE;
SELECT 'PASS: fresh/initialized endings, unchanged gameplay/bills/totals, receipts, stale/duplicate/group/ownership rejection';
ROLLBACK;
