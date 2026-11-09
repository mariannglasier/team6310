-- Let authorized CAC staff read the approved scenario categories so the admin
-- dashboard can name each scenario's category. Read-only and staff-only: no
-- policy exists for anon or for non-staff users, and no write policy is added.
-- Other content tables are already readable through their published-edition
-- policies, and the CAC service tables already have staff read policies.

drop policy if exists "staff_read_categories" on public.categories;
create policy "staff_read_categories"
  on public.categories
  for select
  to authenticated
  using ((select public.is_cac_staff()));
