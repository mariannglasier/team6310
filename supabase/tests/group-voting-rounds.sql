begin;
insert into auth.users(id, is_anonymous) values
  ('63100000-0000-4000-8000-000000000011', true),
  ('63100000-0000-4000-8000-000000000012', true);

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000011","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$ declare s jsonb; begin
  s := public.configure_host_group_session(true, 60, false);
  perform set_config('test.vote_session', s->>'sessionId', true);
  perform set_config('test.vote_code', s->>'joinCode', true);
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000012","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$ declare s jsonb; begin
  s := public.join_group_session(current_setting('test.vote_code'));
  assert s->>'participantId' is not null;
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000011","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$ begin
  begin
    perform public.control_group_session(current_setting('test.vote_session')::uuid, 'start');
    assert false, 'host must not start before all participants are ready';
  exception when check_violation then null;
  end;
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000012","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$ declare s jsonb; persona uuid; begin
  s := public.get_group_session_state(current_setting('test.vote_session')::uuid);
  select persona_id into persona from public.personas
    where version_id = (s->>'versionId')::uuid order by persona_id limit 1;
  assert persona is not null;
  s := public.update_group_participant_setup(
    current_setting('test.vote_session')::uuid, persona, true
  );
  assert (s->>'ready')::boolean;
  assert s->>'householdId' = persona::text;
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000011","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$ declare s jsonb; begin
  s := public.control_group_session(current_setting('test.vote_session')::uuid, 'start');
  assert s->>'roundState' = 'voting';
  assert s->>'roundType' = 'job';
  assert (s->>'currentDay')::integer = 0;
  assert (s->>'totalDayCount')::integer = 30;
  assert (s->>'totalQuestionCount')::integer = 30;
  assert (s->>'readyCount')::integer = 1;
  assert s->>'sharedHouseholdId' is not null;
  assert (s->>'sharedBalance')::numeric >= 0;
  assert jsonb_array_length(s->'participants') = 1;
  assert s->'participants'->0->>'alias' = 'Participant 01';
  assert jsonb_array_length(s->'jobs') >= 2;
  perform set_config('test.job_one', s->'jobs'->0->>'jobId', true);
  perform set_config('test.job_two', s->'jobs'->1->>'jobId', true);
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000012","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$ declare s jsonb; begin
  s := public.submit_group_job_vote(current_setting('test.vote_session')::uuid, current_setting('test.job_one')::uuid);
  assert s->>'selectedJobId' = current_setting('test.job_one');
  s := public.submit_group_job_vote(current_setting('test.vote_session')::uuid, current_setting('test.job_two')::uuid);
  assert s->>'selectedJobId' = current_setting('test.job_two');
  assert not has_table_privilege('authenticated', 'public.group_job_votes', 'SELECT');
  begin
    perform public.control_group_session(current_setting('test.vote_session')::uuid, 'end_voting');
    assert false, 'participant must not control voting';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000011","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$ declare s jsonb; begin
  s := public.control_group_session(current_setting('test.vote_session')::uuid, 'end_voting');
  assert s->>'roundState' = 'results';
  assert s->>'roundType' = 'job';
  assert (s->>'voteCount')::integer = 1;
  assert (select sum((x->>'voteCount')::integer) from jsonb_array_elements(s->'jobs') x) = 1;
  s := public.control_group_session(current_setting('test.vote_session')::uuid, 'next');
  assert s->>'roundState' = 'voting';
  assert s->>'roundType' = 'clothing';
  assert jsonb_array_length(s->'employmentOptions') = 2;
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000012","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$ declare s jsonb; begin
  s := public.submit_group_employment_vote(current_setting('test.vote_session')::uuid, 'current');
  assert s->>'selectedEmploymentOption' = 'current';
  assert not has_table_privilege('authenticated', 'public.group_employment_votes', 'SELECT');
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000011","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$ declare s jsonb; begin
  s := public.control_group_session(current_setting('test.vote_session')::uuid, 'end_voting');
  s := public.control_group_session(current_setting('test.vote_session')::uuid, 'next');
  assert s->>'employmentStage' = 'interview-result';
  assert not (s->>'interviewHired')::boolean;
  s := public.control_group_session(current_setting('test.vote_session')::uuid, 'next');
  assert s->>'roundType' = 'job';
  assert (s->>'employmentAttempt')::integer = 2;
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000012","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$ declare s jsonb; begin
  s := public.submit_group_job_vote(current_setting('test.vote_session')::uuid, current_setting('test.job_one')::uuid);
  assert s->>'selectedJobId' = current_setting('test.job_one');
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000011","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$ declare s jsonb; begin
  perform public.control_group_session(current_setting('test.vote_session')::uuid, 'end_voting');
  s := public.control_group_session(current_setting('test.vote_session')::uuid, 'next');
  assert s->>'roundType' = 'clothing';
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000012","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
select public.submit_group_employment_vote(current_setting('test.vote_session')::uuid, 'current');
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000011","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$ declare s jsonb; begin
  perform public.control_group_session(current_setting('test.vote_session')::uuid, 'end_voting');
  s := public.control_group_session(current_setting('test.vote_session')::uuid, 'next');
  assert (s->>'interviewHired')::boolean;
  s := public.control_group_session(current_setting('test.vote_session')::uuid, 'next');
  assert s->>'roundType' = 'scenario';
  assert (s->>'currentDay')::integer = 1;
  assert (s->>'weeklyIncome')::numeric > 0;
  assert jsonb_array_length(s->'question'->'choices') >= 2;
end $$;
reset role;
select 'PASS: protected group voting rounds' result;
rollback;
