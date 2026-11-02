-- DEVELOPMENT SETUP. Run as the database administrator after the skills migration.
-- Household starting values were explicitly approved November 2, 2026.
-- No qualifications other than English and computer skills are considered.
-- The seven mapped job requirements follow the approved prototype skill tiers.
-- Home Health requires English only, explicitly approved November 2, 2026.
-- There are three no-skill jobs.
-- This updates ONLY the four new columns in the existing Version 1 rows.
begin;
lock table public.jobs, public.personas in access exclusive mode;

create temporary table job_skills (
  soc_code text primary key, english boolean, computer boolean
) on commit drop;
insert into job_skills values
  ('35-3023', false, false), -- Fast Food Worker
  ('37-2011', false, false), -- Janitor / Cleaner
  ('53-7065', false, false), -- Warehouse Stocker
  ('41-2011', true, false),  -- Cashier
  ('41-2031', true, false),  -- Retail Sales Associate
  ('43-9061', true, true),   -- General Office Clerk
  ('43-4051', true, true),   -- Customer Service Representative
  ('31-1120', true, false);  -- Home Health / Personal Care Aide

create temporary table household_skills (
  name text primary key, english boolean, computer boolean
) on commit drop;
insert into household_skills values
  ('Alex', true, false),
  ('Jordan', true, false),
  ('Patricia', false, false),
  ('Sofia', false, true);

do $$
begin
  if exists (select 1 from household_skills where english is null or computer is null) then
    raise exception 'Fill each household English/computer value with true or false before running. No rows were changed.';
  end if;
  if (select count(*) from public.jobs where version_id = 'fccbe3fe-be0b-4cdc-b6c3-4adb540e3dd1') <> 8
    or (select count(*) from public.personas where version_id = 'fccbe3fe-be0b-4cdc-b6c3-4adb540e3dd1') <> 4 then
    raise exception 'Expected the existing Version 1 catalog: eight jobs and four households.';
  end if;
  if (select count(*) from public.personas p join household_skills s using (name)
    where p.version_id = 'fccbe3fe-be0b-4cdc-b6c3-4adb540e3dd1') <> 4 then
    raise exception 'Household names do not match. No rows were changed.';
  end if;
  if (select count(*) from public.jobs j join job_skills s using (soc_code)
    where j.version_id = 'fccbe3fe-be0b-4cdc-b6c3-4adb540e3dd1') <> 8 then
    raise exception 'Job SOC codes do not match. No rows were changed.';
  end if;
end $$;

-- Snapshot every existing value except the requested skill columns. The final
-- assertions abort/roll back the transaction if any other value or row changes.
create temporary table jobs_before on commit drop as
select job_id, to_jsonb(j) - 'needs_english_skills' - 'needs_computer_skills' as data
from public.jobs j;
create temporary table personas_before on commit drop as
select persona_id, to_jsonb(p) - 'has_english_skills' - 'has_computer_skills' as data
from public.personas p;
create temporary table versions_before on commit drop as
select version_id, to_jsonb(v) as data from public.content_versions v;

-- The existing published-job guard blocks even initializing newly added flags.
-- This one administrator transaction holds exclusive locks and restores that
-- same guard before committing. It does not grant anyone new write access.
alter table public.jobs disable trigger jobs_reject_published_changes;
update public.jobs j
set needs_english_skills = s.english, needs_computer_skills = s.computer
from job_skills s
where j.version_id = 'fccbe3fe-be0b-4cdc-b6c3-4adb540e3dd1' and j.soc_code = s.soc_code;
alter table public.jobs enable trigger jobs_reject_published_changes;

update public.personas p
set has_english_skills = s.english, has_computer_skills = s.computer
from household_skills s
where p.version_id = 'fccbe3fe-be0b-4cdc-b6c3-4adb540e3dd1' and p.name = s.name;

do $$
begin
  if exists (select 1 from public.jobs j full join jobs_before b using (job_id)
    where b.data is distinct from (to_jsonb(j) - 'needs_english_skills' - 'needs_computer_skills')) then
    raise exception 'Unexpected job row change outside skill columns. Rolling back.';
  end if;
  if exists (select 1 from public.personas p full join personas_before b using (persona_id)
    where b.data is distinct from (to_jsonb(p) - 'has_english_skills' - 'has_computer_skills')) then
    raise exception 'Unexpected household row change outside skill columns. Rolling back.';
  end if;
  if exists (select 1 from public.content_versions v full join versions_before b using (version_id)
    where b.data is distinct from to_jsonb(v)) then
    raise exception 'Unexpected edition change. Rolling back.';
  end if;
  if (select count(*) from public.jobs where version_id = 'fccbe3fe-be0b-4cdc-b6c3-4adb540e3dd1'
    and is_approved and is_active and needs_english_skills = false and needs_computer_skills = false) < 2 then
    raise exception 'At least two available jobs must require neither skill. Rolling back.';
  end if;
end $$;

select title, needs_english_skills, needs_computer_skills
from public.jobs where version_id = 'fccbe3fe-be0b-4cdc-b6c3-4adb540e3dd1' order by title;
select name, has_english_skills, has_computer_skills
from public.personas where version_id = 'fccbe3fe-be0b-4cdc-b6c3-4adb540e3dd1' order by name;
commit;
