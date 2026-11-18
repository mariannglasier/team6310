begin;

alter table public.group_sessions
  add column last_payday integer,
  add constraint group_sessions_last_payday_valid
    check (last_payday in (7, 14, 21, 28));

-- Group interviews finish before Day 1. Day 7 is seven days after hiring.
-- The protected round transition already holds the session row lock.
create function group_private.credit_scheduled_paycheck()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'open' and new.status = 'open'
     and new.round_type = 'scenario' and new.round_state = 'voting'
     and new.current_question_number > old.current_question_number
     and new.current_question_number in (7, 14, 21, 28)
     and new.employment_stage = 'complete' and new.interview_hired is true
     and new.weekly_income > 0
     and new.current_question_number > coalesce(old.last_payday, 0) then
    new.shared_balance := new.shared_balance + new.weekly_income;
    new.last_payday := new.current_question_number;
  end if;
  return new;
end
$$;

create trigger group_sessions_credit_paycheck
before update of current_question_number on public.group_sessions
for each row execute function group_private.credit_scheduled_paycheck();

revoke all on function group_private.credit_scheduled_paycheck()
  from public, anon, authenticated, service_role;

do $$
declare
  definition text := pg_get_functiondef('group_private.read_session_state(uuid)'::regprocedure);
  old_field text := '''weeklyIncome'', s.weekly_income,';
begin
  if strpos(definition, old_field) = 0 then
    raise exception 'Group weekly income field not found';
  end if;
  execute replace(definition, old_field,
    old_field || ' ''lastPayday'', s.last_payday,');
end
$$;

commit;
