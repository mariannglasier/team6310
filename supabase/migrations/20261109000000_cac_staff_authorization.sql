-- CAC staff authorization foundation.
--
-- Supabase Auth owns credentials (email + password). This table only records
-- which Auth users are authorized CAC staff. It is provisioned by a trusted
-- operator (SQL editor / service role); there is no client write path.
--
-- The hosted project already contains these objects. This migration is
-- idempotent so that local and new environments can reproduce them without
-- altering the hosted definition.

create table if not exists public.cac_staff (
  user_id uuid primary key references auth.users (id),
  active boolean not null default true,
  provisioned_at timestamptz not null default now()
);

-- RLS on with no policies: the browser roles cannot read or write staff rows.
alter table public.cac_staff enable row level security;
revoke all on table public.cac_staff from public, anon, authenticated;

-- True only for an active, non-anonymous staff member bound to the caller's
-- verified Auth identity. Revoking (active = false) takes effect immediately,
-- even if the caller's token has not yet expired.
create or replace function public.is_cac_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.cac_staff s
    join auth.users u on u.id = s.user_id
    where s.user_id = auth.uid()
      and s.active
      and not coalesce(u.is_anonymous, true)
  )
$$;

-- Raises for any actor that is not active staff; for protected operations that
-- run with an elevated role and receive the verified actor explicitly.
create or replace function public.assert_cac_staff(p_actor uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.cac_staff s
    join auth.users u on u.id = s.user_id
    where s.user_id = p_actor
      and s.active
      and not coalesce(u.is_anonymous, true)
  ) then
    raise exception 'Staff authorization required' using errcode = '42501';
  end if;
end
$$;

revoke all on function public.is_cac_staff() from public, anon;
grant execute on function public.is_cac_staff() to authenticated, service_role;

revoke all on function public.assert_cac_staff(uuid) from public, anon, authenticated;
grant execute on function public.assert_cac_staff(uuid) to service_role;
