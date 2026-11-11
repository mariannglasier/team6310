begin;

alter table public.group_sessions
  add column round_state text not null default 'lobby',
  add column current_question_number integer not null default 0,
  add constraint group_sessions_round_state_allowed
    check (round_state in ('lobby', 'voting', 'results', 'completed')),
  add constraint group_sessions_question_number_nonnegative
    check (current_question_number >= 0);

create table public.group_session_questions (
  session_id uuid not null references public.group_sessions(session_id) on delete cascade,
  position integer not null check (position > 0),
  scenario_id uuid not null references public.scenarios(scenario_id) on delete restrict,
  primary key (session_id, position),
  unique (session_id, scenario_id)
);

create table public.group_votes (
  session_id uuid not null,
  scenario_id uuid not null,
  participant_id uuid not null,
  choice_id uuid not null references public.choices(choice_id) on delete restrict,
  updated_at timestamptz not null default now(),
  primary key (session_id, scenario_id, participant_id),
  foreign key (session_id, scenario_id)
    references public.group_session_questions(session_id, scenario_id)
    on delete cascade,
  foreign key (session_id, participant_id)
    references public.group_participants(session_id, participant_id)
    on delete cascade
);

create index group_votes_round_choice_idx
  on public.group_votes(session_id, scenario_id, choice_id);

alter table public.group_session_questions enable row level security;
alter table public.group_votes enable row level security;
revoke all on public.group_session_questions, public.group_votes
  from public, anon, authenticated;

create function group_private.enforce_lobby_join()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if not exists (select 1 from public.group_sessions
    where session_id = new.session_id and status = 'open' and round_state = 'lobby') then
    raise exception 'Session enrollment is closed' using errcode = '23514';
  end if;
  return new;
end
$$;
create trigger group_participants_lobby_join
before insert on public.group_participants
for each row execute function group_private.enforce_lobby_join();

create or replace function group_private.read_session_state(p_session_id uuid)
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
  question jsonb;
  total_questions integer;
  votes_cast integer;
begin
  if u is null
     or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false then
    raise exception 'Anonymous session required' using errcode = '42501';
  end if;

  select * into s from public.group_sessions where session_id = p_session_id;
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

  select count(*)::integer into total_questions
  from public.group_session_questions where session_id = s.session_id;
  select count(*)::integer into votes_cast
  from public.group_votes
  where session_id = s.session_id and scenario_id = s.current_scenario_id;

  if s.current_scenario_id is not null then
    select jsonb_build_object(
      'scenarioId', q.scenario_id,
      'title', q.title,
      'description', coalesce(q.description, ''),
      'choices', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'choiceId', c.choice_id,
          'text', c.choice_text,
          'voteCount', case when s.round_state in ('results', 'completed')
            then (select count(*) from public.group_votes gv
                  where gv.session_id = s.session_id
                    and gv.scenario_id = q.scenario_id
                    and gv.choice_id = c.choice_id)
            else null end
        ) order by c.choice_id), '[]'::jsonb)
        from public.choices c
        where c.scenario_id = q.scenario_id and c.version_id = s.version_id
      )
    ) into question
    from public.scenarios q where q.scenario_id = s.current_scenario_id;
  end if;

  return jsonb_build_object(
    'sessionId', s.session_id,
    'joinCode', s.join_code,
    'status', s.status,
    'roundState', s.round_state,
    'currentScenarioId', s.current_scenario_id,
    'currentQuestionNumber', s.current_question_number,
    'totalQuestionCount', total_questions,
    'roundDeadline', s.round_deadline,
    'acceptingVotes', s.status = 'open' and s.round_state = 'voting'
      and s.round_deadline > now(),
    'question', question,
    'selectedChoiceId', (
      select choice_id from public.group_votes
      where session_id = s.session_id and scenario_id = s.current_scenario_id
        and participant_id = member_id
    ),
    'voteCount', votes_cast,
    'createdAt', s.created_at,
    'versionId', s.version_id,
    'decisionDurationSeconds', s.decision_duration_seconds,
    'participantCount', (select count(*)::integer from public.group_participants
      where session_id = s.session_id),
    'participantId', member_id,
    'isHost', caller_is_host
  );
end
$$;

create function group_private.control_session(p_session_id uuid, p_action text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.group_sessions;
  next_scenario uuid;
  next_position integer;
begin
  if auth.uid() is null
     or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false then
    raise exception 'Anonymous session required' using errcode = '42501';
  end if;
  select * into s from public.group_sessions
  where session_id = p_session_id for update;
  if s.session_id is null or s.host_user_id is distinct from auth.uid() then
    raise exception 'Session control denied' using errcode = '42501';
  end if;

  if p_action = 'start' then
    if s.status <> 'open' or s.round_state <> 'lobby' then
      return jsonb_build_object('error', 'This session cannot be started.');
    end if;
    if not exists (select 1 from public.group_participants
                   where session_id = s.session_id) then
      return jsonb_build_object('error', 'At least one participant must join before starting.');
    end if;
    insert into public.group_session_questions(session_id, position, scenario_id)
    select s.session_id, row_number() over (
      order by d.default_day nulls last, lower(d.title), d.scenario_id
    )::integer, d.scenario_id
    from (
      select distinct on (lower(q.title), coalesce(q.description, ''))
        q.scenario_id, q.title, q.description, q.default_day
      from public.scenarios q
      where q.version_id = s.version_id
        and (select count(*) from public.choices c
             where c.scenario_id = q.scenario_id
               and c.version_id = s.version_id) >= 2
      order by lower(q.title), coalesce(q.description, ''),
        q.persona_intent nulls last, q.scenario_id
    ) d
    on conflict do nothing;
    select position, scenario_id into next_position, next_scenario
    from public.group_session_questions
    where session_id = s.session_id order by position limit 1;
    if next_scenario is null then
      return jsonb_build_object('error', 'No group questions are available.');
    end if;
    update public.group_sessions set current_scenario_id = next_scenario,
      current_question_number = next_position, round_state = 'voting',
      round_deadline = now() + make_interval(secs => decision_duration_seconds)
    where session_id = s.session_id;
  elsif p_action = 'end_voting' then
    if s.status <> 'open' or s.round_state <> 'voting' then
      return jsonb_build_object('error', 'Voting is not open.');
    end if;
    update public.group_sessions set round_state = 'results', round_deadline = now()
    where session_id = s.session_id;
  elsif p_action = 'next' then
    if s.status <> 'open' or s.round_state <> 'results' then
      return jsonb_build_object('error', 'End voting before moving on.');
    end if;
    select position, scenario_id into next_position, next_scenario
    from public.group_session_questions where session_id = s.session_id
      and position > s.current_question_number order by position limit 1;
    if next_scenario is null then
      update public.group_sessions set status = 'closed', round_state = 'completed',
        round_deadline = null where session_id = s.session_id;
    else
      update public.group_sessions set current_scenario_id = next_scenario,
        current_question_number = next_position, round_state = 'voting',
        round_deadline = now() + make_interval(secs => decision_duration_seconds)
      where session_id = s.session_id;
    end if;
  elsif p_action = 'close' then
    update public.group_sessions set status = 'closed', round_state = 'completed',
      round_deadline = null where session_id = s.session_id;
  else
    return jsonb_build_object('error', 'Unknown session action.');
  end if;
  return group_private.read_session_state(s.session_id);
end
$$;

create function public.control_group_session(p_session_id uuid, p_action text)
returns jsonb language sql security invoker set search_path = ''
as $$ select group_private.control_session(p_session_id, p_action) $$;

create function group_private.submit_vote(p_session_id uuid, p_choice_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare s public.group_sessions; member_id uuid;
begin
  if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false then
    raise exception 'Anonymous session required' using errcode = '42501';
  end if;
  select * into s from public.group_sessions where session_id = p_session_id for update;
  select participant_id into member_id from public.group_participants
    where session_id = p_session_id and user_id = auth.uid();
  if member_id is null then raise exception 'Vote denied' using errcode = '42501'; end if;
  if s.status <> 'open' or s.round_state <> 'voting' or s.round_deadline <= now() then
    return jsonb_build_object('error', 'Voting has ended for this question.');
  end if;
  if not exists (select 1 from public.choices where choice_id = p_choice_id
    and scenario_id = s.current_scenario_id and version_id = s.version_id) then
    return jsonb_build_object('error', 'That option is not available for this question.');
  end if;
  insert into public.group_votes(session_id, scenario_id, participant_id, choice_id)
  values (s.session_id, s.current_scenario_id, member_id, p_choice_id)
  on conflict (session_id, scenario_id, participant_id) do update
    set choice_id = excluded.choice_id, updated_at = now();
  return group_private.read_session_state(s.session_id);
end
$$;

create function public.submit_group_vote(p_session_id uuid, p_choice_id uuid)
returns jsonb language sql security invoker set search_path = ''
as $$ select group_private.submit_vote(p_session_id, p_choice_id) $$;

revoke all on function group_private.control_session(uuid, text),
  group_private.submit_vote(uuid, uuid), public.control_group_session(uuid, text),
  public.submit_group_vote(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function group_private.control_session(uuid, text),
  group_private.submit_vote(uuid, uuid), public.control_group_session(uuid, text),
  public.submit_group_vote(uuid, uuid) to authenticated;

commit;
