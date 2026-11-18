begin;

-- Attach only verified copy for the pinned question after tallies are revealed.
-- The existing state reader has already authorized the caller as host or member.
do $$
declare
  definition text := pg_get_functiondef('group_private.read_session_state(uuid)'::regprocedure);
  anchor constant text := '''cacSupportEnabled'', s.cac_support_enabled,';
begin
  if strpos(definition, anchor) = 0 then
    raise exception 'Group result fact integration point not found';
  end if;
  execute replace(definition, anchor, anchor || $facts$
    'roundFacts', case when s.round_state = 'results' and s.round_type = 'scenario'
      and s.active_bill_id is null and s.current_scenario_id is not null then coalesce((
        select jsonb_agg(jsonb_build_object(
          'role', f.fact_role, 'text', f.display_text,
          'sourceUrl', f.source_url, 'copyKind', f.copy_kind
        ) order by f.fact_role desc)
        from public.scenario_fact_copy f
        where f.scenario_id = s.current_scenario_id and f.version_id = s.version_id
          and f.verified and (f.fact_role = 'general' or s.cac_support_enabled)
      ), '[]'::jsonb) else '[]'::jsonb end,$facts$);
end
$$;

commit;
