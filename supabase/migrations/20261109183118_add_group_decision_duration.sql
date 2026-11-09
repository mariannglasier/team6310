begin;

alter table public.group_sessions
  add column decision_duration_seconds integer not null default 60,
  add constraint group_sessions_decision_duration_allowed
    check (decision_duration_seconds in (30, 60, 90, 120));

drop function public.host_group_session(boolean);
drop function group_private.host_session(boolean);

create function group_private.configure_host_session(
  p_create boolean,
  p_decision_duration_seconds integer
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.group_sessions;
  v uuid;
  u uuid := auth.uid();
  participant_count integer;
begin
  if u is null
     or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false then
    raise exception 'Anonymous session required' using errcode = '42501';
  end if;

  if p_decision_duration_seconds not in (30, 60, 90, 120) then
    return jsonb_build_object(
      'error',
      'Choose a decision duration of 30, 60, 90, or 120 seconds.'
    );
  end if;

  perform pg_advisory_xact_lock(hashtextextended(u::text, 931));

  select * into s
  from public.group_sessions
  where host_user_id = u and status = 'waiting';

  if s.session_id is null and p_create then
    select version_id into v
    from public.content_versions
    where status = 'published' and published_at is not null
    order by published_at desc, version_id
    limit 1;

    if v is null then
      return jsonb_build_object(
        'error',
        'No published simulation is available. Please contact the facilitator.'
      );
    end if;

    loop
      begin
        insert into public.group_sessions(
          join_code,
          host_user_id,
          facilitator_user_id,
          current_scenario_id,
          round_deadline,
          status,
          created_at,
          version_id,
          decision_duration_seconds
        ) values (
          upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
          u,
          null,
          null,
          null,
          'waiting',
          now(),
          v,
          p_decision_duration_seconds
        ) returning * into s;
        exit;
      exception when unique_violation then
        null;
      end;
    end loop;
  end if;

  if s.session_id is null then
    return null;
  end if;

  select count(*)::integer into participant_count
  from public.group_participants
  where session_id = s.session_id;

  return jsonb_build_object(
    'sessionId', s.session_id,
    'joinCode', s.join_code,
    'status', s.status,
    'createdAt', s.created_at,
    'versionId', s.version_id,
    'decisionDurationSeconds', s.decision_duration_seconds,
    'participantCount', participant_count
  );
end
$$;

create function public.configure_host_group_session(
  p_create boolean,
  p_decision_duration_seconds integer
) returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select group_private.configure_host_session(
    p_create,
    p_decision_duration_seconds
  )
$$;

create or replace function group_private.join_session(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.group_sessions;
  u uuid := auth.uid();
  n integer;
begin
  if u is null
     or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false then
    raise exception 'Anonymous session required' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(u::text, 932));

  insert into group_private.join_attempts values (u, now(), 1)
  on conflict(user_id) do update set
    attempts = case
      when group_private.join_attempts.window_start < now() - interval '1 minute'
        then 1
      else group_private.join_attempts.attempts + 1
    end,
    window_start = case
      when group_private.join_attempts.window_start < now() - interval '1 minute'
        then now()
      else group_private.join_attempts.window_start
    end
  returning attempts into n;

  if n > 10 then
    return jsonb_build_object(
      'error',
      'Too many attempts. Wait one minute and try again.'
    );
  end if;

  select * into s
  from public.group_sessions
  where join_code = upper(btrim(p_code)) and status = 'waiting'
  for update;

  if s.session_id is null then
    return jsonb_build_object(
      'error',
      'Session unavailable. Check the code with your facilitator and try again.'
    );
  end if;

  if s.host_user_id = u then
    return jsonb_build_object(
      'error',
      'You are hosting this session. Players should join from their own browser.'
    );
  end if;

  insert into public.group_participants(session_id, user_id)
  values (s.session_id, u)
  on conflict do nothing;

  return jsonb_build_object(
    'sessionId', s.session_id,
    'joinCode', s.join_code,
    'status', s.status,
    'createdAt', s.created_at,
    'versionId', s.version_id,
    'decisionDurationSeconds', s.decision_duration_seconds,
    'participantCount', (
      select count(*)::integer
      from public.group_participants
      where session_id = s.session_id
    )
  );
end
$$;

revoke all on function
  group_private.configure_host_session(boolean, integer),
  public.configure_host_group_session(boolean, integer)
from public, anon, authenticated, service_role;

grant execute on function
  group_private.configure_host_session(boolean, integer),
  public.configure_host_group_session(boolean, integer)
to authenticated;

commit;
