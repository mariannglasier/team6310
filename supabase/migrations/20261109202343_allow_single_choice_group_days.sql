begin;

do $$
declare definition text;
begin
  definition := pg_get_functiondef(
    'group_private.control_session(uuid,text)'::regprocedure
  );
  definition := replace(
    definition,
    'and (select count(*) from public.choices c where c.scenario_id=q.scenario_id and c.version_id=s.version_id)>=2',
    'and (select count(*) from public.choices c where c.scenario_id=q.scenario_id and c.version_id=s.version_id)>=1'
  );
  execute definition;
end
$$;

commit;
