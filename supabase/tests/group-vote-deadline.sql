-- Run against a disposable migrated database with published scenarios.
begin;

insert into auth.users(id, is_anonymous) values
  ('63100000-0000-4000-8000-000000000401', true),
  ('63100000-0000-4000-8000-000000000402', true);

select set_config('request.jwt.claims',
  '{"sub":"63100000-0000-4000-8000-000000000401","is_anonymous":true,"role":"authenticated"}', true);
select set_config('test.voting_session', session->>'sessionId', true),
       set_config('test.voting_code', session->>'joinCode', true)
from (select public.configure_host_group_session(true, 30, false) as session) fixture;

select set_config('request.jwt.claims',
  '{"sub":"63100000-0000-4000-8000-000000000402","is_anonymous":true,"role":"authenticated"}', true);
select public.join_group_session(current_setting('test.voting_code'));

do $$
declare
  sid uuid := current_setting('test.voting_session')::uuid;
  household uuid;
  choice public.choices;
begin
  select p.persona_id into household from public.personas p
  join public.group_sessions s using(version_id) where s.session_id = sid limit 1;
  select c.* into choice from public.choices c
  join public.group_sessions s using(version_id) where s.session_id = sid limit 1;
  assert choice.choice_id is not null and household is not null;
  perform public.update_group_participant_setup(sid, household, true);
  insert into public.group_session_questions(session_id, position, scenario_id)
  values (sid, 1, choice.scenario_id);
  update public.group_sessions set round_state='voting', round_type='scenario',
    current_question_number=1, current_scenario_id=choice.scenario_id,
    round_deadline=clock_timestamp()+interval '1 second'
  where session_id=sid;
  perform set_config('test.voting_choice', choice.choice_id::text, true);
end
$$;

set local role authenticated;
do $$
declare
  sid uuid := current_setting('test.voting_session')::uuid;
  choice uuid := current_setting('test.voting_choice')::uuid;
  state jsonb;
begin
  state := public.submit_group_vote(sid, choice);
  assert state->>'selectedChoiceId' = choice::text and state->>'voteCount' = '1';
  state := public.submit_group_vote(sid, choice);
  assert state->>'voteCount' = '1', 'Retry must count once';
  perform pg_sleep(1.1);
  state := public.get_group_session_state(sid);
  assert now() < (state->>'roundDeadline')::timestamptz, 'Transaction clock must still predate cutoff';
  assert clock_timestamp() >= (state->>'roundDeadline')::timestamptz, 'Wall clock must reach cutoff';
  assert state->>'acceptingVotes' = 'false' and state->>'roundState' = 'voting';
  assert state->'question'->'choices'->0->>'voteCount' is null, 'Totals must remain hidden';
  assert public.submit_group_vote(sid, choice)->>'error' like 'Voting has ended%';
  assert public.get_group_session_state(sid)->>'voteCount' = '1';
end
$$;
reset role;

select set_config('request.jwt.claims',
  '{"sub":"63100000-0000-4000-8000-000000000401","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$
declare state jsonb;
begin
  state := public.control_group_session(current_setting('test.voting_session')::uuid, 'end_voting');
  assert state->>'roundState' = 'results';
  assert (select sum((option->>'voteCount')::integer)
    from jsonb_array_elements(state->'question'->'choices') option) = 1;
end
$$;
reset role;
rollback;
