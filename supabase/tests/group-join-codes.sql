-- Run against a disposable database with the migrations and published content.
-- All changes roll back. Fixture UUIDs are reserved for this test.
begin;

insert into auth.users(id, is_anonymous)
values
  ('63100000-0000-4000-8000-000000000001', true),
  ('63100000-0000-4000-8000-000000000002', true),
  ('63100000-0000-4000-8000-000000000003', true);

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000001","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$
declare a jsonb; question_id uuid;
begin
  a := public.configure_host_group_session(true, 90);
  assert a->>'sessionId' is not null;
  assert a->>'status' = 'open';
  assert a->>'decisionDurationSeconds' = '90';
  assert a->>'participantCount' = '0';
  assert a->>'participantId' is null;
  assert (a->>'isHost')::boolean;
  assert public.configure_host_group_session(true, 120) = a;
  assert public.configure_host_group_session(false, 60) = a;
  assert public.configure_host_group_session(true, 45)->>'error' is not null;

  select scenario_id into question_id
  from public.scenarios
  where version_id = (a->>'versionId')::uuid
  order by scenario_id limit 1;
  assert question_id is not null;

  perform set_config('test.group_id', a->>'sessionId', true);
  perform set_config('test.group_code', a->>'joinCode', true);
  perform set_config('test.question_id', question_id::text, true);
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000002","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$
declare a jsonb; again jsonb;
begin
  assert public.configure_host_group_session(false, 60) is null;
  assert public.join_group_session('INVALID')->>'error' is not null;
  a := public.join_group_session(lower(current_setting('test.group_code')));
  again := public.join_group_session(current_setting('test.group_code'));
  assert a->>'sessionId' = current_setting('test.group_id');
  assert a->>'participantId' is not null;
  assert a->>'participantId' = again->>'participantId';
  assert not (a->>'isHost')::boolean;
  assert public.get_group_session_state(current_setting('test.group_id')::uuid)->>'participantId' = a->>'participantId';

  begin
    perform public.update_group_session_state(current_setting('test.group_id')::uuid, 'open', current_setting('test.question_id')::uuid);
    assert false, 'participant must not update session state';
  exception when insufficient_privilege then null;
  end;

  assert (select count(*) from public.group_participants) = 1;
  assert not has_table_privilege('authenticated', 'public.group_sessions', 'INSERT');
  assert not has_table_privilege('authenticated', 'public.group_participants', 'INSERT');
  assert not has_function_privilege('anon', 'public.configure_host_group_session(boolean,integer)', 'EXECUTE');
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000001","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$
declare a jsonb;
begin
  a := public.update_group_session_state(current_setting('test.group_id')::uuid, 'closed', current_setting('test.question_id')::uuid);
  assert a->>'status' = 'closed';
  assert a->>'currentScenarioId' = current_setting('test.question_id');
  assert public.update_group_session_state(current_setting('test.group_id')::uuid, 'closed', current_setting('test.question_id')::uuid) = a;
  assert public.update_group_session_state(current_setting('test.group_id')::uuid, 'open', current_setting('test.question_id')::uuid)->>'error' = 'This session is closed.';
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000003","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  assert public.join_group_session(current_setting('test.group_code'))->>'error' is not null;
  begin
    perform public.get_group_session_state(current_setting('test.group_id')::uuid);
    assert false, 'non-member must not retrieve session state';
  exception when insufficient_privilege then null;
  end;

  for i in 1..11 loop perform public.join_group_session('INVALID'); end loop;
  assert public.join_group_session('INVALID')->>'error' like 'Too many attempts%';
end $$;
reset role;

select 'PASS: group state and anonymous participant access' result;
rollback;
