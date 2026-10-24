-- Temporary integration table only; apply manually to the development project.
begin;

create table public.integration_test (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  message text not null check (length(btrim(message)) > 0),
  created_at timestamptz not null default now()
);

alter table public.integration_test enable row level security;

-- Override any default table grants. No public/anon access or updates/deletes.
revoke all on table public.integration_test from public, anon, authenticated;
grant insert (owner_id, message) on public.integration_test to authenticated;
grant select on public.integration_test to authenticated;

create policy integration_test_insert_own on public.integration_test
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (select auth.jwt() ->> 'is_anonymous') = 'true'
  );

create policy integration_test_select_own on public.integration_test
  for select to authenticated
  using (
    owner_id = (select auth.uid())
    and (select auth.jwt() ->> 'is_anonymous') = 'true'
  );

commit;
