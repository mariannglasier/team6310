-- Read-only review queries for the development project. No DDL or DML.
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint where conrelid='public.playthroughs'::regclass;
select relrowsecurity, relforcerowsecurity from pg_class
where oid='public.playthroughs'::regclass;
select policyname,roles,cmd,qual,with_check from pg_policies
where schemaname='public' and tablename='playthroughs';
select grantee,privilege_type from information_schema.role_table_grants
where table_schema='public' and table_name='playthroughs';
select pg_get_functiondef('public.start_individual_playthrough(uuid)'::regprocedure);
-- Counts only: never expose participant histories in review output.
select count(*) filter(where employment_state is null) as legacy_null_runs,
 count(*) filter(where employment_state is not null) as nonnull_documents
from public.playthroughs;
