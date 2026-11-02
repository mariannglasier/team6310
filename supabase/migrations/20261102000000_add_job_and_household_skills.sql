-- Add only the four requested skill columns. No new rows, editions, prices,
-- default assumptions, policies, grants, or permanent trigger changes.
begin;
alter table public.jobs
  add column if not exists needs_english_skills boolean,
  add column if not exists needs_computer_skills boolean;
alter table public.personas
  add column if not exists has_english_skills boolean,
  add column if not exists has_computer_skills boolean;
notify pgrst, 'reload schema';
commit;
