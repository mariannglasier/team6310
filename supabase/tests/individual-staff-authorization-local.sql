-- Full reconciled LOCAL Supabase database only, after Stage 1.
-- SQL-role verification with simulated JWT claims, not genuine Auth/API sessions.
-- Every fixture identity, authorization record and run rolls back.
BEGIN;
SET LOCAL statement_timeout='20s';
CREATE TEMP TABLE stage1_actors(kind text PRIMARY KEY, id uuid DEFAULT gen_random_uuid());
INSERT INTO stage1_actors(kind) VALUES('anonymous'),('staff'),('other_staff'),('ordinary');
INSERT INTO auth.users(id,is_anonymous,aud,role)
 SELECT id,kind='anonymous','authenticated','authenticated' FROM stage1_actors;
INSERT INTO public.cac_staff(user_id) SELECT id FROM stage1_actors WHERE kind IN ('staff','other_staff');
CREATE TEMP TABLE stage1_runs(kind text PRIMARY KEY,id uuid);
GRANT SELECT ON stage1_actors TO authenticated;
GRANT SELECT,INSERT ON stage1_runs TO authenticated;
CREATE FUNCTION pg_temp.reject(statement text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
 BEGIN EXECUTE statement;
 EXCEPTION WHEN insufficient_privilege OR raise_exception THEN RETURN; END;
 RAISE EXCEPTION 'Expected rejection: %',statement;
END $$;
-- Same SQL assertions run under both eligible identities, through actual API role.
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',id,'role','authenticated','is_anonymous',true)::text,true)
 FROM stage1_actors WHERE kind='anonymous';
SET LOCAL ROLE authenticated;
DO $$
DECLARE pid uuid; rid uuid; request uuid:=gen_random_uuid(); result jsonb; retry jsonb;
BEGIN
 ASSERT public.is_individual_player();
 SELECT persona_id INTO STRICT pid FROM public.personas WHERE name='[LOCAL TEST] Bills Alex';
 rid:=public.start_individual_playthrough(pid);
 INSERT INTO stage1_runs VALUES('anonymous',rid);
 ASSERT (SELECT owner_user_id=auth.uid() FROM public.playthroughs WHERE playthrough_id=rid);
 ASSERT public.get_bill_snapshot(rid) IS NOT NULL;
 ASSERT (SELECT count(*)>0 FROM public.playthrough_expenses WHERE playthrough_id=rid);
 result:=public.submit_employment_action(rid,request,0,'{"type":"end"}');
 retry:=public.submit_employment_action(rid,request,0,'{"type":"end"}');
 ASSERT result=retry;
 ASSERT result->'run'->>'status'='ended';
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',id,'role','authenticated','is_anonymous',false)::text,true)
 FROM stage1_actors WHERE kind='staff';
SET LOCAL ROLE authenticated;
DO $$
DECLARE pid uuid; rid uuid; request uuid:=gen_random_uuid(); result jsonb;
BEGIN
 ASSERT public.is_cac_staff() AND public.is_individual_player();
 SELECT persona_id INTO STRICT pid FROM public.personas WHERE name='[LOCAL TEST] Bills Alex';
 rid:=public.start_individual_playthrough(pid);
 INSERT INTO stage1_runs VALUES('staff',rid);
 ASSERT (SELECT owner_user_id=auth.uid() FROM public.playthroughs WHERE playthrough_id=rid);
 ASSERT public.get_bill_snapshot(rid) IS NOT NULL;
 ASSERT (SELECT count(*)>0 FROM public.playthrough_expenses WHERE playthrough_id=rid);
 result:=public.submit_employment_action(rid,request,0,'{"type":"initialize"}');
 ASSERT result=public.submit_employment_action(rid,request,0,'{"type":"initialize"}');
 ASSERT result->'run'->'employment_state'->>'stage'='board';
 result:=public.submit_employment_action(rid,gen_random_uuid(),1,'{"type":"end"}');
 ASSERT result->'run'->>'status'='ended';
 PERFORM pg_temp.reject('SELECT public.configure_host_group_session(true,60,false)');
 PERFORM pg_temp.reject('SELECT public.join_group_session(''MISSINGCODE'')');
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',id,'role','authenticated','is_anonymous',false)::text,true)
 FROM stage1_actors WHERE kind='other_staff';
SET LOCAL ROLE authenticated;
DO $$
DECLARE rid uuid:=(SELECT id FROM stage1_runs WHERE kind='staff');
BEGIN
 ASSERT public.is_individual_player();
 ASSERT NOT EXISTS(SELECT 1 FROM public.playthroughs WHERE playthrough_id=rid);
 ASSERT NOT EXISTS(SELECT 1 FROM public.playthrough_expenses WHERE playthrough_id=rid);
 ASSERT public.get_bill_snapshot(rid) IS NULL;
 PERFORM pg_temp.reject(format('SELECT public.submit_employment_action(%L,%L,0,%L::jsonb)',rid,gen_random_uuid(),'{"type":"end"}'));
 PERFORM pg_temp.reject(format('SELECT public.pay_bill(%L,%L)',rid,gen_random_uuid()));
 PERFORM pg_temp.reject(format('SELECT public.ignore_bill(%L,%L)',rid,gen_random_uuid()));
 PERFORM pg_temp.reject(format('SELECT public.submit_scenario_decision(%L,%L,%L)',rid,gen_random_uuid(),gen_random_uuid()));
END $$;
RESET ROLE;
UPDATE public.cac_staff SET active=false WHERE user_id=(SELECT id FROM stage1_actors WHERE kind='staff');
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',id,'role','authenticated','is_anonymous',false)::text,true)
 FROM stage1_actors WHERE kind='staff';
SET LOCAL ROLE authenticated;
DO $$
DECLARE rid uuid:=(SELECT id FROM stage1_runs WHERE kind='staff'); pid uuid;
BEGIN
 ASSERT NOT public.is_cac_staff() AND NOT public.is_individual_player();
 ASSERT NOT EXISTS(SELECT 1 FROM public.playthroughs WHERE playthrough_id=rid);
 ASSERT NOT EXISTS(SELECT 1 FROM public.playthrough_expenses WHERE playthrough_id=rid);
 ASSERT NOT EXISTS(SELECT 1 FROM public.player_responses WHERE playthrough_id=rid);
 ASSERT public.get_bill_snapshot(rid) IS NULL;
 ASSERT public.restore_scenario_decision(rid,gen_random_uuid()) IS NULL;
 ASSERT NOT EXISTS(SELECT 1 FROM public.get_event_recap_facts(rid,'D001'));
 ASSERT NOT EXISTS(SELECT 1 FROM public.get_scenario_recap_facts(rid,gen_random_uuid()));
 SELECT persona_id INTO STRICT pid FROM public.personas WHERE name='[LOCAL TEST] Bills Alex';
 PERFORM pg_temp.reject(format('SELECT public.start_individual_playthrough(%L)',pid));
 PERFORM pg_temp.reject(format('SELECT public.submit_employment_action(%L,%L,0,%L::jsonb)',rid,gen_random_uuid(),'{"type":"end"}'));
 PERFORM pg_temp.reject(format('SELECT public.pay_bill(%L,%L)',rid,gen_random_uuid()));
 PERFORM pg_temp.reject(format('SELECT public.ignore_bill(%L,%L)',rid,gen_random_uuid()));
 PERFORM pg_temp.reject(format('SELECT public.submit_scenario_decision(%L,%L,%L)',rid,gen_random_uuid(),gen_random_uuid()));
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',id,'role','authenticated','is_anonymous',false)::text,true)
 FROM stage1_actors WHERE kind='ordinary';
SET LOCAL ROLE authenticated;
DO $$
DECLARE pid uuid;
BEGIN
 ASSERT NOT public.is_individual_player();
 SELECT persona_id INTO STRICT pid FROM public.personas WHERE name='[LOCAL TEST] Bills Alex';
 PERFORM pg_temp.reject(format('SELECT public.start_individual_playthrough(%L)',pid));
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',id,'role','authenticated','is_anonymous',true)::text,true)
 FROM stage1_actors WHERE kind='anonymous';
SET LOCAL ROLE authenticated;
DO $$
DECLARE rid uuid:=(SELECT id FROM stage1_runs WHERE kind='anonymous');
BEGIN
 ASSERT public.is_individual_player();
 ASSERT EXISTS(SELECT 1 FROM public.playthroughs WHERE playthrough_id=rid);
 ASSERT public.get_bill_snapshot(rid) IS NOT NULL;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: local SQL-role admission, initialization, termination/retry, ownership, revocation, child RLS, snapshots/recaps and staff group denial; all fixtures rolled back' AS verification;
