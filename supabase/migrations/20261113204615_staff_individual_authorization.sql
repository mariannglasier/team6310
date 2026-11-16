-- Stage 1 only: forward authorization extension, no data backfill or ownership transfer.
-- Reviewed against hosted definitions on 2026-11-13. Not authorization to deploy hosted.
BEGIN;
DO $preflight$
DECLARE item record;
BEGIN
 IF to_regprocedure('public.is_individual_player()') IS NOT NULL THEN
   RAISE EXCEPTION 'Individual authorization helper already exists; review before applying';
 END IF;
 FOR item IN SELECT * FROM (VALUES
 ('public.start_individual_playthrough(uuid)','67de7538a672fb1a4c63bd1136952659'),
 ('public.mark_fresh_employment_run()','7f4a9698e3229176ec38a71072f7bba1'),
 ('public.initialize_fresh_bill_schedule()','ecf4968e0f57fd9795615787f3f84465'),
 ('public.submit_employment_action(uuid,uuid,integer,jsonb)','3d80609fb36b9ee1fa47d93a9c55000b'),
 ('public.submit_scenario_decision(uuid,uuid,uuid)','edf74410eb87fbc8f3a004b9c85c2f72'),
 ('public.restore_scenario_decision(uuid,uuid)','47c556662ed8babea7dc23afa7ed6beb'),
 ('public.pay_bill(uuid,uuid)','58d6aab1473afb67f2b754fdc0c39f97'),
 ('public.ignore_bill(uuid,uuid)','dad59592826bee7f93e6afea84176fb3'),
 ('public.get_bill_snapshot(uuid)','7bf9c626e811117d3e2fbafd11d4cbc0'),
 ('public.get_scenario_recap_facts(uuid,uuid)','f8136000ca98d743bfbec6d4413b843a'),
 ('public.get_event_recap_facts(uuid,text)','16bc8a979bb9269940a31623ecf3976c')
 ) AS reviewed(signature, definition_hash) LOOP
   IF to_regprocedure(item.signature) IS NULL OR
      md5(pg_get_functiondef(to_regprocedure(item.signature))) IS DISTINCT FROM item.definition_hash THEN
     RAISE EXCEPTION 'Definition drift for %; stop and review before applying', item.signature;
   END IF;
 END LOOP;
 IF md5(pg_get_functiondef('public.is_cac_staff()'::regprocedure)) <> 'f017dec2d2bf2e7c238e2b66754ada64' THEN
   RAISE EXCEPTION 'Staff authorization definition drift; stop and review';
 END IF;
END $preflight$;

CREATE FUNCTION public.is_individual_player() RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $helper$
 SELECT auth.uid() IS NOT NULL AND
   (coalesce((auth.jwt()->>'is_anonymous')::boolean,false) OR public.is_cac_staff());
$helper$;
-- Remove even privileges inherited from an installation's default ACL.
DO $acl$
DECLARE grantee_name text;
BEGIN
 FOR grantee_name IN
   SELECT DISTINCT CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE quote_ident(r.rolname) END
   FROM pg_proc p CROSS JOIN LATERAL aclexplode(p.proacl) a
   LEFT JOIN pg_roles r ON r.oid=a.grantee
   WHERE p.oid='public.is_individual_player()'::regprocedure AND a.grantee<>p.proowner
 LOOP
   EXECUTE 'REVOKE ALL ON FUNCTION public.is_individual_player() FROM '||grantee_name;
 END LOOP;
END $acl$;
GRANT EXECUTE ON FUNCTION public.is_individual_player() TO authenticated, service_role;

-- Patch ONLY the reviewed admission expression in the current definitions.
-- CREATE OR REPLACE retains function ownership, ACLs, signatures and settings;
-- the complete deployed gameplay bodies (including forward extensions) survive.
DO $extend$
DECLARE item record; definition text; updated text;
BEGIN
 FOR item IN SELECT * FROM (VALUES
 ('public.start_individual_playthrough(uuid)','67de7538a672fb1a4c63bd1136952659'),
 ('public.mark_fresh_employment_run()','7f4a9698e3229176ec38a71072f7bba1'),
 ('public.initialize_fresh_bill_schedule()','ecf4968e0f57fd9795615787f3f84465'),
 ('public.submit_employment_action(uuid,uuid,integer,jsonb)','3d80609fb36b9ee1fa47d93a9c55000b'),
 ('public.submit_scenario_decision(uuid,uuid,uuid)','edf74410eb87fbc8f3a004b9c85c2f72'),
 ('public.restore_scenario_decision(uuid,uuid)','47c556662ed8babea7dc23afa7ed6beb'),
 ('public.pay_bill(uuid,uuid)','58d6aab1473afb67f2b754fdc0c39f97'),
 ('public.ignore_bill(uuid,uuid)','dad59592826bee7f93e6afea84176fb3'),
 ('public.get_bill_snapshot(uuid)','7bf9c626e811117d3e2fbafd11d4cbc0'),
 ('public.get_scenario_recap_facts(uuid,uuid)','f8136000ca98d743bfbec6d4413b843a'),
 ('public.get_event_recap_facts(uuid,text)','16bc8a979bb9269940a31623ecf3976c')
 ) AS reviewed(signature, definition_hash) LOOP
   definition:=pg_get_functiondef(to_regprocedure(item.signature));
   IF item.signature='public.start_individual_playthrough(uuid)' THEN
     updated:=replace(definition,'IF auth.uid() IS NULL THEN','IF public.is_individual_player() IS NOT TRUE THEN');
   ELSE
     updated:=regexp_replace(definition,
       'coalesce\(\(auth.jwt\(\)->>''is_anonymous''\)::boolean,\s*false\)',
       'public.is_individual_player()', 'gi');
   END IF;
   IF updated=definition OR position('is_anonymous' in updated)>0 THEN
     RAISE EXCEPTION 'Unexpected admission expression in %; stop and review',item.signature;
   END IF;
   EXECUTE updated;
 END LOOP;
END $extend$;

-- Extend the existing insertion constraint rather than replacing its invariants.
DO $policies$
DECLARE predicate text; read_predicate text;
BEGIN
 SELECT pg_get_expr(polwithcheck,polrelid) INTO predicate FROM pg_policy
 WHERE polrelid='public.playthroughs'::regclass AND polname='player_start_own_playthrough'
 AND polcmd='a' AND polpermissive AND polroles=ARRAY['authenticated'::regrole::oid];
 SELECT pg_get_expr(polqual,polrelid) INTO read_predicate FROM pg_policy
 WHERE polrelid='public.playthroughs'::regclass AND polname='player_read_own_playthrough'
 AND polcmd='r' AND polpermissive AND polroles=ARRAY['authenticated'::regrole::oid];
 IF md5(predicate) IS DISTINCT FROM 'f6937dd752ca45cd0bbf7b1861009ecf'
 OR read_predicate IS DISTINCT FROM '(owner_user_id = ( SELECT auth.uid() AS uid))'
 OR (SELECT count(*) FROM pg_policy WHERE polrelid='public.playthroughs'::regclass)<>2 THEN
   RAISE EXCEPTION 'Ownership policies differ from reviewed definitions; stop and review';
 END IF;
 EXECUTE format('ALTER POLICY player_start_own_playthrough ON public.playthroughs WITH CHECK ((%s) AND (SELECT public.is_individual_player()))',predicate);
 -- Existing group-row visibility is unchanged. Child response/expense policies
 -- continue to use this RLS-protected parent lookup.
 ALTER POLICY player_read_own_playthrough ON public.playthroughs USING (
   owner_user_id=(SELECT auth.uid()) AND
   (session_id IS NOT NULL OR (SELECT public.is_individual_player()))
 );
END $policies$;
NOTIFY pgrst, 'reload schema';
COMMIT;
