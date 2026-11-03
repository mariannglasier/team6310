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

-- Candidate owner and bypass attributes; function ownership will be pinned here.
select r.rolname,r.rolsuper,r.rolbypassrls,c.relrowsecurity,c.relforcerowsecurity
from pg_class c join pg_roles r on r.oid=c.relowner
where c.oid='public.playthroughs'::regclass;
select c.relname,r.rolname as table_owner,c.relrowsecurity,c.relforcerowsecurity
from pg_class c join pg_roles r on r.oid=c.relowner
where c.oid in ('public.personas'::regclass,'public.jobs'::regclass,'public.content_versions'::regclass);
select pg_get_userbyid(defaclrole) as creator,defaclnamespace::regnamespace,defaclobjtype,defaclacl
from pg_default_acl where defaclobjtype='f';
select member.rolname as member, parent.rolname as inherited_role
from pg_auth_members m join pg_roles member on member.oid=m.member
join pg_roles parent on parent.oid=m.roleid;
select p.oid::regprocedure as function,p.proowner::regrole as owner,
 p.prosecdef,p.proconfig,p.proacl
from pg_proc p where p.pronamespace='public'::regnamespace
and p.proname in ('mark_fresh_employment_run','submit_employment_action','valid_employment_document');
