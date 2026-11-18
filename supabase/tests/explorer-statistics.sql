-- Verifies the Explore Data statistics boundary
-- (migrations 20261117150000_explorer_statistics.sql and
-- 20261118120000_explorer_automatic_publication.sql).
--
-- Run against a DISPOSABLE LOCAL database only, with the migrations
-- 20261109000000_cac_staff_authorization.sql,
-- 20261117150000_explorer_statistics.sql and
-- 20261118120000_explorer_automatic_publication.sql already applied, for example:
--   docker exec -i <local-db-container> psql -U postgres -v ON_ERROR_STOP=1 \
--     < supabase/tests/explorer-statistics.sql
-- The whole script runs in one transaction and rolls back, so it leaves no
-- data behind. A failure raises an exception that begins with FAIL.

begin;

-- Fixtures (as the migration owner) -----------------------------------------
insert into auth.users (id, aud, role, email, is_anonymous)
values
  ('00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', 'explorer-staff@example.test', false),
  ('00000000-0000-0000-0000-0000000000a2', 'authenticated', 'authenticated', 'explorer-nonstaff@example.test', false),
  ('00000000-0000-0000-0000-0000000000a3', 'authenticated', 'authenticated', null, true);

insert into public.cac_staff (user_id) values ('00000000-0000-0000-0000-0000000000a1');

insert into public.explorer_statistics
  (statistic_key, category_key, source_id, title, description, unit, geography,
   visualization_type, visualization_config, source_reference)
values
  ('test_share', 'food', 'fred', 'Test share', 'What the test share measures.',
   'percent', 'Test area', 'pictogram',
   '{"icon":"grocery_item","total":10}', '{"series_id":"TEST"}'),
  ('test_count', 'food', 'fred', 'Test count', 'What the test count measures.',
   'count', 'Test area', 'figure', '{}', '{}'),
  ('test_change', 'food', 'fred', 'Test change', 'Signed change.',
   'percent_change', 'Test area', 'figure', '{}', '{}');

insert into public.explorer_statistic_observations
  (observation_id, statistic_key, value, period_label, revision_key, retrieval_method)
values
  ('10000000-0000-0000-0000-000000000001', 'test_share', 50, '2024', 'r1', 'manual'),
  ('10000000-0000-0000-0000-000000000002', 'test_share', 20, '2025', 'r1', 'manual');

-- Helpers --------------------------------------------------------------------
create or replace function pg_temp.act_as(p_role text, p_sub uuid, p_anonymous boolean)
returns void language plpgsql as $$
begin
  perform set_config('role', p_role, true);
  perform set_config(
    'request.jwt.claims',
    case when p_sub is null then '{}'
         else json_build_object('sub', p_sub, 'role', p_role, 'is_anonymous', p_anonymous)::text end,
    true
  );
  perform set_config('request.jwt.claim.sub', coalesce(p_sub::text, ''), true);
end $$;
grant execute on function pg_temp.act_as(text, uuid, boolean) to public;

-- 1. Categories: public read of the six approved categories -------------------
select pg_temp.act_as('anon', null, false);
do $$
declare n integer;
begin
  select count(*) into n from public.get_explorer_categories();
  if n <> 6 then raise exception 'FAIL: anon should see 6 categories, saw %', n; end if;
end $$;

-- 2. Direct table access is denied for anon -----------------------------------
do $$
begin
  begin
    perform 1 from public.explorer_statistics limit 1;
    raise exception 'FAIL: anon read explorer_statistics directly';
  exception when insufficient_privilege then null; end;
  begin
    perform 1 from public.explorer_statistic_observations limit 1;
    raise exception 'FAIL: anon read observations directly';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.explorer_categories
      (category_key, name, short_label, description, icon_key, display_order, visualization_type)
    values ('hack', 'x', 'x', 'x', 'x', 99, 'job_board');
    raise exception 'FAIL: anon inserted a category';
  exception when insufficient_privilege then null; end;
end $$;

-- 3. Staged observations are never public --------------------------------------
do $$
declare n integer;
begin
  select count(*) into n from public.get_explorer_category_statistics('food')
  where statistic_key like 'test\_%';
  if n <> 0 then raise exception 'FAIL: staged data was public (% rows)', n; end if;
  select count(*) into n from public.get_explorer_category_statistics('no_such_category');
  if n <> 0 then raise exception 'FAIL: unknown category should return no rows'; end if;
end $$;

-- 4. Anonymous player session and non-staff users: no direct rows, no publish --
reset role;
select pg_temp.act_as('authenticated', '00000000-0000-0000-0000-0000000000a3', true);
do $$
declare n integer;
begin
  select count(*) into n from public.explorer_statistic_observations;
  if n <> 0 then raise exception 'FAIL: anonymous session saw % staged observations', n; end if;
  begin
    perform public.publish_explorer_observation('10000000-0000-0000-0000-000000000001');
    raise exception 'FAIL: anonymous session published';
  exception when insufficient_privilege then null; end;
  select count(*) into n from public.get_explorer_categories();
  if n <> 6 then raise exception 'FAIL: anonymous session should read categories'; end if;
end $$;

reset role;
select pg_temp.act_as('authenticated', '00000000-0000-0000-0000-0000000000a2', false);
do $$
declare n integer;
begin
  select count(*) into n from public.explorer_statistics;
  if n <> 0 then raise exception 'FAIL: non-staff user saw % statistics', n; end if;
  begin
    perform public.publish_explorer_observation('10000000-0000-0000-0000-000000000001');
    raise exception 'FAIL: non-staff user published';
  exception when insufficient_privilege then null; end;
  begin
    perform public.restore_explorer_observation('10000000-0000-0000-0000-000000000001');
    raise exception 'FAIL: non-staff user restored';
  exception when insufficient_privilege then null; end;
end $$;

-- 5. Staff: read drafts, no direct writes, publish and restore ----------------
reset role;
select pg_temp.act_as('authenticated', '00000000-0000-0000-0000-0000000000a1', false);
do $$
declare n integer;
begin
  select count(*) into n from public.explorer_statistic_observations
  where statistic_key = 'test_share';
  if n <> 2 then raise exception 'FAIL: staff should see staged observations, saw %', n; end if;

  begin
    update public.explorer_statistics set title = 'changed' where statistic_key = 'test_share';
    raise exception 'FAIL: staff wrote directly to statistics';
  exception when insufficient_privilege then null; end;

  begin
    perform public.publish_explorer_observation('99999999-9999-9999-9999-999999999999');
    raise exception 'FAIL: unknown observation published';
  exception when no_data_found then null; end;

  perform public.publish_explorer_observation('10000000-0000-0000-0000-000000000001');

  begin
    perform public.publish_explorer_observation('10000000-0000-0000-0000-000000000001');
    raise exception 'FAIL: published observation published twice';
  exception when invalid_parameter_value then null; end;
end $$;

-- 6. Visitors see only the published value, with provenance and no internals --
reset role;
select pg_temp.act_as('anon', null, false);
do $$
declare r record;
begin
  select * into r from public.get_explorer_category_statistics('food')
  where statistic_key = 'test_share';
  if r.statistic_key is distinct from 'test_share' or r.value <> 50 or r.unit <> 'percent'
     or r.period_label <> '2024' or r.source_url is null or r.geography <> 'Test area'
     or r.last_checked_at is null or r.visualization_type <> 'pictogram'
     or (r.visualization_config ->> 'total') <> '10' then
    raise exception 'FAIL: published row incomplete or wrong: %', row_to_json(r);
  end if;
  if row_to_json(r)::jsonb ? 'source_reference' or row_to_json(r)::jsonb ? 'status' then
    raise exception 'FAIL: internal columns exposed';
  end if;
  if (select statistic_count from public.get_explorer_categories() where category_key = 'food') < 1 then
    raise exception 'FAIL: the published fixture was not counted';
  end if;
end $$;

-- 7. Publishing a newer observation supersedes; restore brings the old back ----
reset role;
select pg_temp.act_as('authenticated', '00000000-0000-0000-0000-0000000000a1', false);
do $$
declare v numeric; n integer;
begin
  perform public.publish_explorer_observation('10000000-0000-0000-0000-000000000002');
  select count(*) into n from public.explorer_statistic_observations
  where statistic_key = 'test_share' and status = 'published';
  if n <> 1 then raise exception 'FAIL: expected exactly one published, found %', n; end if;
  select g.value into v from public.get_explorer_category_statistics('food') g
  where g.statistic_key = 'test_share';
  if v <> 20 then raise exception 'FAIL: newer value not public (%)', v; end if;

  begin
    perform public.restore_explorer_observation('10000000-0000-0000-0000-000000000002');
    raise exception 'FAIL: restored a published observation';
  exception when invalid_parameter_value then null; end;

  perform public.restore_explorer_observation('10000000-0000-0000-0000-000000000001');
  select g.value into v from public.get_explorer_category_statistics('food') g
  where g.statistic_key = 'test_share';
  if v <> 50 then raise exception 'FAIL: restore did not republish prior value (%)', v; end if;
  select count(*) into n from public.explorer_statistic_observations
  where statistic_key = 'test_share' and status = 'published';
  if n <> 1 then raise exception 'FAIL: restore left % published rows', n; end if;
end $$;

-- 8. Immutability and deletion are blocked, even for the owner -----------------
reset role;
do $$
begin
  -- statistic_count must equal the published rows (staged fixtures are not counted).
  if exists (
    select 1 from public.get_explorer_categories() c
    where c.statistic_count <> (
      select count(*) from public.explorer_statistics s
      join public.explorer_statistic_observations o
        on o.statistic_key = s.statistic_key and o.status = 'published'
      where s.category_key = c.category_key and s.active
    )
  ) then raise exception 'FAIL: statistic_count disagrees with published rows'; end if;
end $$;
do $$
begin
  begin
    update public.explorer_statistic_observations set value = 99
    where observation_id = '10000000-0000-0000-0000-000000000001';
    raise exception 'FAIL: observation value was edited';
  exception when integrity_constraint_violation then null; end;
  begin
    delete from public.explorer_statistic_observations
    where observation_id = '10000000-0000-0000-0000-000000000002';
    raise exception 'FAIL: observation was deleted';
  exception when integrity_constraint_violation then null; end;
  begin
    update public.explorer_statistic_observations set status = 'staged'
    where observation_id = '10000000-0000-0000-0000-000000000001';
    raise exception 'FAIL: published observation moved back to staged';
  exception when integrity_constraint_violation then null; end;
end $$;

-- 9. Value validation: 0%, 50%, 100% accepted; invalid values rejected ---------
do $$
begin
  insert into public.explorer_statistic_observations
    (statistic_key, value, period_label, revision_key, retrieval_method)
  values
    ('test_share', 0, 'p0', '', 'manual'),
    ('test_share', 50, 'p50', '', 'manual'),
    ('test_share', 100, 'p100', '', 'manual'),
    ('test_change', -3.5, 'neg', '', 'manual'),
    ('test_change', 250, 'big', '', 'manual');

  begin
    insert into public.explorer_statistic_observations
      (statistic_key, value, period_label, retrieval_method)
    values ('test_share', 100.01, 'over', 'manual');
    raise exception 'FAIL: percent over 100 accepted';
  exception when check_violation then null; end;
  begin
    insert into public.explorer_statistic_observations
      (statistic_key, value, period_label, retrieval_method)
    values ('test_share', -0.1, 'under', 'manual');
    raise exception 'FAIL: negative percent accepted';
  exception when check_violation then null; end;
  begin
    insert into public.explorer_statistic_observations
      (statistic_key, value, period_label, retrieval_method)
    values ('test_count', -1, 'neg', 'manual');
    raise exception 'FAIL: negative count accepted';
  exception when check_violation then null; end;
  begin
    insert into public.explorer_statistic_observations
      (statistic_key, value, value_high, period_label, retrieval_method)
    values ('test_count', 10, 5, 'range', 'manual');
    raise exception 'FAIL: inverted range accepted';
  exception when check_violation then null; end;
  begin
    insert into public.explorer_statistic_observations
      (statistic_key, value, period_label, revision_key, retrieval_method)
    values ('test_share', 1, '2024', 'r1', 'manual');
    raise exception 'FAIL: duplicate observation identity accepted';
  exception when unique_violation then null; end;
end $$;

-- 10. Definition rules ----------------------------------------------------------
do $$
begin
  begin
    insert into public.explorer_statistics
      (statistic_key, category_key, source_id, title, description, unit, geography,
       visualization_type, visualization_config)
    values ('bad_pictogram', 'food', 'fred', 't', 'd', 'percent', 'g', 'pictogram', '{}');
    raise exception 'FAIL: pictogram without icon/total accepted';
  exception when check_violation then null; end;
  begin
    insert into public.explorer_statistics
      (statistic_key, category_key, source_id, title, description, unit, geography,
       visualization_type, visualization_config)
    values ('bad_total', 'food', 'fred', 't', 'd', 'percent', 'g', 'pictogram',
            '{"icon":"x","total":101}');
    raise exception 'FAIL: pictogram total over 100 accepted';
  exception when check_violation then null; end;
  begin
    insert into public.explorer_statistics
      (statistic_key, category_key, source_id, title, description, unit, geography, visualization_type)
    values ('bad_meter', 'food', 'fred', 't', 'd', 'usd', 'g', 'meter');
    raise exception 'FAIL: meter with non-percent unit accepted';
  exception when check_violation then null; end;
  begin
    insert into public.explorer_statistics
      (statistic_key, category_key, source_id, title, description, unit, geography,
       visualization_type, is_derived)
    values ('bad_derived', 'food', 'fred', 't', 'd', 'count', 'g', 'figure', true);
    raise exception 'FAIL: derived statistic without a note accepted';
  exception when check_violation then null; end;
  begin
    insert into public.explorer_statistics
      (statistic_key, category_key, source_id, title, description, unit, geography, visualization_type)
    values ('bad_category', 'no_such_category', 'fred', 't', 'd', 'count', 'g', 'figure');
    raise exception 'FAIL: invalid category reference accepted';
  exception when foreign_key_violation then null; end;
  begin
    insert into public.explorer_sources (source_id, name, title, url, access_method)
    values ('bad_url', 'n', 't', 'javascript:alert(1)', 'manual');
    raise exception 'FAIL: unsafe source URL accepted';
  exception when check_violation then null; end;
end $$;

-- 10b. Routine refresh: service role only, publishes with no staff approval -----
insert into public.explorer_statistics
  (statistic_key, category_key, source_id, title, description, unit, geography,
   visualization_type)
values ('test_refresh', 'housing', 'fred', 'Refresh', 'Refresh measure.',
        'percent', 'Test area', 'meter');

reset role;
select pg_temp.act_as('service_role', null, false);
do $$
declare r record; v_first uuid; n integer; v numeric;
begin
  -- The FIRST value of a statistic publishes by itself: no staff step.
  select * into r from public.record_explorer_observation(
    'test_refresh', 10, null, '2024-01', '2024-01-01', '2024-01-31', 'v1', 'api');
  if r.result_status <> 'published' then
    raise exception 'FAIL: first value must publish automatically, got %', r.result_status;
  end if;
  v_first := r.result_observation_id;
  if not exists (
    select 1 from public.explorer_statistic_observations
    where observation_id = v_first and published_by is null and published_at is not null
  ) then raise exception 'FAIL: automatic publication should have no staff actor'; end if;

  -- Repeating the same check (the source has nothing new) keeps the value.
  select * into r from public.record_explorer_observation(
    'test_refresh', 10, null, '2024-01', '2024-01-01', '2024-01-31', 'v1', 'api');
  select count(*) into n from public.explorer_statistic_observations
  where statistic_key = 'test_refresh';
  if r.result_observation_id <> v_first or n <> 1 or r.result_status <> 'published' then
    raise exception 'FAIL: repeated check was not idempotent (% rows, %)', n, r.result_status;
  end if;

  -- An invalid value rolls back: no row, last published value unaffected.
  begin
    perform public.record_explorer_observation(
      'test_refresh', 101, null, '2024-02', '2024-02-01', '2024-02-29', 'v1', 'api');
    raise exception 'FAIL: invalid percent was recorded';
  exception when check_violation then null; end;
  select count(*) into n from public.explorer_statistic_observations
  where statistic_key = 'test_refresh';
  if n <> 1 then raise exception 'FAIL: failed check left % rows', n; end if;
  select o.value into v from public.explorer_statistic_observations o
  where o.statistic_key = 'test_refresh' and o.status = 'published';
  if v <> 10 then raise exception 'FAIL: a failed check changed the published value'; end if;

  begin
    perform public.record_explorer_observation(
      'no_such_statistic', 1, null, 'p', null, null, '', 'api');
    raise exception 'FAIL: unknown statistic was recorded';
  exception when no_data_found then null; end;

  if not exists (
    select 1 from public.explorer_statistics
    where statistic_key = 'test_refresh' and last_checked_at is not null
  ) then raise exception 'FAIL: last_checked_at was not recorded'; end if;

  -- A newer period replaces the published value; the old one is superseded.
  select * into r from public.record_explorer_observation(
    'test_refresh', 20, null, '2024-02', '2024-02-01', '2024-02-29', 'v1', 'api');
  if r.result_status <> 'published' then
    raise exception 'FAIL: newer value did not publish (%)', r.result_status;
  end if;
  select count(*) into n from public.explorer_statistic_observations
  where statistic_key = 'test_refresh' and status = 'published';
  if n <> 1 then raise exception 'FAIL: expected one published after refresh, got %', n; end if;
  if not exists (
    select 1 from public.explorer_statistic_observations
    where statistic_key = 'test_refresh' and period_label = '2024-01'
      and status = 'superseded'
  ) then raise exception 'FAIL: previous value was not superseded'; end if;

  -- A revised value for the same period replaces it too.
  select * into r from public.record_explorer_observation(
    'test_refresh', 21, null, '2024-02', '2024-02-01', '2024-02-29', 'v2', 'api');
  select o.value into v from public.explorer_statistic_observations o
  where o.statistic_key = 'test_refresh' and o.status = 'published';
  if r.result_status <> 'published' or v <> 21 then
    raise exception 'FAIL: revised value did not publish (%, %)', r.result_status, v;
  end if;

  -- An older period never displaces the page value; it is kept staged.
  select * into r from public.record_explorer_observation(
    'test_refresh', 5, null, '2023-12', '2023-12-01', '2023-12-31', 'v1', 'api');
  if r.result_status <> 'staged' then
    raise exception 'FAIL: older period must stay staged, got %', r.result_status;
  end if;
  select o.value into v from public.explorer_statistic_observations o
  where o.statistic_key = 'test_refresh' and o.status = 'published';
  if v <> 21 then raise exception 'FAIL: older period displaced the published value'; end if;
  -- Checking again does not promote it either.
  select * into r from public.record_explorer_observation(
    'test_refresh', 5, null, '2023-12', '2023-12-01', '2023-12-31', 'v1', 'api');
  if r.result_status <> 'staged' then
    raise exception 'FAIL: repeated older period was promoted (%)', r.result_status;
  end if;
end $$;

-- A value staged under the earlier rule is published by the next repeated check.
reset role;
insert into public.explorer_statistics
  (statistic_key, category_key, source_id, title, description, unit, geography,
   visualization_type)
values ('test_legacy_staged', 'housing', 'fred', 'Legacy', 'Legacy measure.',
        'percent', 'Test area', 'meter');
insert into public.explorer_statistic_observations
  (statistic_key, value, period_label, period_start, period_end, revision_key, retrieval_method)
values ('test_legacy_staged', 7, '2024-01', '2024-01-01', '2024-01-31', 'v1', 'api');
select pg_temp.act_as('service_role', null, false);
do $$
declare r record;
begin
  select * into r from public.record_explorer_observation(
    'test_legacy_staged', 7, null, '2024-01', '2024-01-01', '2024-01-31', 'v1', 'api');
  if r.result_status <> 'published' then
    raise exception 'FAIL: a qualifying staged value was not published (%)', r.result_status;
  end if;
  if (select count(*) from public.explorer_statistic_observations
      where statistic_key = 'test_legacy_staged') <> 1 then
    raise exception 'FAIL: promoting a staged value created a duplicate row';
  end if;
end $$;

-- Only the service role may record observations.
reset role;
select pg_temp.act_as('anon', null, false);
do $$
begin
  begin
    perform public.record_explorer_observation('test_refresh', 1, null, 'x', null, null, '', 'api');
    raise exception 'FAIL: anon recorded an observation';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select pg_temp.act_as('authenticated', '00000000-0000-0000-0000-0000000000a1', false);
do $$
begin
  begin
    perform public.record_explorer_observation('test_refresh', 1, null, 'x', null, null, '', 'api');
    raise exception 'FAIL: staff session recorded an observation directly';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- 11. Unpublished categories and inactive statistics are hidden ----------------
do $$
declare n integer;
begin
  update public.explorer_statistics set active = false where statistic_key = 'test_share';
  select count(*) into n from public.get_explorer_category_statistics('food')
  where statistic_key = 'test_share';
  if n <> 0 then raise exception 'FAIL: inactive statistic was public'; end if;
  update public.explorer_statistics set active = true where statistic_key = 'test_share';

  update public.explorer_categories set published = false where category_key = 'food';
  select count(*) into n from public.get_explorer_category_statistics('food');
  if n <> 0 then raise exception 'FAIL: unpublished category statistics were public'; end if;
  if exists (select 1 from public.get_explorer_categories() where category_key = 'food') then
    raise exception 'FAIL: unpublished category was listed';
  end if;
end $$;

select 'explorer-statistics: all checks passed' as result;

rollback;
