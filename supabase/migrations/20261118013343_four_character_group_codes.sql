begin;

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
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code_bytes bytea;
  candidate text;
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

    for attempt in 1..32 loop
      -- The first four UUID bytes are random. Each low five-bit value
      -- selects one character from the 32-character alphabet.
      code_bytes := uuid_send(gen_random_uuid());
      candidate :=
        substr(alphabet, (get_byte(code_bytes, 0) & 31) + 1, 1) ||
        substr(alphabet, (get_byte(code_bytes, 1) & 31) + 1, 1) ||
        substr(alphabet, (get_byte(code_bytes, 2) & 31) + 1, 1) ||
        substr(alphabet, (get_byte(code_bytes, 3) & 31) + 1, 1);

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
        candidate,
        u,
        null,
        null,
        null,
        'open',
        now(),
        v,
        p_decision_duration_seconds
      ) on conflict (join_code) do nothing returning * into s;
      exit when found;
    end loop;

    if s.session_id is null then
      return jsonb_build_object(
        'error', 'Could not create a session code. Please try again.'
      );
    end if;
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

commit;
