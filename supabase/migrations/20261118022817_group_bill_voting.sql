begin;

alter table public.group_session_questions alter column scenario_id drop not null;

create table group_private.bill_occurrences (
  bill_id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.group_sessions(session_id) on delete cascade,
  expense_id uuid not null references public.persona_expenses(expense_id),
  due_day integer not null check (due_day between 1 and 30),
  name text not null,
  principal numeric not null,
  late_fee numeric not null,
  ignored_at timestamptz,
  paid_day integer check (paid_day between due_day and 30),
  unique (session_id, expense_id, due_day),
  unique (session_id, bill_id)
);

alter table public.group_sessions
  add column active_bill_id uuid,
  add column bill_vote_round integer not null default 0,
  add foreign key (session_id, active_bill_id)
    references group_private.bill_occurrences(session_id, bill_id);

create table group_private.bill_votes (
  session_id uuid not null,
  bill_id uuid not null,
  participant_id uuid not null,
  choice text not null check (choice in ('pay', 'ignore')),
  primary key (session_id, bill_id, participant_id),
  foreign key (session_id, bill_id)
    references group_private.bill_occurrences(session_id, bill_id) on delete cascade,
  foreign key (session_id, participant_id)
    references public.group_participants(session_id, participant_id) on delete cascade
);

alter table group_private.bill_occurrences enable row level security;
alter table group_private.bill_votes enable row level security;
revoke all on group_private.bill_occurrences, group_private.bill_votes
  from public, anon, authenticated, service_role;

create function group_private.build_bill_calendar(s public.group_sessions, household uuid)
returns text language plpgsql set search_path = '' as $$
begin
  delete from public.group_session_questions where session_id = s.session_id;
  insert into group_private.bill_occurrences(session_id, expense_id, due_day, name, principal, late_fee)
  select s.session_id, e.expense_id, d.day, e.name, e.amount, e.late_fee_amount
  from public.persona_expenses e
  cross join lateral generate_series(e.first_due_day::integer, 30,
    coalesce(e.repeat_interval_days::integer, 31)) d(day)
  where e.version_id = s.version_id and e.persona_id = household;

  if exists (
    select 1 from group_private.bill_occurrences b
    join public.scenarios q on q.version_id = s.version_id
      and q.persona_intent = household and q.default_day = b.due_day
      and q.schedule_type = 'scheduled'
    where b.session_id = s.session_id
  ) then
    delete from group_private.bill_occurrences where session_id = s.session_id;
    return 'A scheduled scenario and bill are due on the same day for this household.';
  end if;

  insert into public.group_session_questions(session_id, position, scenario_id)
  with bill_days as (
    select distinct due_day from group_private.bill_occurrences where session_id = s.session_id
  ), scenario_days as (
    select day, row_number() over (order by day) as rank
    from generate_series(1, 30) d(day)
    where day not in (select due_day from bill_days)
  ), deck as (
    select q.scenario_id, row_number() over (order by q.default_day nulls last, lower(q.title), q.scenario_id) as rank
    from (
      select distinct on (lower(q.title), coalesce(q.description, ''))
        q.scenario_id, q.title, q.description, q.default_day
      from public.scenarios q
      where q.version_id = s.version_id and (q.persona_intent = household or q.persona_intent is null)
        and exists (select 1 from public.choices c where c.scenario_id = q.scenario_id and c.version_id = s.version_id)
      order by lower(q.title), coalesce(q.description, ''), q.scenario_id
    ) q
  )
  select s.session_id, d.day, q.scenario_id from scenario_days d join deck q using (rank)
  union all
  select s.session_id, due_day, null::uuid from bill_days;

  if (select count(*) from public.group_session_questions where session_id = s.session_id) <> 30 then
    delete from public.group_session_questions where session_id = s.session_id;
    delete from group_private.bill_occurrences where session_id = s.session_id;
    return 'A complete 30-day schedule is unavailable for the winning household.';
  end if;
  return null;
end
$$;

create function group_private.open_due_bill()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'open' and new.round_type = 'scenario'
     and new.current_question_number > old.current_question_number then
    new.bill_vote_round := old.bill_vote_round + 1;
    select b.bill_id into new.active_bill_id
    from group_private.bill_occurrences b
    where b.session_id = new.session_id and b.due_day = new.current_question_number
      and b.paid_day is null and b.ignored_at is null
    order by b.name, b.bill_id limit 1;
  end if;
  return new;
end
$$;

-- The paycheck trigger sorts first. Both changes commit with the day transition.
create trigger group_sessions_open_due_bill
before update of current_question_number on public.group_sessions
for each row execute function group_private.open_due_bill();

create function group_private.bill_snapshot(s public.group_sessions)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'isBillDay', exists (select 1 from group_private.bill_occurrences b
      where b.session_id = s.session_id and b.due_day = s.current_question_number),
    'resolvedBills', coalesce((
      select jsonb_agg(jsonb_build_object('billId', b.bill_id, 'name', b.name,
        'paid', b.paid_day is not null,
        'total', b.principal + case when b.ignored_at is null then 0 else b.late_fee end)
        order by b.name, b.bill_id)
      from group_private.bill_occurrences b where b.session_id = s.session_id
        and b.due_day = s.current_question_number
        and (b.paid_day is not null or b.ignored_at is not null)
    ), '[]'::jsonb),
    'activeBill', (
      select jsonb_build_object(
        'billId', b.bill_id, 'name', b.name, 'dueDay', b.due_day,
        'principal', b.principal, 'lateFee', b.late_fee,
        'total', b.principal + case when b.ignored_at is null then 0 else b.late_fee end,
        'round', s.bill_vote_round,
        'payVotes', case when s.round_state = 'results' then
          (select count(*) from group_private.bill_votes v where v.bill_id = b.bill_id and v.choice = 'pay') end,
        'ignoreVotes', case when s.round_state = 'results' then
          (select count(*) from group_private.bill_votes v where v.bill_id = b.bill_id and v.choice = 'ignore') end,
        'selectedChoice', (select v.choice from group_private.bill_votes v
          join public.group_participants p using (session_id, participant_id)
          where v.bill_id = b.bill_id and p.user_id = auth.uid()),
        'voteCount', (select count(*) from group_private.bill_votes v where v.bill_id = b.bill_id))
      from group_private.bill_occurrences b where b.bill_id = s.active_bill_id and s.status = 'open'
    ),
    'overdueBills', coalesce((
      select jsonb_agg(jsonb_build_object('billId', b.bill_id, 'name', b.name,
        'dueDay', b.due_day, 'principal', b.principal, 'lateFee', b.late_fee,
        'total', b.principal + b.late_fee) order by b.due_day, b.name, b.bill_id)
      from group_private.bill_occurrences b where b.session_id = s.session_id
        and b.paid_day is null and b.ignored_at is not null and b.due_day < s.current_question_number
    ), '[]'::jsonb),
    'unpaidBillTotal', coalesce((
      select sum(b.principal + case when b.ignored_at is null then 0 else b.late_fee end)
      from group_private.bill_occurrences b where b.session_id = s.session_id
        and b.paid_day is null and b.due_day <= s.current_question_number
    ), 0)
  )
$$;

create function group_private.vote_bill(p_session_id uuid, p_bill_id uuid, p_round integer, p_choice text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  s public.group_sessions;
  member_id uuid;
begin
  if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) is not true then
    raise exception 'Anonymous session required' using errcode = '42501';
  end if;
  select * into s from public.group_sessions where session_id = p_session_id for update;
  select participant_id into member_id from public.group_participants
    where session_id = p_session_id and user_id = auth.uid();
  if member_id is null then raise exception 'Vote denied' using errcode = '42501'; end if;
  if s.status <> 'open' or s.round_state <> 'voting'
     or s.round_deadline is null or s.round_deadline <= clock_timestamp()
     or s.active_bill_id is distinct from p_bill_id or s.active_bill_id is null
     or s.bill_vote_round is distinct from p_round
     or p_choice is null or p_choice not in ('pay', 'ignore') then
    return jsonb_build_object('error', 'This bill vote is unavailable.');
  end if;
  insert into group_private.bill_votes(session_id, bill_id, participant_id, choice)
  values (p_session_id, p_bill_id, member_id, p_choice)
  on conflict (session_id, bill_id, participant_id) do update set choice = excluded.choice;
  return group_private.read_session_state(p_session_id);
end
$$;

create function group_private.control_bill(p_session_id uuid, p_bill_id uuid, p_round integer, p_action text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  s public.group_sessions;
  b group_private.bill_occurrences;
  next_bill uuid;
  pay_votes integer;
  ignore_votes integer;
  settlement numeric;
  starts_vote boolean := false;
begin
  if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) is not true then
    raise exception 'Anonymous session required' using errcode = '42501';
  end if;
  select * into s from public.group_sessions where session_id = p_session_id for update;
  if s.session_id is null or s.host_user_id is distinct from auth.uid() then
    raise exception 'Session control denied' using errcode = '42501';
  end if;
  if s.status <> 'open' or s.round_type <> 'scenario' then
    return jsonb_build_object('error', 'Bills are unavailable right now.');
  end if;
  select * into b from group_private.bill_occurrences where bill_id = p_bill_id and session_id = p_session_id;
  if b.bill_id is null or b.paid_day is not null then
    return jsonb_build_object('error', 'This bill is unavailable.');
  end if;
  if p_action = 'open_overdue' then
    if s.active_bill_id is not null or s.round_state <> 'results'
       or s.bill_vote_round is distinct from p_round
       or b.ignored_at is null or b.due_day >= s.current_question_number then
      return jsonb_build_object('error', 'This overdue bill cannot be opened right now.');
    end if;
    delete from group_private.bill_votes where bill_id = b.bill_id;
    next_bill := b.bill_id;
    starts_vote := true;
  elsif s.active_bill_id is distinct from p_bill_id or s.bill_vote_round is distinct from p_round then
    return jsonb_build_object('error', 'This bill vote has changed. Refresh the session and try again.');
  elsif p_action = 'end_voting' and s.round_state = 'voting' then
    update public.group_sessions set round_state = 'results', round_deadline = null where session_id = p_session_id;
    return group_private.read_session_state(p_session_id);
  elsif p_action = 'reopen' and s.round_state = 'results' then
    delete from group_private.bill_votes where bill_id = b.bill_id;
    next_bill := b.bill_id;
    starts_vote := true;
  elsif p_action = 'confirm' and s.round_state = 'results' then
    select count(*) filter (where choice = 'pay'), count(*) filter (where choice = 'ignore')
    into pay_votes, ignore_votes from group_private.bill_votes where bill_id = b.bill_id;
    if pay_votes = ignore_votes then
      return jsonb_build_object('error', 'There is no winning option. Reopen voting to try again.');
    end if;
    if pay_votes > ignore_votes then
      settlement := b.principal + case when b.ignored_at is null then 0 else b.late_fee end;
      if s.shared_balance is null or s.shared_balance < settlement then
        return jsonb_build_object('error', 'The household cannot afford this bill. Reopen voting to consider Ignore.');
      end if;
      s.shared_balance := s.shared_balance - settlement;
      update group_private.bill_occurrences set paid_day = s.current_question_number where bill_id = b.bill_id;
    else
      update group_private.bill_occurrences set ignored_at = coalesce(ignored_at, now()) where bill_id = b.bill_id;
    end if;
    if b.due_day = s.current_question_number then
      select bill_id into next_bill from group_private.bill_occurrences
      where session_id = p_session_id and due_day = s.current_question_number
        and paid_day is null and ignored_at is null order by name, bill_id limit 1;
      starts_vote := next_bill is not null;
    end if;
  else
    return jsonb_build_object('error', 'This bill action is unavailable.');
  end if;

  update public.group_sessions
  set shared_balance = s.shared_balance, active_bill_id = next_bill,
      bill_vote_round = bill_vote_round + case when starts_vote then 1 else 0 end,
      round_state = case when starts_vote then 'voting' else 'results' end,
      round_deadline = case when starts_vote then clock_timestamp() + make_interval(secs => s.decision_duration_seconds) end
  where session_id = p_session_id;
  return group_private.read_session_state(p_session_id);
end
$$;

create function public.vote_group_bill(p_session_id uuid, p_bill_id uuid, p_round integer, p_choice text)
returns jsonb language sql security invoker set search_path = '' as $$
  select group_private.vote_bill(p_session_id, p_bill_id, p_round, p_choice)
$$;

create function public.control_group_bill(p_session_id uuid, p_bill_id uuid, p_round integer, p_action text)
returns jsonb language sql security invoker set search_path = '' as $$
  select group_private.control_bill(p_session_id, p_bill_id, p_round, p_action)
$$;

revoke all on function group_private.build_bill_calendar(public.group_sessions, uuid),
  group_private.open_due_bill(), group_private.bill_snapshot(public.group_sessions),
  group_private.vote_bill(uuid, uuid, integer, text), group_private.control_bill(uuid, uuid, integer, text),
  public.vote_group_bill(uuid, uuid, integer, text), public.control_group_bill(uuid, uuid, integer, text)
  from public, anon, authenticated, service_role;
grant execute on function group_private.vote_bill(uuid, uuid, integer, text),
  group_private.control_bill(uuid, uuid, integer, text),
  public.vote_group_bill(uuid, uuid, integer, text), public.control_group_bill(uuid, uuid, integer, text)
  to authenticated;

-- Extend the installed functions without replacing preceding group changes.
do $$
declare
  definition text;
  start_at integer;
  end_at integer;
begin
  definition := pg_get_functiondef('group_private.control_session(uuid,text)'::regprocedure);
  start_at := strpos(definition, '    delete from public.group_session_questions');
  end_at := strpos(definition, '    update public.group_sessions set selected_persona_id=winner_persona');
  if start_at = 0 or end_at <= start_at
     or strpos(definition, 'if next_scenario is null then') = 0
     or strpos(definition, '  if p_action=''start'' then') = 0 then
    raise exception 'Group calendar integration points not found';
  end if;
  definition := overlay(definition placing
    E'    winner_option := group_private.build_bill_calendar(s, winner_persona);\n'
    || E'    if winner_option is not null then\n'
    || E'      return jsonb_build_object(''error'', winner_option);\n'
    || E'    end if;\n'
    from start_at for end_at - start_at);
  definition := replace(definition, 'if next_scenario is null then', 'if next_position is null then');
  definition := replace(definition, '  if p_action=''start'' then',
    E'  if s.active_bill_id is not null and p_action <> ''close'' then\n'
    || E'    return jsonb_build_object(''error'', ''Resolve the active bill first.'');\n'
    || E'  end if;\n  if p_action=''start'' then');
  execute definition;

  definition := pg_get_functiondef('group_private.submit_vote(uuid,uuid)'::regprocedure);
  if strpos(definition, 'if not exists (select 1 from public.choices') = 0 then
    raise exception 'Group scenario vote integration point not found';
  end if;
  execute replace(definition, 'if not exists (select 1 from public.choices',
    'if s.active_bill_id is not null or not exists (select 1 from public.choices');

  definition := pg_get_functiondef('group_private.update_session_state(uuid,text,uuid)'::regprocedure);
  if strpos(definition, '  if p_current_scenario_id is not null and not exists (') = 0 then
    raise exception 'Group legacy update integration point not found';
  end if;
  execute replace(definition, '  if p_current_scenario_id is not null and not exists (',
    E'  if p_current_scenario_id is not null and exists (\n'
    || E'    select 1 from group_private.bill_occurrences where session_id = s.session_id and due_day = s.current_question_number\n'
    || E'  ) then\n'
    || E'    return jsonb_build_object(''error'', ''A bill is scheduled for this day.'');\n'
    || E'  end if;\n  if p_current_scenario_id is not null and not exists (');

  definition := pg_get_functiondef('group_private.read_session_state(uuid)'::regprocedure);
  if strpos(definition, 'return base || jsonb_build_object(') = 0 then
    raise exception 'Group bill snapshot integration point not found';
  end if;
  execute replace(definition, 'return base || jsonb_build_object(',
    'return base || group_private.bill_snapshot(s) || jsonb_build_object(''billVoteRound'', s.bill_vote_round,');
end
$$;

commit;
