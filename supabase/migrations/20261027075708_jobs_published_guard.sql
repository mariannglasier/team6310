-- Protect published content: public.jobs rows that belong to a published content version
-- are immutable. This applies to every role (including service_role), so an automated
-- wage sync cannot alter a published edition even if it is misconfigured.
-- Applied to the live project (cac-poverty-exercise) as migration 20261027075708.
begin;

create or replace function public.jobs_reject_published_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  affected_version uuid;
  is_published boolean;
begin
  affected_version := case when tg_op = 'INSERT' then new.version_id else old.version_id end;

  select (v.status = 'published' or v.published_at is not null)
    into is_published
    from public.content_versions v
   where v.version_id = affected_version;

  if coalesce(is_published, false) then
    raise exception 'jobs in published content version % are immutable; stage changes in a draft version', affected_version
      using errcode = 'check_violation';
  end if;

  if tg_op = 'UPDATE' and new.version_id is distinct from old.version_id then
    select (v.status = 'published' or v.published_at is not null)
      into is_published
      from public.content_versions v
     where v.version_id = new.version_id;
    if coalesce(is_published, false) then
      raise exception 'jobs cannot be moved into published content version %', new.version_id
        using errcode = 'check_violation';
    end if;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists jobs_reject_published_changes on public.jobs;
create trigger jobs_reject_published_changes
  before insert or update or delete on public.jobs
  for each row execute function public.jobs_reject_published_changes();

commit;
