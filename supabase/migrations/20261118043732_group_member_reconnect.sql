begin;

do $$
declare
  definition text := pg_get_functiondef('group_private.join_session(text)'::regprocedure);
  enrollment_start integer := strpos(definition, '  insert into public.group_participants(session_id, user_id)');
  member_lookup_end constant text := 'where session_id = s.session_id and user_id = u;';
  enrollment_end integer;
begin
  enrollment_end := strpos(substr(definition, enrollment_start), member_lookup_end);
  if enrollment_start = 0 or enrollment_end = 0 then
    raise exception 'Group enrollment integration point not found';
  end if;
  execute overlay(definition placing $new$  select participant_id into member_id
  from public.group_participants
  where session_id = s.session_id and user_id = u;

  if member_id is null then
    if s.round_state <> 'lobby' then
      return jsonb_build_object('error', 'This session has already started. Ask your facilitator for the next session code.');
    end if;
    insert into public.group_participants(session_id, user_id)
    values (s.session_id, u)
    returning participant_id into member_id;
  end if;$new$
    from enrollment_start for enrollment_end + length(member_lookup_end) - 1);
end
$$;

commit;
