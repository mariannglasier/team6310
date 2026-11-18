-- Explore Data page: categories, sources, statistics and published observations.
--
-- Separate from the edition-scoped gameplay `statistics` table (see
-- docs/data-model.md "Explorer statistics"). Nothing here feeds the simulation.
--
-- Access model
--   * Browser roles (anon, authenticated) have NO direct table access except a
--     staff-only SELECT policy. Visitors read through the two RPCs below, which
--     return published rows only and never expose staged values, source
--     bindings or internal status.
--   * No client write policy exists. Ingestion uses the service role through
--     record_explorer_observation, which auto-publishes routine refreshes
--     (no staff approval) but stages first values for staff. Staff publish and
--     restore through staff-checked RPCs.
--   * Observations are immutable apart from controlled status transitions.
--
-- Depends on public.is_cac_staff() from 20261109000000_cac_staff_authorization.sql.
-- Applying this to the hosted project is a separate, explicitly approved step.

------------------------------------------------------------------------------
-- Shared helpers
------------------------------------------------------------------------------

create or replace function public.explorer_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

------------------------------------------------------------------------------
-- Sources (provenance)
------------------------------------------------------------------------------

create table if not exists public.explorer_sources (
  source_id text primary key
    check (source_id ~ '^[a-z][a-z0-9_]{1,62}$'),
  name text not null check (btrim(name) <> ''),
  title text not null check (btrim(title) <> ''),
  url text not null check (url ~ '^https://[^[:space:]]+$'),
  access_method text not null
    check (access_method in ('api', 'file_import', 'manual', 'client_provided')),
  update_cadence text,
  created_at timestamptz not null default now()
);

------------------------------------------------------------------------------
-- Categories
------------------------------------------------------------------------------

create table if not exists public.explorer_categories (
  category_key text primary key
    check (category_key ~ '^[a-z][a-z0-9_]{1,30}$'),
  name text not null check (btrim(name) <> ''),
  short_label text not null check (btrim(short_label) <> ''),
  description text not null check (btrim(description) <> ''),
  icon_key text not null check (icon_key ~ '^[a-z][a-z0-9_-]{1,30}$'),
  display_order integer not null check (display_order > 0),
  visualization_type text not null
    check (visualization_type in (
      'housing_windows', 'grocery_cart', 'job_board',
      'garment_rail', 'school_bus', 'budget_workbench'
    )),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint explorer_categories_display_order_key
    unique (display_order) deferrable initially deferred
);

drop trigger if exists explorer_categories_touch on public.explorer_categories;
create trigger explorer_categories_touch
  before update on public.explorer_categories
  for each row execute function public.explorer_touch_updated_at();

------------------------------------------------------------------------------
-- Statistics (definitions; values live in observations)
------------------------------------------------------------------------------

create table if not exists public.explorer_statistics (
  statistic_key text primary key
    check (statistic_key ~ '^[a-z][a-z0-9_]{2,62}$'),
  category_key text not null
    references public.explorer_categories (category_key) on update cascade,
  source_id text not null
    references public.explorer_sources (source_id) on update cascade,
  title text not null check (btrim(title) <> ''),
  -- What the statistic measures, shown beside the visual.
  description text not null check (btrim(description) <> ''),
  -- Limits and cautions about interpretation (optional).
  context_note text,
  unit text not null
    check (unit in (
      'percent', 'percent_change', 'usd', 'cents_per_kwh', 'index', 'count'
    )),
  geography text not null check (btrim(geography) <> ''),
  geography_code text,
  visualization_type text not null
    check (visualization_type in (
      'meter', 'pictogram', 'trend', 'comparison', 'figure'
    )),
  visualization_config jsonb not null default '{}'::jsonb
    check (jsonb_typeof(visualization_config) = 'object'),
  -- Non-secret retrieval binding (series id, table, variables, parameters).
  -- Never returned by the public RPCs. Credentials never belong here.
  source_reference jsonb not null default '{}'::jsonb
    check (jsonb_typeof(source_reference) = 'object'),
  is_derived boolean not null default false,
  derivation_note text,
  display_order integer not null default 1 check (display_order > 0),
  active boolean not null default true,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint explorer_statistics_derived_note
    check (not is_derived or nullif(btrim(derivation_note), '') is not null),
  -- A share of a whole must be a 0-100 percentage.
  constraint explorer_statistics_share_unit
    check (visualization_type not in ('meter', 'pictogram') or unit = 'percent'),
  constraint explorer_statistics_pictogram_config
    check (
      visualization_type <> 'pictogram'
      or (
        visualization_config ? 'icon'
        and case
          when visualization_config ->> 'total' ~ '^[0-9]{1,3}$'
            then (visualization_config ->> 'total')::integer between 1 and 100
          else false
        end
      )
    )
);

create index if not exists explorer_statistics_category_idx
  on public.explorer_statistics (category_key, display_order);

drop trigger if exists explorer_statistics_touch on public.explorer_statistics;
create trigger explorer_statistics_touch
  before update on public.explorer_statistics
  for each row execute function public.explorer_touch_updated_at();

------------------------------------------------------------------------------
-- Observations (immutable values with provenance)
------------------------------------------------------------------------------

create table if not exists public.explorer_statistic_observations (
  observation_id uuid primary key default gen_random_uuid(),
  statistic_key text not null
    references public.explorer_statistics (statistic_key) on update cascade,
  value numeric not null,
  -- Upper bound when the figure is a published or derived range.
  value_high numeric,
  period_label text not null check (btrim(period_label) <> ''),
  period_start date,
  period_end date,
  -- Source release or vintage identifier; keeps repeated checks idempotent.
  revision_key text not null default '',
  retrieved_at timestamptz not null default now(),
  retrieval_method text not null
    check (retrieval_method in ('api', 'file_import', 'manual')),
  status text not null default 'staged'
    check (status in ('staged', 'published', 'superseded', 'rejected')),
  published_at timestamptz,
  published_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  constraint explorer_observations_identity
    unique (statistic_key, period_label, revision_key),
  constraint explorer_observations_range
    check (value_high is null or value_high >= value),
  constraint explorer_observations_period
    check (period_start is null or period_end is null or period_end >= period_start),
  constraint explorer_observations_publication
    check ((status in ('published', 'superseded')) = (published_at is not null))
);

-- At most one published observation per statistic.
create unique index if not exists explorer_observations_one_published
  on public.explorer_statistic_observations (statistic_key)
  where status = 'published';

create index if not exists explorer_observations_lookup_idx
  on public.explorer_statistic_observations (statistic_key, status);

-- Value rules depend on the statistic's unit, so validate in a trigger.
create or replace function public.explorer_validate_observation()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_unit text;
begin
  select s.unit into v_unit
  from public.explorer_statistics s
  where s.statistic_key = new.statistic_key;

  if v_unit = 'percent' and (
    new.value not between 0 and 100
    or (new.value_high is not null and new.value_high not between 0 and 100)
  ) then
    raise exception 'A percent value must be between 0 and 100'
      using errcode = '23514';
  end if;

  if v_unit in ('usd', 'cents_per_kwh', 'index', 'count') and new.value < 0 then
    raise exception 'A % value cannot be negative', v_unit
      using errcode = '23514';
  end if;

  return new;
end
$$;

drop trigger if exists explorer_observations_validate
  on public.explorer_statistic_observations;
create trigger explorer_observations_validate
  before insert on public.explorer_statistic_observations
  for each row execute function public.explorer_validate_observation();

-- Observations are immutable. Only controlled status transitions are allowed.
create or replace function public.explorer_guard_observation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Observations cannot be deleted' using errcode = '23000';
  end if;

  if (new.observation_id, new.statistic_key, new.value, new.value_high,
      new.period_label, new.period_start, new.period_end, new.revision_key,
      new.retrieved_at, new.retrieval_method, new.created_at)
     is distinct from
     (old.observation_id, old.statistic_key, old.value, old.value_high,
      old.period_label, old.period_start, old.period_end, old.revision_key,
      old.retrieved_at, old.retrieval_method, old.created_at) then
    raise exception 'Observation values are immutable' using errcode = '23000';
  end if;

  if new.status is distinct from old.status and not (
    (old.status = 'staged' and new.status in ('published', 'rejected'))
    or (old.status = 'published' and new.status = 'superseded')
    or (old.status = 'superseded' and new.status = 'published')
  ) then
    raise exception 'Invalid observation status change: % to %',
      old.status, new.status using errcode = '23000';
  end if;

  return new;
end
$$;

drop trigger if exists explorer_observations_guard
  on public.explorer_statistic_observations;
create trigger explorer_observations_guard
  before update or delete on public.explorer_statistic_observations
  for each row execute function public.explorer_guard_observation();

------------------------------------------------------------------------------
-- Row Level Security and privileges
------------------------------------------------------------------------------

alter table public.explorer_sources enable row level security;
alter table public.explorer_categories enable row level security;
alter table public.explorer_statistics enable row level security;
alter table public.explorer_statistic_observations enable row level security;

revoke all on table
  public.explorer_sources,
  public.explorer_categories,
  public.explorer_statistics,
  public.explorer_statistic_observations
from public, anon, authenticated;

-- Staff may read everything (including staged data) for review. There is no
-- write policy: ingestion uses the service role, and staff publish via RPC.
grant select on table
  public.explorer_sources,
  public.explorer_categories,
  public.explorer_statistics,
  public.explorer_statistic_observations
to authenticated;

grant select, insert, update on table
  public.explorer_sources,
  public.explorer_categories,
  public.explorer_statistics,
  public.explorer_statistic_observations
to service_role;

drop policy if exists "staff_read_explorer_sources" on public.explorer_sources;
create policy "staff_read_explorer_sources"
  on public.explorer_sources for select to authenticated
  using ((select public.is_cac_staff()));

drop policy if exists "staff_read_explorer_categories" on public.explorer_categories;
create policy "staff_read_explorer_categories"
  on public.explorer_categories for select to authenticated
  using ((select public.is_cac_staff()));

drop policy if exists "staff_read_explorer_statistics" on public.explorer_statistics;
create policy "staff_read_explorer_statistics"
  on public.explorer_statistics for select to authenticated
  using ((select public.is_cac_staff()));

drop policy if exists "staff_read_explorer_observations"
  on public.explorer_statistic_observations;
create policy "staff_read_explorer_observations"
  on public.explorer_statistic_observations for select to authenticated
  using ((select public.is_cac_staff()));

------------------------------------------------------------------------------
-- Public read RPCs (published rows only)
------------------------------------------------------------------------------

create or replace function public.get_explorer_categories()
returns table (
  category_key text,
  name text,
  short_label text,
  description text,
  icon_key text,
  display_order integer,
  visualization_type text,
  statistic_count integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.category_key,
    c.name,
    c.short_label,
    c.description,
    c.icon_key,
    c.display_order,
    c.visualization_type,
    (
      select count(*)::integer
      from public.explorer_statistics s
      join public.explorer_statistic_observations o
        on o.statistic_key = s.statistic_key and o.status = 'published'
      where s.category_key = c.category_key and s.active
    )
  from public.explorer_categories c
  where c.published
  order by c.display_order
$$;

create or replace function public.get_explorer_category_statistics(
  p_category_key text
)
returns table (
  statistic_key text,
  title text,
  description text,
  context_note text,
  value numeric,
  value_high numeric,
  unit text,
  geography text,
  geography_code text,
  period_label text,
  period_start date,
  period_end date,
  source_name text,
  source_title text,
  source_url text,
  last_checked_at timestamptz,
  visualization_type text,
  visualization_config jsonb,
  is_derived boolean,
  derivation_note text,
  display_order integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.statistic_key,
    s.title,
    s.description,
    s.context_note,
    o.value,
    o.value_high,
    s.unit,
    s.geography,
    s.geography_code,
    o.period_label,
    o.period_start,
    o.period_end,
    src.name,
    src.title,
    src.url,
    coalesce(s.last_checked_at, o.retrieved_at),
    s.visualization_type,
    s.visualization_config,
    s.is_derived,
    s.derivation_note,
    s.display_order
  from public.explorer_categories c
  join public.explorer_statistics s on s.category_key = c.category_key
  join public.explorer_statistic_observations o
    on o.statistic_key = s.statistic_key and o.status = 'published'
  join public.explorer_sources src on src.source_id = s.source_id
  where c.category_key = p_category_key
    and c.published
    and s.active
  order by s.display_order, s.statistic_key
$$;

revoke all on function public.get_explorer_categories() from public;
revoke all on function public.get_explorer_category_statistics(text) from public;
grant execute on function public.get_explorer_categories()
  to anon, authenticated, service_role;
grant execute on function public.get_explorer_category_statistics(text)
  to anon, authenticated, service_role;

------------------------------------------------------------------------------
-- Staff publish and restore
------------------------------------------------------------------------------

-- Internal: promote one observation and supersede the current one atomically.
create or replace function public.explorer_promote_observation(
  p_observation_id uuid,
  p_expected_status text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_statistic_key text;
  v_status text;
  v_active boolean;
begin
  select o.statistic_key into v_statistic_key
  from public.explorer_statistic_observations o
  where o.observation_id = p_observation_id;

  if v_statistic_key is null then
    raise exception 'Observation not found' using errcode = 'P0002';
  end if;

  -- Serialize publishing per statistic, then re-read under lock.
  select s.active into v_active
  from public.explorer_statistics s
  where s.statistic_key = v_statistic_key
  for update;

  select o.status into v_status
  from public.explorer_statistic_observations o
  where o.observation_id = p_observation_id
  for update;

  if v_status is distinct from p_expected_status then
    raise exception 'Observation must be % to perform this action (found %)',
      p_expected_status, v_status using errcode = '22023';
  end if;

  if not v_active then
    raise exception 'Statistic is inactive' using errcode = '22023';
  end if;

  update public.explorer_statistic_observations
  set status = 'superseded'
  where statistic_key = v_statistic_key and status = 'published';

  update public.explorer_statistic_observations
  set status = 'published', published_at = now(), published_by = auth.uid()
  where observation_id = p_observation_id;

  return p_observation_id;
end
$$;

create or replace function public.publish_explorer_observation(
  p_observation_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_cac_staff() then
    raise exception 'Staff authorization required' using errcode = '42501';
  end if;
  return public.explorer_promote_observation(p_observation_id, 'staged');
end
$$;

create or replace function public.restore_explorer_observation(
  p_observation_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_cac_staff() then
    raise exception 'Staff authorization required' using errcode = '42501';
  end if;
  return public.explorer_promote_observation(p_observation_id, 'superseded');
end
$$;

revoke all on function public.explorer_promote_observation(uuid, text) from public, anon, authenticated;
revoke all on function public.publish_explorer_observation(uuid) from public, anon;
revoke all on function public.restore_explorer_observation(uuid) from public, anon;
grant execute on function public.publish_explorer_observation(uuid)
  to authenticated, service_role;
grant execute on function public.restore_explorer_observation(uuid)
  to authenticated, service_role;

------------------------------------------------------------------------------
-- Routine refresh (service role only; no staff approval)
------------------------------------------------------------------------------
-- Per the November 17, 2026 decision, routine monthly refreshes publish
-- without staff approval. This is the only automatic path, and it is narrow:
--   * Every check records last_checked_at; an invalid or failed value raises
--     and rolls back, so the last published value stays and no check is claimed.
--   * A repeated check of the same statistic, period and revision is idempotent.
--   * A new value auto-publishes only when the statistic ALREADY has a
--     published value (a routine refresh) and its period is not older than the
--     published one. Otherwise it stays staged for staff: the first value for a
--     new statistic is initial setup, and an older period needs review.
-- Automatic publications have published_by NULL. Staff can restore any earlier
-- value with restore_explorer_observation.

create or replace function public.record_explorer_observation(
  p_statistic_key text,
  p_value numeric,
  p_value_high numeric,
  p_period_label text,
  p_period_start date,
  p_period_end date,
  p_revision_key text,
  p_retrieval_method text
)
returns table (result_observation_id uuid, result_status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_active boolean;
  v_id uuid;
  v_status text;
  v_revision text := coalesce(p_revision_key, '');
  v_has_published boolean;
  v_published_end date;
begin
  select s.active into v_active
  from public.explorer_statistics s
  where s.statistic_key = p_statistic_key
  for update;

  if not found then
    raise exception 'Unknown statistic' using errcode = 'P0002';
  end if;
  if not v_active then
    raise exception 'Statistic is inactive' using errcode = '22023';
  end if;

  select o.observation_id, o.status into v_id, v_status
  from public.explorer_statistic_observations o
  where o.statistic_key = p_statistic_key
    and o.period_label = p_period_label
    and o.revision_key = v_revision;

  if v_id is null then
    insert into public.explorer_statistic_observations
      (statistic_key, value, value_high, period_label, period_start, period_end,
       revision_key, retrieval_method)
    values
      (p_statistic_key, p_value, p_value_high, p_period_label, p_period_start,
       p_period_end, v_revision, p_retrieval_method)
    returning observation_id, status into v_id, v_status;

    select true, o.period_end into v_has_published, v_published_end
    from public.explorer_statistic_observations o
    where o.statistic_key = p_statistic_key and o.status = 'published';

    if coalesce(v_has_published, false)
       and (p_period_end is null or v_published_end is null
            or p_period_end >= v_published_end) then
      perform public.explorer_promote_observation(v_id, 'staged');
      v_status := 'published';
    end if;
  end if;

  update public.explorer_statistics
  set last_checked_at = now()
  where statistic_key = p_statistic_key;

  return query select v_id, v_status;
end
$$;

revoke all on function public.record_explorer_observation(
  text, numeric, numeric, text, date, date, text, text
) from public, anon, authenticated;
grant execute on function public.record_explorer_observation(
  text, numeric, numeric, text, date, date, text, text
) to service_role;

------------------------------------------------------------------------------
-- Seed: approved category names and documented sources
------------------------------------------------------------------------------
-- Names and order follow design/ui-spec.md 9A. Short descriptions are the
-- opening sentences already shown on the Explore page; CAC has not yet
-- approved final wording (see docs/explorer-statistics-catalog.md). Icon keys
-- are proposed identifiers, not approved artwork. No statistic values are
-- seeded: values require approved variables and a published observation.

insert into public.explorer_categories
  (category_key, name, short_label, description, icon_key, display_order, visualization_type)
values
  ('housing', 'Housing & Utility Security', 'Housing',
   'Rent and utility bills arrive whether or not the money does.',
   'house', 1, 'housing_windows'),
  ('food', 'Food & Nutrition', 'Food',
   'Prices move while a budget stays put.',
   'grocery-bag', 2, 'grocery_cart'),
  ('employment', 'Employment & Adult Education', 'Employment',
   'Job postings list what employers expect.',
   'briefcase', 3, 'job_board'),
  ('clothing', 'Essential Goods & Clothing', 'Clothing',
   'Clothes carry people into interviews, classrooms, and cold mornings.',
   'hanger', 4, 'garment_rail'),
  ('youth', 'Childcare & Youth Needs', 'Youth',
   'Children need the same basics all year, but each season brings different costs.',
   'school-bus', 5, 'school_bus'),
  ('finances', 'Financial Literacy & Tax Credits', 'Finances',
   'A small emergency can strain a tight budget.',
   'calculator', 6, 'budget_workbench')
on conflict (category_key) do nothing;

insert into public.explorer_sources
  (source_id, name, title, url, access_method, update_cadence)
values
  ('fred', 'Federal Reserve Bank of St. Louis', 'FRED Economic Data',
   'https://fred.stlouisfed.org/', 'api', 'Per series'),
  ('census_acs', 'U.S. Census Bureau', 'American Community Survey 5-Year Estimates',
   'https://www.census.gov/data/developers/data-sets/acs-5year.html', 'api', 'Annual release'),
  ('census_saipe', 'U.S. Census Bureau', 'Small Area Income and Poverty Estimates (SAIPE)',
   'https://www.census.gov/programs-surveys/saipe.html', 'api', 'Annual release'),
  ('eia_electricity', 'U.S. Energy Information Administration',
   'Electricity retail sales: average retail price',
   'https://www.eia.gov/opendata/documentation.php', 'api', 'Monthly'),
  ('fulton_evictions', 'Fulton County open data', 'Monthly Eviction Filings',
   'https://sharefulton.fultoncountyga.gov/dataset/Monthly-Eviction-Filings/cbu2-qs5w/about_data',
   'api', 'Monthly'),
  ('eviction_lab', 'Eviction Lab', 'Eviction Tracking System data files',
   'https://evictionlab.org/eviction-tracking/get-the-data/', 'file_import', 'To be confirmed'),
  ('finra_nfcs', 'FINRA Investor Education Foundation',
   'National Financial Capability Study data and downloads',
   'https://www.finrafoundation.org/nfcs-data-and-downloads', 'file_import', 'About every three years'),
  ('cac', 'Community Assistance Center', 'Programs, mission and ways to get help',
   'https://ourcac.org/', 'client_provided', 'To be confirmed with CAC')
on conflict (source_id) do nothing;
