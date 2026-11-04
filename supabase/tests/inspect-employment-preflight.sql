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

-- Required before hosted deployment: not present in database-schema.csv.
select current_user,session_user;
select rolname,rolsuper,rolbypassrls,rolinherit,rolcanlogin
from pg_roles where rolname in ('postgres','anon','authenticated','service_role','authenticator');
select granted.rolname as granted_role, member.rolname as member_role, m.admin_option
from pg_auth_members m join pg_roles granted on granted.oid=m.roleid
join pg_roles member on member.oid=m.member
where granted.rolname in ('postgres','anon','authenticated','service_role','authenticator')
   or member.rolname in ('postgres','anon','authenticated','service_role','authenticator');
-- Readiness only; no data repair or publication is performed.
select v.version_id, count(*) filter(where j.is_approved and j.is_active
 and j.needs_english_skills=false and j.needs_computer_skills=false) as fallback_jobs
from public.content_versions v left join public.jobs j on j.version_id=v.version_id
where v.status='published' and v.published_at is not null group by v.version_id;
select p.persona_id,p.version_id,p.has_english_skills,p.has_computer_skills
from public.personas p join public.content_versions v on v.version_id=p.version_id
where v.status='published' and v.published_at is not null
 and (p.has_english_skills is null or p.has_computer_skills is null);
