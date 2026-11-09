begin;

alter table public.group_sessions
  add column round_type text not null default 'scenario',
  add column selected_job_id uuid references public.jobs(job_id) on delete restrict,
  add constraint group_sessions_round_type_allowed
    check (round_type in ('job', 'scenario'));

create table public.group_job_votes (
  session_id uuid not null references public.group_sessions(session_id) on delete cascade,
  participant_id uuid not null,
  job_id uuid not null references public.jobs(job_id) on delete restrict,
  updated_at timestamptz not null default now(),
  primary key (session_id, participant_id),
  foreign key (session_id, participant_id)
    references public.group_participants(session_id, participant_id) on delete cascade
);
create index group_job_votes_tally_idx on public.group_job_votes(session_id, job_id);
alter table public.group_job_votes enable row level security;
revoke all on public.group_job_votes from public, anon, authenticated;

alter function group_private.read_session_state(uuid)
  rename to read_session_state_setup;

create function group_private.read_session_state(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare base jsonb; s public.group_sessions; member_id uuid;
begin
  base := group_private.read_session_state_setup(p_session_id);
  if base ? 'error' then return base; end if;
  select * into s from public.group_sessions where session_id = p_session_id;
  select participant_id into member_id from public.group_participants
    where session_id = p_session_id and user_id = auth.uid();
  return base || jsonb_build_object(
    'roundType', s.round_type,
    'currentDay', case when s.round_type = 'scenario' then s.current_question_number else 0 end,
    'totalDayCount', 30,
    'selectedJobId', (select job_id from public.group_job_votes
      where session_id = p_session_id and participant_id = member_id),
    'winningJobId', case when s.round_type = 'job' and s.round_state = 'results'
      then (select job_id from public.group_job_votes where session_id = p_session_id
        group by job_id order by count(*) desc, job_id limit 1)
      else s.selected_job_id end,
    'voteCount', case when s.round_type = 'job' then
      (select count(*)::integer from public.group_job_votes where session_id = p_session_id)
      else (base->>'voteCount')::integer end,
    'jobs', case when s.round_type = 'job' then (
      select coalesce(jsonb_agg(jsonb_build_object(
        'jobId', j.job_id,
        'title', j.title,
        'description', j.description,
        'hoursPerWeek', j.hours_per_week,
        'weeklyGrossIncome', j.weekly_gross_income,
        'voteCount', case when s.round_state in ('results', 'completed') then
          (select count(*) from public.group_job_votes v
           where v.session_id = p_session_id and v.job_id = j.job_id)
          else null end
      ) order by j.title), '[]'::jsonb)
      from public.jobs j where j.version_id = s.version_id and j.is_active
    ) else null end
  );
end
$$;

create or replace function public.get_group_session_state(p_session_id uuid)
returns jsonb language sql security invoker set search_path = ''
as $$ select group_private.read_session_state(p_session_id) $$;

create or replace function group_private.control_session(p_session_id uuid, p_action text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare s public.group_sessions; next_scenario uuid; next_position integer;
begin
  if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false then
    raise exception 'Anonymous session required' using errcode = '42501';
  end if;
  select * into s from public.group_sessions where session_id = p_session_id for update;
  if s.session_id is null or s.host_user_id is distinct from auth.uid() then
    raise exception 'Session control denied' using errcode = '42501';
  end if;

  if p_action = 'start' then
    if s.status <> 'open' or s.round_state <> 'lobby' then
      return jsonb_build_object('error', 'This session cannot be started.');
    end if;
    delete from public.group_session_questions where session_id = s.session_id;
    insert into public.group_session_questions(session_id, position, scenario_id)
    select s.session_id, row_number() over (
      order by d.default_day nulls last, lower(d.title), d.scenario_id
    )::integer, d.scenario_id
    from (
      select distinct on (lower(q.title), coalesce(q.description, ''))
        q.scenario_id, q.title, q.description, q.default_day
      from public.scenarios q
      where q.version_id = s.version_id
        and (select count(*) from public.choices c where c.scenario_id = q.scenario_id
          and c.version_id = s.version_id) >= 2
      order by lower(q.title), coalesce(q.description, ''),
        q.persona_intent nulls last, q.scenario_id
    ) d limit 30;
    if (select count(*) from public.group_session_questions
        where session_id = s.session_id) <> 30 then
      return jsonb_build_object('error', 'A complete 30-day scenario set is unavailable.');
    end if;
    if not exists (select 1 from public.jobs where version_id = s.version_id and is_active) then
      return jsonb_build_object('error', 'No job options are available.');
    end if;
    update public.group_sessions set round_type = 'job', current_scenario_id = null,
      current_question_number = 0, round_state = 'voting',
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
    if s.round_type = 'job' then
      select job_id into s.selected_job_id from public.group_job_votes
        where session_id = s.session_id group by job_id
        order by count(*) desc, job_id limit 1;
      select position, scenario_id into next_position, next_scenario
        from public.group_session_questions where session_id = s.session_id
        order by position limit 1;
      update public.group_sessions set selected_job_id = s.selected_job_id,
        round_type = 'scenario', current_scenario_id = next_scenario,
        current_question_number = next_position, round_state = 'voting',
        round_deadline = now() + make_interval(secs => decision_duration_seconds)
      where session_id = s.session_id;
    else
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
    end if;
  elsif p_action = 'close' then
    update public.group_sessions set status = 'closed', round_state = 'completed',
      round_deadline = null where session_id = s.session_id;
  else return jsonb_build_object('error', 'Unknown session action.');
  end if;
  return group_private.read_session_state(p_session_id);
end
$$;

create function group_private.submit_job_vote(p_session_id uuid, p_job_id uuid)
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
  if s.status <> 'open' or s.round_state <> 'voting' or s.round_type <> 'job'
     or s.round_deadline <= now() then
    return jsonb_build_object('error', 'Job voting has ended.');
  end if;
  if not exists (select 1 from public.jobs where job_id = p_job_id
      and version_id = s.version_id and is_active) then
    return jsonb_build_object('error', 'That job is not available.');
  end if;
  insert into public.group_job_votes(session_id, participant_id, job_id)
    values (s.session_id, member_id, p_job_id)
  on conflict (session_id, participant_id) do update
    set job_id = excluded.job_id, updated_at = now();
  return group_private.read_session_state(p_session_id);
end
$$;

create function public.submit_group_job_vote(p_session_id uuid, p_job_id uuid)
returns jsonb language sql security invoker set search_path = ''
as $$ select group_private.submit_job_vote(p_session_id, p_job_id) $$;

revoke all on function group_private.read_session_state(uuid),
  group_private.submit_job_vote(uuid, uuid), public.submit_group_job_vote(uuid, uuid)
from public, anon, authenticated, service_role;
grant execute on function group_private.read_session_state(uuid),
  group_private.submit_job_vote(uuid, uuid), public.submit_group_job_vote(uuid, uuid)
to authenticated;

commit;
