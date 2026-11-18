-- Run against a local database with published content and the group migrations.
begin;
insert into auth.users(id, is_anonymous) values
  ('63100000-0000-4000-8000-000000000081', true),
  ('63100000-0000-4000-8000-000000000082', true),
  ('63100000-0000-4000-8000-000000000083', true);
select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000081","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$ declare s jsonb; begin
  s := public.configure_host_group_session(true, 60, false);
  assert s->>'sessionId' is not null;
  perform set_config('test.review_session', s->>'sessionId', true);
  perform set_config('test.review_code', s->>'joinCode', true);
  begin
    perform public.get_group_session_review((s->>'sessionId')::uuid);
    assert false, 'Active session reviews must be denied';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000082","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
select public.join_group_session(current_setting('test.review_code'));
reset role;
-- Fixture: a saved vote on Day 1; later days have no responses.
insert into public.group_session_questions(session_id, position, scenario_id)
select s.session_id, 1, q.scenario_id from public.group_sessions s
cross join lateral (select scenario_id from public.scenarios
  where version_id = s.version_id and exists (select 1 from public.choices c
    where c.scenario_id = scenarios.scenario_id) order by scenario_id limit 1) q
where s.session_id = current_setting('test.review_session')::uuid
on conflict do nothing;
insert into public.group_votes(session_id, scenario_id, participant_id, choice_id)
select q.session_id, q.scenario_id, gp.participant_id,
  (select choice_id from public.choices where scenario_id=q.scenario_id order by choice_id limit 1)
from public.group_session_questions q join public.group_participants gp using(session_id)
where q.session_id=current_setting('test.review_session')::uuid and q.position=1;
update public.group_sessions set status='closed', round_state='completed'
where session_id=current_setting('test.review_session')::uuid;
set local role authenticated;
do $$ declare r jsonb; begin
  r := public.get_group_session_review(current_setting('test.review_session')::uuid);
  assert jsonb_array_length(r)=1, 'Unanswered days must not be fabricated';
  assert r->0->>'selectedChoiceId' is not null, 'Own vote must be restored';
  assert (r->0->'choices'->0->>'voteCount')::integer=1;
  assert r = public.get_group_session_review(current_setting('test.review_session')::uuid), 'Reads must be repeatable';
end $$;
reset role;
select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000081","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$ declare r jsonb; fresh jsonb; begin
  r := public.get_group_session_review(current_setting('test.review_session')::uuid);
  assert jsonb_array_length(r)=1, 'Host must be allowed to review';
  assert r->0->>'selectedChoiceId' is null, 'Host must not inherit another participant vote';
  fresh := public.configure_host_group_session(true, 60, true);
  assert fresh->>'sessionId' <> current_setting('test.review_session'), 'Replay must create a distinct session';
  assert fresh->>'joinCode' <> current_setting('test.review_code'), 'Replay must use a fresh code';
  assert r = public.get_group_session_review(current_setting('test.review_session')::uuid), 'Replay must preserve previous votes';
  perform set_config('test.exit_session', fresh->>'sessionId', true);
  perform set_config('test.exit_code', fresh->>'joinCode', true);
end $$;
reset role;
select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000082","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$ begin
  assert public.join_group_session(current_setting('test.exit_code'))->>'sessionId'
    = current_setting('test.exit_session');
  begin
    perform public.control_group_session(current_setting('test.exit_session')::uuid, 'close');
    assert false, 'A participant cannot end the session';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
-- Exercise the same close action with an active, in-progress round.
update public.group_sessions set round_state='voting', current_question_number=8,
  round_deadline=now()+interval '1 minute'
where session_id=current_setting('test.exit_session')::uuid;
select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000081","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$ declare closed jsonb; fresh jsonb; begin
  closed := public.control_group_session(current_setting('test.exit_session')::uuid, 'close');
  assert closed->>'status' = 'closed';
  assert closed->>'endedByHost' = 'true';
  assert closed->>'currentDay' = '8';
  assert closed->>'roundDeadline' is null;
  fresh := public.configure_host_group_session(true, 60, false);
  assert fresh->>'roundState' = 'lobby';
  assert fresh->>'participantCount' = '0';
  assert fresh->>'joinCode' <> current_setting('test.exit_code');
end $$;
reset role;
select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000082","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$ begin
  assert public.get_group_session_state(current_setting('test.exit_session')::uuid)->>'endedByHost' = 'true';
  assert public.join_group_session(current_setting('test.exit_code'))->>'error' is not null;
end $$;
reset role;
select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000083","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$ begin
  begin
    perform public.get_group_session_review(current_setting('test.review_session')::uuid);
    assert false, 'Nonmembers must be denied';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims', '{}', true);
set local role anon;
do $$ begin
  begin
    perform public.get_group_session_review(current_setting('test.review_session')::uuid);
    assert false, 'Unauthenticated access must be denied';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
