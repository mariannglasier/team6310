begin;

-- Session state uses the requested two-state lifecycle. The active question is
-- the existing scenario reference, pinned to the session's content edition.
drop index if exists public.group_one_waiting_host;

do $$
begin
  if exists (
    select 1 from public.group_sessions
    where status is null or status not in ('waiting', 'open', 'closed')
  ) then
    raise exception 'Unexpected group session status blocks migration';
  end if;
end
$$;

update public.group_sessions set status = 'open' where status = 'waiting';

alter table public.group_sessions
  alter column status set default 'open',
  alter column status set not null,
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column version_id set not null,
  add constraint group_sessions_status_allowed
    check (status in ('open', 'closed'));

create unique index group_one_open_host
  on public.group_sessions(host_user_id)
  where status = 'open';

-- participant_id is the application-facing, session-scoped anonymous ID. The
-- Auth user ID remains the private ownership credential and is never returned as
-- the participant identifier.
alter table public.group_participants
  add column participant_id uuid not null default gen_random_uuid(),
  add constraint group_participants_participant_id_unique unique(participant_id),
  add constraint group_participants_session_participant_unique
    unique(session_id, participant_id);

alter table public.playthroughs add column participant_id uuid;

update public.playthroughs p
set participant_id = m.participant_id
from public.group_participants m
where p.session_id = m.session_id
  and p.owner_user_id = m.user_id
  and p.session_id is not null;

do $$
begin
  if exists (
    select 1 from public.playthroughs
    where session_id is not null and participant_id is null
  ) then
    raise exception 'A group playthrough has no matching participant membership';
  end if;
end
$$;

alter table public.playthroughs
  add constraint playthroughs_group_participant_pair
    check (
      (session_id is null and participant_id is null)
      or (session_id is not null and participant_id is not null)
    ),
  add constraint playthroughs_group_participant_fkey
    foreign key(session_id, participant_id)
    references public.group_participants(session_id, participant_id)
    on update restrict on delete restrict;

create index playthroughs_group_participant_idx
  on public.playthroughs(session_id, participant_id)
  where session_id is not null;

drop policy if exists host_create_group on public.group_sessions;
create policy host_create_group
on public.group_sessions
for insert
to authenticated
with check (
  host_user_id = (select auth.uid())
  and (select (auth.jwt()->>'is_anonymous')::boolean) is true
  and status = 'open'
  and current_scenario_id is null
  and round_deadline is null
  and facilitator_user_id is null
  and exists (
    select 1 from public.content_versions v
    where v.version_id = group_sessions.version_id
      and v.status = 'published'
      and v.published_at is not null
  )
);

drop policy if exists member_join_self on public.group_participants;
revoke insert, update, delete on public.group_sessions from anon, authenticated;
revoke insert, update, delete on public.group_participants from anon, authenticated;

create or replace function group_private.configure_host_session(
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
  where host_user_id = u and status = 'open';

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
          'open',
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
    'currentScenarioId', s.current_scenario_id,
    'createdAt', s.created_at,
    'versionId', s.version_id,
    'decisionDurationSeconds', s.decision_duration_seconds,
    'participantCount', participant_count,
    'participantId', null,
    'isHost', true
  );
end
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
  member_id uuid;
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
  where join_code = upper(btrim(p_code)) and status = 'open'
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
  on conflict(session_id, user_id) do nothing;

  select participant_id into member_id
  from public.group_participants
  where session_id = s.session_id and user_id = u;

  return jsonb_build_object(
    'sessionId', s.session_id,
    'joinCode', s.join_code,
    'status', s.status,
    'currentScenarioId', s.current_scenario_id,
    'createdAt', s.created_at,
    'versionId', s.version_id,
    'decisionDurationSeconds', s.decision_duration_seconds,
    'participantCount', (
      select count(*)::integer
      from public.group_participants
      where session_id = s.session_id
    ),
    'participantId', member_id,
    'isHost', false
  );
end
$$;

create function group_private.read_session_state(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.group_sessions;
  u uuid := auth.uid();
  member_id uuid;
  caller_is_host boolean;
begin
  if u is null
     or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false then
    raise exception 'Anonymous session required' using errcode = '42501';
  end if;

  select * into s
  from public.group_sessions
  where session_id = p_session_id;

  if s.session_id is null then
    return jsonb_build_object('error', 'Session unavailable.');
  end if;

  caller_is_host := s.host_user_id = u;
  select participant_id into member_id
  from public.group_participants
  where session_id = s.session_id and user_id = u;

  if not caller_is_host and member_id is null then
    raise exception 'Session access denied' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'sessionId', s.session_id,
    'joinCode', s.join_code,
    'status', s.status,
    'currentScenarioId', s.current_scenario_id,
    'createdAt', s.created_at,
    'versionId', s.version_id,
    'decisionDurationSeconds', s.decision_duration_seconds,
    'participantCount', (
      select count(*)::integer
      from public.group_participants
      where session_id = s.session_id
    ),
    'participantId', member_id,
    'isHost', caller_is_host
  );
end
$$;

create function public.get_group_session_state(p_session_id uuid)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select group_private.read_session_state(p_session_id)
$$;

create function group_private.update_session_state(
  p_session_id uuid,
  p_status text,
  p_current_scenario_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.group_sessions;
  u uuid := auth.uid();
begin
  if u is null
     or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false then
    raise exception 'Anonymous session required' using errcode = '42501';
  end if;

  if p_status not in ('open', 'closed') then
    return jsonb_build_object('error', 'Session status must be open or closed.');
  end if;

  select * into s
  from public.group_sessions
  where session_id = p_session_id
  for update;

  if s.session_id is null or s.host_user_id is distinct from u then
    raise exception 'Session update denied' using errcode = '42501';
  end if;

  if s.status = 'closed' then
    if p_status = 'closed'
       and p_current_scenario_id is not distinct from s.current_scenario_id then
      return group_private.read_session_state(s.session_id);
    end if;
    return jsonb_build_object('error', 'This session is closed.');
  end if;

  if p_current_scenario_id is not null and not exists (
    select 1 from public.scenarios q
    where q.scenario_id = p_current_scenario_id
      and q.version_id = s.version_id
  ) then
    return jsonb_build_object(
      'error',
      'The active question does not belong to this session content version.'
    );
  end if;

  update public.group_sessions
  set status = p_status,
      current_scenario_id = p_current_scenario_id
  where session_id = s.session_id;

  return group_private.read_session_state(s.session_id);
end
$$;

create function public.update_group_session_state(
  p_session_id uuid,
  p_status text,
  p_current_scenario_id uuid
) returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select group_private.update_session_state(
    p_session_id,
    p_status,
    p_current_scenario_id
  )
$$;

revoke all on function
  group_private.read_session_state(uuid),
  group_private.update_session_state(uuid, text, uuid),
  public.get_group_session_state(uuid),
  public.update_group_session_state(uuid, text, uuid)
from public, anon, authenticated, service_role;

grant execute on function
  group_private.read_session_state(uuid),
  group_private.update_session_state(uuid, text, uuid),
  public.get_group_session_state(uuid),
  public.update_group_session_state(uuid, text, uuid)
to authenticated;

commit;
