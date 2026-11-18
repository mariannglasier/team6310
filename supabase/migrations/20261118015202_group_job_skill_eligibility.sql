begin;

create function group_private.eligible_group_jobs(session_row public.group_sessions)
returns setof public.jobs
language sql
stable
set search_path = ''
as $$
  select j.*
  from public.jobs j
  join public.personas p on p.version_id = j.version_id
  where j.version_id = (session_row).version_id
    and p.persona_id = (session_row).selected_persona_id
    and j.is_active and j.is_approved
    and p.has_english_skills is not null and p.has_computer_skills is not null
    and j.needs_english_skills is not null and j.needs_computer_skills is not null
    and (not j.needs_english_skills or p.has_english_skills or (session_row).employment_prepared)
    and (not j.needs_computer_skills or p.has_computer_skills or (session_row).employment_prepared)
    and ((session_row).employment_attempt = 1 or j.job_id is distinct from (session_row).selected_job_id)
$$;

revoke all on function group_private.eligible_group_jobs(public.group_sessions)
  from public, anon, authenticated, service_role;

create or replace function group_private.read_session_state_month(p_session_id uuid)
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
        and job_id in (select job_id from group_private.eligible_group_jobs(s))
        group by job_id order by count(*) desc, job_id limit 1)
      else s.selected_job_id end,
    'voteCount', case when s.round_type = 'job' then
      (select count(*)::integer from public.group_job_votes where session_id = p_session_id
        and job_id in (select job_id from group_private.eligible_group_jobs(s)))
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
      from group_private.eligible_group_jobs(s) j
    ) else null end
  );
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
  if not exists (select 1 from group_private.eligible_group_jobs(s) j where j.job_id = p_job_id) then return jsonb_build_object('error','That job is not available.'); end if;
  insert into public.group_job_votes(session_id,participant_id,job_id) values(s.session_id,member_id,p_job_id)
  on conflict(session_id,participant_id) do update set job_id=excluded.job_id,updated_at=now();
  return group_private.read_session_state(p_session_id);
end
$$;

-- Keep the existing round transitions and exclude any old ineligible votes.
do $$
declare
  definition text := pg_get_functiondef('group_private.control_session(uuid,text)'::regprocedure);
  old_filter text := 'and (s.employment_attempt=1 or job_id<>s.selected_job_id)';
begin
  if strpos(definition, old_filter) = 0 then
    raise exception 'Group job winner eligibility filter not found';
  end if;
  execute replace(definition, old_filter,
    'and job_id in (select job_id from group_private.eligible_group_jobs(s))');
end
$$;

commit;
