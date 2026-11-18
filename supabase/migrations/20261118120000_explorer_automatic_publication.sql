-- Explore Data: every API value publishes automatically.
--
-- Decision (user, November 18, 2026): explorer statistics need no staff
-- approval. The monthly refresh records what the source API returns and, when
-- the source has a newer value, that value replaces the one on the page; when
-- the source has nothing new, the published value is left as it is.
--
-- This replaces the earlier narrow rule (November 17, 2026) under which the
-- FIRST value of a statistic stayed staged for staff. Rules now:
--   * Every check records last_checked_at. An invalid or failed value raises
--     and rolls back, so the last published value stays and no check is claimed.
--   * A repeated check of the same statistic, period and revision is
--     idempotent: nothing changes and the published value is kept.
--   * A new value publishes when the statistic has no published value yet, or
--     when its period is not older than the published one. A period older than
--     the published one is recorded as staged and never displaces the page
--     value; it stays available for staff review and restore.
--   * A staged observation that qualifies (for example one recorded under the
--     earlier rule) is published the next time the same check is repeated.
-- Automatic publications have published_by NULL. Staff can still restore any
-- earlier value with restore_explorer_observation. The function remains
-- executable by the service role only.
--
-- Depends on 20261117150000_explorer_statistics.sql.

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
  v_end date;
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

  select o.observation_id, o.status, o.period_end into v_id, v_status, v_end
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
    returning observation_id, status, period_end into v_id, v_status, v_end;
  end if;

  if v_status = 'staged' then
    select true, o.period_end into v_has_published, v_published_end
    from public.explorer_statistic_observations o
    where o.statistic_key = p_statistic_key and o.status = 'published';

    if not coalesce(v_has_published, false)
       or v_end is null or v_published_end is null
       or v_end >= v_published_end then
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
