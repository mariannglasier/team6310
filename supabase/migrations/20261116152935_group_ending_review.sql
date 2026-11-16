begin;

-- Read-only debrief. Reuse the existing anonymous host/member authorization.
create function group_private.read_session_review(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare state jsonb; result jsonb;
begin
  state := group_private.read_session_state(p_session_id);
  if state ? 'error' then
    raise exception 'Session unavailable' using errcode = '42501';
  end if;
  if state->>'roundState' <> 'completed' then
    raise exception 'Session has not ended' using errcode = '42501';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'day', q.position, 'scenarioId', q.scenario_id, 'title', s.title,
    'selectedChoiceId', (select v.choice_id from public.group_votes v
      where v.session_id = q.session_id and v.scenario_id = q.scenario_id
        and v.participant_id = (state->>'participantId')::uuid),
    'choices', (select jsonb_agg(jsonb_build_object(
      'choiceId', c.choice_id, 'text', c.choice_text,
      'voteCount', (select count(*) from public.group_votes v
        where v.session_id = q.session_id and v.scenario_id = q.scenario_id
          and v.choice_id = c.choice_id)
    ) order by c.choice_id) from public.choices c
      where c.scenario_id = q.scenario_id and c.version_id = s.version_id)
  ) order by q.position), '[]'::jsonb) into result
  from public.group_session_questions q
  join public.scenarios s on s.scenario_id = q.scenario_id
  where q.session_id = p_session_id and exists (
    select 1 from public.group_votes v
    where v.session_id = q.session_id and v.scenario_id = q.scenario_id
  );
  return result;
end
$$;

create function public.get_group_session_review(p_session_id uuid)
returns jsonb language sql security invoker set search_path = ''
as $$ select group_private.read_session_review(p_session_id) $$;

revoke all on function group_private.read_session_review(uuid),
  public.get_group_session_review(uuid) from public, anon, authenticated, service_role;
grant execute on function group_private.read_session_review(uuid),
  public.get_group_session_review(uuid) to authenticated;

commit;
