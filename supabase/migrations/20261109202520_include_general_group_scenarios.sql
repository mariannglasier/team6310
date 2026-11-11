begin;

do $$
declare definition text;
begin
  definition := pg_get_functiondef(
    'group_private.control_session(uuid,text)'::regprocedure
  );
  definition := replace(
    definition,
    'from public.scenarios q where q.version_id=s.version_id and q.persona_intent=winner_persona',
    'from public.scenarios q where q.version_id=s.version_id and (q.persona_intent=winner_persona or q.persona_intent is null)'
  );
  execute definition;
end
$$;

commit;
