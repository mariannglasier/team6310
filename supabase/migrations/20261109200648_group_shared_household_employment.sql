begin;

alter table public.group_sessions
  drop constraint group_sessions_round_type_allowed,
  add column selected_persona_id uuid references public.personas(persona_id) on delete restrict,
  add column cac_support_enabled boolean not null default false,
  add column shared_balance numeric,
  add column employment_stage text not null default 'household',
  add column employment_attempt integer not null default 1,
  add column employment_prepared boolean not null default false,
  add column clothing_choice text,
  add column interview_hired boolean,
  add column weekly_income numeric not null default 0,
  add constraint group_sessions_round_type_allowed
    check (round_type in ('preparation', 'job', 'clothing', 'scenario')),
  add constraint group_sessions_employment_stage_allowed check (
    employment_stage in ('household', 'preparation', 'job', 'clothing', 'interview-result', 'complete')
  ),
  add constraint group_sessions_employment_attempt_allowed check (employment_attempt in (1, 2)),
  add constraint group_sessions_clothing_choice_allowed check (
    clothing_choice is null or clothing_choice in ('purchase', 'current', 'cac', 'owned')
  );

create table public.group_employment_votes (
  session_id uuid not null references public.group_sessions(session_id) on delete cascade,
  participant_id uuid not null,
  stage text not null check (stage in ('preparation', 'clothing')),
  option_id text not null,
  updated_at timestamptz not null default now(),
  primary key (session_id, participant_id, stage),
  foreign key (session_id, participant_id)
    references public.group_participants(session_id, participant_id) on delete cascade
);
create index group_employment_votes_tally_idx
  on public.group_employment_votes(session_id, stage, option_id);
alter table public.group_employment_votes enable row level security;
revoke all on public.group_employment_votes from public, anon, authenticated;

create function group_private.configure_host_session(
  p_create boolean,
  p_decision_duration_seconds integer,
  p_cac_support_enabled boolean
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare result jsonb; sid uuid;
begin
  result := group_private.configure_host_session(p_create, p_decision_duration_seconds);
  if result is null or result ? 'error' then return result; end if;
  sid := (result->>'sessionId')::uuid;
  if p_create then
    update public.group_sessions set cac_support_enabled = p_cac_support_enabled
    where session_id = sid and host_user_id = auth.uid() and round_state = 'lobby';
  end if;
  return group_private.read_session_state(sid);
end
$$;

create function public.configure_host_group_session(
  p_create boolean,
  p_decision_duration_seconds integer,
  p_cac_support_enabled boolean
) returns jsonb language sql security invoker set search_path = ''
as $$ select group_private.configure_host_session(
  p_create, p_decision_duration_seconds, p_cac_support_enabled
) $$;

alter function group_private.read_session_state(uuid)
  rename to read_session_state_month;

create function group_private.read_session_state(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare base jsonb; s public.group_sessions; member_id uuid; own_option text;
begin
  base := group_private.read_session_state_month(p_session_id);
  if base ? 'error' then return base; end if;
  select * into s from public.group_sessions where session_id = p_session_id;
  select participant_id into member_id from public.group_participants
    where session_id = p_session_id and user_id = auth.uid();
  if s.round_type in ('preparation', 'clothing') then
    select option_id into own_option from public.group_employment_votes
    where session_id = p_session_id and participant_id = member_id and stage = s.round_type;
  end if;
  return base || jsonb_build_object(
    'cacSupportEnabled', s.cac_support_enabled,
    'sharedHouseholdId', s.selected_persona_id,
    'sharedHouseholdName', (select name from public.personas where persona_id = s.selected_persona_id),
    'sharedBalance', s.shared_balance,
    'employmentStage', s.employment_stage,
    'employmentAttempt', s.employment_attempt,
    'employmentPrepared', s.employment_prepared,
    'clothingChoice', s.clothing_choice,
    'interviewHired', s.interview_hired,
    'weeklyIncome', s.weekly_income,
    'selectedEmploymentOption', own_option,
    'householdVotes', case when s.round_state = 'lobby' then (
      select coalesce(jsonb_agg(jsonb_build_object(
        'householdId', p.persona_id, 'householdName', p.name,
        'voteCount', (select count(*) from public.group_participants gp
          where gp.session_id = p_session_id and gp.persona_id = p.persona_id)
      ) order by p.name), '[]'::jsonb)
      from public.personas p where p.version_id = s.version_id
    ) else null end,
    'employmentOptions', case
      when s.round_type = 'preparation' then jsonb_build_array(
        jsonb_build_object('optionId','prepare','text','Join CAC Adult Education classes',
          'voteCount',case when s.round_state='results' then (select count(*) from public.group_employment_votes where session_id=p_session_id and stage='preparation' and option_id='prepare') else null end),
        jsonb_build_object('optionId','skip','text','Continue without classes',
          'voteCount',case when s.round_state='results' then (select count(*) from public.group_employment_votes where session_id=p_session_id and stage='preparation' and option_id='skip') else null end)
      )
      when s.round_type = 'clothing' then (
        select jsonb_agg(jsonb_build_object('optionId', x.option_id, 'text', x.label,
          'cost', x.cost, 'voteCount', case when s.round_state='results' then
            (select count(*) from public.group_employment_votes v where v.session_id=p_session_id and v.stage='clothing' and v.option_id=x.option_id) else null end) order by x.sort)
        from (values
          ('purchase','Buy professional clothes',60::numeric,1),
          ('current','Make our current clothes work',0::numeric,2),
          ('cac','Use the CAC clothing closet',0::numeric,3),
          ('owned','Wear our professional clothes',0::numeric,4)
        ) x(option_id,label,cost,sort)
        where (s.clothing_choice in ('purchase','cac') and x.option_id='owned')
           or (s.clothing_choice is null and x.option_id in ('purchase','current'))
           or (s.clothing_choice is null and s.cac_support_enabled and x.option_id='cac')
      ) else null end,
    'voteCount', case when s.round_type in ('preparation','clothing') then
      (select count(*)::integer from public.group_employment_votes where session_id=p_session_id and stage=s.round_type)
      else (base->>'voteCount')::integer end,
    'sharedExpenses', case when s.selected_persona_id is not null then (
      select coalesce(jsonb_agg(jsonb_build_object('expenseId', expense_id, 'name', name,
        'amount', amount, 'firstDueDay', first_due_day, 'repeatIntervalDays', repeat_interval_days)
        order by first_due_day, name), '[]'::jsonb)
      from public.persona_expenses where persona_id=s.selected_persona_id and version_id=s.version_id
    ) else null end
  );
end
$$;

create or replace function public.get_group_session_state(p_session_id uuid)
returns jsonb language sql security invoker set search_path = ''
as $$ select group_private.read_session_state(p_session_id) $$;

create function group_private.submit_employment_vote(
  p_session_id uuid, p_option_id text
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare s public.group_sessions; member_id uuid; allowed boolean;
begin
  if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false then
    raise exception 'Anonymous session required' using errcode='42501';
  end if;
  select * into s from public.group_sessions where session_id=p_session_id for update;
  select participant_id into member_id from public.group_participants
    where session_id=p_session_id and user_id=auth.uid();
  if member_id is null then raise exception 'Vote denied' using errcode='42501'; end if;
  allowed := case s.round_type
    when 'preparation' then p_option_id in ('prepare','skip')
    when 'clothing' then
      (s.clothing_choice in ('purchase','cac') and p_option_id='owned') or
      (s.clothing_choice is null and p_option_id in ('purchase','current')) or
      (s.clothing_choice is null and s.cac_support_enabled and p_option_id='cac')
    else false end;
  if s.status<>'open' or s.round_state<>'voting' or s.round_deadline<=now() or not allowed then
    return jsonb_build_object('error','That employment vote is unavailable.');
  end if;
  insert into public.group_employment_votes(session_id,participant_id,stage,option_id)
  values(s.session_id,member_id,s.round_type,p_option_id)
  on conflict(session_id,participant_id,stage) do update set option_id=excluded.option_id,updated_at=now();
  return group_private.read_session_state(p_session_id);
end
$$;

create function public.submit_group_employment_vote(p_session_id uuid,p_option_id text)
returns jsonb language sql security invoker set search_path=''
as $$ select group_private.submit_employment_vote(p_session_id,p_option_id) $$;

create or replace function group_private.control_session(p_session_id uuid,p_action text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare s public.group_sessions; next_scenario uuid; next_position integer;
  winner_persona uuid; winner_job uuid; winner_option text; winning_choice public.choices;
begin
  if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false then
    raise exception 'Anonymous session required' using errcode='42501';
  end if;
  select * into s from public.group_sessions where session_id=p_session_id for update;
  if s.session_id is null or s.host_user_id is distinct from auth.uid() then
    raise exception 'Session control denied' using errcode='42501';
  end if;
  if p_action='start' then
    if s.status<>'open' or s.round_state<>'lobby' then return jsonb_build_object('error','This session cannot be started.'); end if;
    select persona_id into winner_persona from public.group_participants where session_id=s.session_id
      group by persona_id order by count(*) desc,persona_id limit 1;
    if winner_persona is null then return jsonb_build_object('error','A household vote is required.'); end if;
    delete from public.group_session_questions where session_id=s.session_id;
    insert into public.group_session_questions(session_id,position,scenario_id)
    select s.session_id,row_number() over(order by d.default_day nulls last,lower(d.title),d.scenario_id)::integer,d.scenario_id
    from (select distinct on(lower(q.title),coalesce(q.description,'')) q.scenario_id,q.title,q.description,q.default_day
      from public.scenarios q where q.version_id=s.version_id
        and (q.persona_intent=winner_persona or q.persona_intent is null)
        and (select count(*) from public.choices c where c.scenario_id=q.scenario_id and c.version_id=s.version_id)>=1
      order by lower(q.title),coalesce(q.description,''),q.scenario_id) d limit 30;
    if (select count(*) from public.group_session_questions where session_id=s.session_id)<>30 then
      return jsonb_build_object('error','A complete 30-day scenario set is unavailable for the winning household.');
    end if;
    update public.group_sessions set selected_persona_id=winner_persona,
      shared_balance=(select general_starting_balance from public.personas where persona_id=winner_persona),
      employment_stage=case when cac_support_enabled then 'preparation' else 'job' end,
      round_type=case when cac_support_enabled then 'preparation' else 'job' end,
      round_state='voting',current_question_number=0,current_scenario_id=null,
      round_deadline=now()+make_interval(secs=>decision_duration_seconds)
    where session_id=s.session_id;
  elsif p_action='end_voting' then
    if s.status<>'open' or s.round_state<>'voting' then return jsonb_build_object('error','Voting is not open.'); end if;
    update public.group_sessions set round_state='results',round_deadline=now() where session_id=s.session_id;
  elsif p_action='next' then
    if s.status<>'open' or s.round_state<>'results' then return jsonb_build_object('error','End voting before moving on.'); end if;
    if s.round_type='preparation' then
      select option_id into winner_option from public.group_employment_votes where session_id=s.session_id and stage='preparation'
        group by option_id order by count(*) desc,option_id limit 1;
      update public.group_sessions set employment_prepared=winner_option='prepare',employment_stage='job',round_type='job',round_state='voting',
        round_deadline=now()+make_interval(secs=>decision_duration_seconds) where session_id=s.session_id;
    elsif s.round_type='job' then
      select job_id into winner_job from public.group_job_votes where session_id=s.session_id
        and (s.employment_attempt=1 or job_id<>s.selected_job_id)
        group by job_id order by count(*) desc,job_id limit 1;
      if winner_job is null then return jsonb_build_object('error','A job vote is required.'); end if;
      delete from public.group_employment_votes where session_id=s.session_id and stage='clothing';
      update public.group_sessions set selected_job_id=winner_job,employment_stage='clothing',round_type='clothing',round_state='voting',
        round_deadline=now()+make_interval(secs=>decision_duration_seconds) where session_id=s.session_id;
    elsif s.round_type='clothing' and s.employment_stage='clothing' then
      select option_id into winner_option from public.group_employment_votes where session_id=s.session_id and stage='clothing'
        group by option_id order by count(*) desc,option_id limit 1;
      if winner_option is null then return jsonb_build_object('error','A clothing vote is required.'); end if;
      if winner_option='purchase' and coalesce(s.shared_balance,0)<60 then return jsonb_build_object('error','The group cannot afford professional clothing.'); end if;
      update public.group_sessions set
        shared_balance=shared_balance-case when winner_option='purchase' then 60 else 0 end,
        clothing_choice=case when winner_option='purchase' then 'purchase' when winner_option='cac' then 'cac' else clothing_choice end,
        interview_hired=(s.employment_attempt=2 or (s.employment_prepared and winner_option<>'current')),
        employment_stage='interview-result',round_state='results',round_deadline=null
      where session_id=s.session_id;
    elsif s.round_type='clothing' and s.employment_stage='interview-result' then
      if s.interview_hired then
        select weekly_gross_income into s.weekly_income from public.jobs where job_id=s.selected_job_id;
        select position,scenario_id into next_position,next_scenario from public.group_session_questions where session_id=s.session_id order by position limit 1;
        update public.group_sessions set weekly_income=s.weekly_income,employment_stage='complete',round_type='scenario',
          current_question_number=next_position,current_scenario_id=next_scenario,round_state='voting',
          round_deadline=now()+make_interval(secs=>decision_duration_seconds) where session_id=s.session_id;
      else
        delete from public.group_job_votes where session_id=s.session_id;
        update public.group_sessions set employment_attempt=2,employment_stage='job',round_type='job',round_state='voting',
          round_deadline=now()+make_interval(secs=>decision_duration_seconds) where session_id=s.session_id;
      end if;
    else
      select c.* into winning_choice from public.group_votes v join public.choices c on c.choice_id=v.choice_id
        where v.session_id=s.session_id and v.scenario_id=s.current_scenario_id
        group by c.choice_id order by count(*) desc,c.choice_id limit 1;
      if winning_choice.choice_id is not null then
        update public.group_sessions set shared_balance=shared_balance+coalesce(winning_choice.balance_change,0)
        where session_id=s.session_id;
      end if;
      select position,scenario_id into next_position,next_scenario from public.group_session_questions
        where session_id=s.session_id and position>s.current_question_number order by position limit 1;
      if next_scenario is null then
        update public.group_sessions set status='closed',round_state='completed',round_deadline=null where session_id=s.session_id;
      else
        update public.group_sessions set current_scenario_id=next_scenario,current_question_number=next_position,
          round_state='voting',round_deadline=now()+make_interval(secs=>decision_duration_seconds) where session_id=s.session_id;
      end if;
    end if;
  elsif p_action='close' then
    update public.group_sessions set status='closed',round_state='completed',round_deadline=null where session_id=s.session_id;
  else return jsonb_build_object('error','Unknown session action.'); end if;
  return group_private.read_session_state(p_session_id);
end
$$;

create or replace function group_private.submit_job_vote(p_session_id uuid,p_job_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare s public.group_sessions; member_id uuid;
begin
  if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false then raise exception 'Anonymous session required' using errcode='42501'; end if;
  select * into s from public.group_sessions where session_id=p_session_id for update;
  select participant_id into member_id from public.group_participants where session_id=p_session_id and user_id=auth.uid();
  if member_id is null then raise exception 'Vote denied' using errcode='42501'; end if;
  if s.status<>'open' or s.round_state<>'voting' or s.round_type<>'job' or s.round_deadline<=now() then return jsonb_build_object('error','Job voting has ended.'); end if;
  if not exists(select 1 from public.jobs where job_id=p_job_id and version_id=s.version_id and is_active and is_approved)
     or (s.employment_attempt=2 and p_job_id=s.selected_job_id) then return jsonb_build_object('error','That job is not available.'); end if;
  insert into public.group_job_votes(session_id,participant_id,job_id) values(s.session_id,member_id,p_job_id)
  on conflict(session_id,participant_id) do update set job_id=excluded.job_id,updated_at=now();
  return group_private.read_session_state(p_session_id);
end
$$;

revoke all on function group_private.configure_host_session(boolean,integer,boolean),
  public.configure_host_group_session(boolean,integer,boolean),
  group_private.read_session_state(uuid),group_private.submit_employment_vote(uuid,text),
  public.submit_group_employment_vote(uuid,text)
from public,anon,authenticated,service_role;
grant execute on function group_private.configure_host_session(boolean,integer,boolean),
  public.configure_host_group_session(boolean,integer,boolean),
  group_private.read_session_state(uuid),group_private.submit_employment_vote(uuid,text),
  public.submit_group_employment_vote(uuid,text)
to authenticated;

commit;
