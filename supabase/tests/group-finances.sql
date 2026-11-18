-- Run against a local Supabase database with published content and expenses.
begin;

insert into auth.users(id, is_anonymous) values
  ('63100000-0000-4000-8000-000000000101', true),
  ('63100000-0000-4000-8000-000000000102', true);

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000101","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$
declare s jsonb;
begin
  s := public.configure_host_group_session(true, 60, false);
  assert s->>'sessionId' is not null;
  perform set_config('test.finance_session', s->>'sessionId', true);
  perform set_config('test.finance_code', s->>'joinCode', true);
end
$$;
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000102","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
select public.join_group_session(current_setting('test.finance_code'));
reset role;

do $$
declare sid uuid := current_setting('test.finance_session')::uuid;
begin
  update public.group_sessions set round_state = 'results', round_type = 'scenario',
    employment_stage = 'complete', interview_hired = true, current_question_number = 6,
    shared_balance = 400, weekly_income = 300 where session_id = sid;
  insert into public.group_session_questions(session_id, position, scenario_id)
    values (sid, 7, null), (sid, 8, null), (sid, 14, null);
  insert into group_private.bill_occurrences(session_id, expense_id, due_day, name, principal, late_fee)
  select sid, e.expense_id, 7, 'Rent', 600, 20 from public.persona_expenses e order by e.expense_id limit 1;
  assert found, 'An expense definition is required for the group finance fixture';
  insert into group_private.bill_occurrences(session_id, expense_id, due_day, name, principal, late_fee)
  select sid, e.expense_id, 7, 'Utilities', 200, 20 from public.persona_expenses e order by e.expense_id offset 1 limit 1;
  assert found, 'A second expense definition is required for the group finance fixture';
  insert into group_private.bill_occurrences(session_id, expense_id, due_day, name, principal, late_fee)
  select sid, e.expense_id, d.day, 'Future expense', 25, 0
  from (select expense_id from public.persona_expenses order by expense_id limit 1) e
  cross join (values (21), (28), (30)) d(day);
end
$$;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000101","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$
declare sid uuid := current_setting('test.finance_session')::uuid; s jsonb;
begin
  s := public.control_group_session(sid, 'next');
  assert s->>'currentDay' = '7' and s->>'lastPayday' = '7';
  assert (s->>'sharedBalance')::numeric = 700;
  assert s->>'isBillDay' = 'true' and s->>'currentScenarioId' is null;
  assert s->'activeBill'->>'name' = 'Rent';
  assert jsonb_path_query_array(s->'upcomingBills', '$[*].dueDay') = '[7, 7, 21]';
  assert public.control_group_session(sid, 'next')->>'error' is not null;
  perform set_config('test.finance_bill', s->'activeBill'->>'billId', true);
  perform set_config('test.finance_round', s->'activeBill'->>'round', true);
end
$$;
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000102","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  sid uuid := current_setting('test.finance_session')::uuid;
  bid uuid := current_setting('test.finance_bill')::uuid;
  ballot integer := current_setting('test.finance_round')::integer;
  s jsonb;
begin
  s := public.vote_group_bill(sid, bid, ballot, 'pay');
  assert (s->>'sharedBalance')::numeric = 700;
  assert s->'activeBill'->>'selectedChoice' = 'pay' and s->'activeBill'->>'payVotes' is null;
  begin
    perform public.control_group_bill(sid, bid, ballot, 'confirm');
    assert false, 'A participant must not control a bill ballot';
  exception when insufficient_privilege then null;
  end;
end
$$;
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000101","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  sid uuid := current_setting('test.finance_session')::uuid;
  bid uuid := current_setting('test.finance_bill')::uuid;
  ballot integer := current_setting('test.finance_round')::integer;
  s jsonb;
begin
  s := public.control_group_bill(sid, bid, ballot, 'end_voting');
  assert s->'activeBill'->>'payVotes' = '1';
  s := public.control_group_bill(sid, bid, ballot, 'confirm');
  assert (s->>'sharedBalance')::numeric = 100 and (s->>'unpaidBillTotal')::numeric = 200;
  assert s->'activeBill'->>'name' = 'Utilities';
  assert jsonb_path_query_array(s->'upcomingBills', '$[*].dueDay') = '[7, 21, 28]';
  assert public.control_group_bill(sid, bid, ballot, 'confirm')->>'error' is not null;
  assert (public.get_group_session_state(sid)->>'sharedBalance')::numeric = 100;
  perform set_config('test.second_bill', s->'activeBill'->>'billId', true);
  perform set_config('test.second_round', s->'activeBill'->>'round', true);
end
$$;
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000102","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
select public.vote_group_bill(current_setting('test.finance_session')::uuid,
  current_setting('test.second_bill')::uuid, current_setting('test.second_round')::integer, 'pay');
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000101","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  sid uuid := current_setting('test.finance_session')::uuid;
  bid uuid := current_setting('test.second_bill')::uuid;
  ballot integer := current_setting('test.second_round')::integer;
  s jsonb;
begin
  perform public.control_group_bill(sid, bid, ballot, 'end_voting');
  assert public.control_group_bill(sid, bid, ballot, 'confirm')->>'error' like 'The household cannot afford%';
  s := public.get_group_session_state(sid);
  assert (s->>'sharedBalance')::numeric = 100 and (s->>'unpaidBillTotal')::numeric = 200;
  s := public.control_group_bill(sid, bid, ballot, 'reopen');
  perform set_config('test.reopened_round', s->'activeBill'->>'round', true);
end
$$;
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000102","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  sid uuid := current_setting('test.finance_session')::uuid;
  bid uuid := current_setting('test.second_bill')::uuid;
  ballot integer := current_setting('test.reopened_round')::integer;
begin
  assert public.vote_group_bill(sid, bid, ballot - 1, 'pay')->>'error' is not null;
  assert public.vote_group_bill(sid, bid, ballot, 'ignore')->'activeBill'->>'selectedChoice' = 'ignore';
end
$$;
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000101","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  sid uuid := current_setting('test.finance_session')::uuid;
  bid uuid := current_setting('test.second_bill')::uuid;
  ballot integer := current_setting('test.reopened_round')::integer;
  s jsonb;
begin
  perform public.control_group_bill(sid, bid, ballot, 'end_voting');
  s := public.control_group_bill(sid, bid, ballot, 'confirm');
  assert (s->>'sharedBalance')::numeric = 100 and (s->>'unpaidBillTotal')::numeric = 220;
  assert jsonb_path_query_array(s->'upcomingBills', '$[*].dueDay') = '[21, 28, 30]';
  assert public.control_group_bill(sid, bid, ballot, 'confirm')->>'error' is not null;
  s := public.control_group_session(sid, 'next');
  assert s->>'currentDay' = '8' and (s->>'sharedBalance')::numeric = 100;
  perform public.control_group_session(sid, 'end_voting');
  s := public.control_group_session(sid, 'next');
  assert s->>'lastPayday' = '14' and (s->>'sharedBalance')::numeric = 400;
  s := public.control_group_session(sid, 'end_voting');
  s := public.control_group_bill(sid, bid, (s->>'billVoteRound')::integer, 'open_overdue');
  assert (s->'activeBill'->>'total')::numeric = 220;
  perform set_config('test.overdue_round', s->'activeBill'->>'round', true);
end
$$;
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000102","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
select public.vote_group_bill(current_setting('test.finance_session')::uuid,
  current_setting('test.second_bill')::uuid, current_setting('test.overdue_round')::integer, 'pay');
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000101","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  sid uuid := current_setting('test.finance_session')::uuid;
  bid uuid := current_setting('test.second_bill')::uuid;
  ballot integer := current_setting('test.overdue_round')::integer;
  s jsonb;
begin
  perform public.control_group_bill(sid, bid, ballot, 'end_voting');
  s := public.control_group_bill(sid, bid, ballot, 'confirm');
  assert (s->>'sharedBalance')::numeric = 180 and (s->>'unpaidBillTotal')::numeric = 0;
  assert s->>'currentDay' = '14' and s->>'roundState' = 'results';
end
$$;
reset role;
rollback;
