-- Run against a local database with published households and jobs.
begin;

insert into auth.users(id, is_anonymous) values
  ('63100000-0000-4000-8000-000000000091', true),
  ('63100000-0000-4000-8000-000000000092', true);

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000091","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
do $$
declare s jsonb;
begin
  s := public.configure_host_group_session(true, 60, true);
  assert s->>'sessionId' is not null;
  perform set_config('test.skill_session', s->>'sessionId', true);
  perform set_config('test.skill_code', s->>'joinCode', true);
end
$$;
reset role;

select set_config('request.jwt.claims', '{"sub":"63100000-0000-4000-8000-000000000092","is_anonymous":true,"role":"authenticated"}', true);
set local role authenticated;
select public.join_group_session(current_setting('test.skill_code'));
reset role;

-- Open a job round directly so deck coverage is independent of this test.
do $$
declare
  sid uuid := current_setting('test.skill_session')::uuid;
  edition uuid;
  household uuid;
  restricted_job uuid;
  open_job uuid;
begin
  select version_id into edition from public.group_sessions where session_id = sid;
  select p.persona_id, j.job_id into household, restricted_job
  from public.personas p
  join public.jobs j using (version_id)
  where p.version_id = edition and j.is_active and j.is_approved
    and p.has_english_skills is not null and p.has_computer_skills is not null
    and j.needs_english_skills is not null and j.needs_computer_skills is not null
    and ((j.needs_english_skills and not p.has_english_skills)
      or (j.needs_computer_skills and not p.has_computer_skills))
  order by p.persona_id, j.job_id limit 1;
  select job_id into open_job from public.jobs
  where version_id = edition and is_active and is_approved
    and not needs_english_skills and not needs_computer_skills
  order by job_id limit 1;
  assert household is not null and open_job is not null, 'Published skill fixtures are required';
  update public.group_sessions
  set selected_persona_id = household, round_type = 'job', round_state = 'voting',
      employment_stage = 'job', round_deadline = now() + interval '1 minute'
  where session_id = sid;
  perform set_config('test.restricted_job', restricted_job::text, true);
  perform set_config('test.open_job', open_job::text, true);
end
$$;

set local role authenticated;
do $$
declare
  sid uuid := current_setting('test.skill_session')::uuid;
  restricted_job uuid := current_setting('test.restricted_job')::uuid;
  open_job uuid := current_setting('test.open_job')::uuid;
  s jsonb;
begin
  s := public.get_group_session_state(sid);
  assert s->'jobs' @> jsonb_build_array(jsonb_build_object('jobId', open_job));
  assert not (s->'jobs' @> jsonb_build_array(jsonb_build_object('jobId', restricted_job)));
  assert public.submit_group_job_vote(sid, restricted_job)->>'error' = 'That job is not available.';
  assert public.submit_group_job_vote(sid, open_job)->>'selectedJobId' = open_job::text;
end
$$;
reset role;

update public.group_sessions
set employment_prepared = true, employment_attempt = 2,
    selected_job_id = current_setting('test.open_job')::uuid
where session_id = current_setting('test.skill_session')::uuid;

set local role authenticated;
do $$
declare
  sid uuid := current_setting('test.skill_session')::uuid;
  restricted_job uuid := current_setting('test.restricted_job')::uuid;
  open_job uuid := current_setting('test.open_job')::uuid;
  s jsonb;
begin
  s := public.get_group_session_state(sid);
  assert s->'jobs' @> jsonb_build_array(jsonb_build_object('jobId', restricted_job));
  assert not (s->'jobs' @> jsonb_build_array(jsonb_build_object('jobId', open_job)));
  assert s->>'voteCount' = '0', 'Old ineligible votes must not count';
  assert public.submit_group_job_vote(sid, open_job)->>'error' = 'That job is not available.';
  assert public.submit_group_job_vote(sid, restricted_job)->>'selectedJobId' = restricted_job::text;
end
$$;
reset role;
rollback;
