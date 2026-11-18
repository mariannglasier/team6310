begin;

-- Group paid preparation charges the existing edition's fee. Individual play
-- continues to use its edition's original net choice effect.
create function group_private.choice_balance_change(c public.choices)
returns numeric language sql stable set search_path = '' as $$
  select case
    when c.choice_text = 'Pay someone to prepare taxes'
      and exists (select 1 from public.scenarios q
        where q.scenario_id = c.scenario_id and q.version_id = c.version_id
          and q.title = 'Time to file taxes')
    then -c.upfront_cost
    else c.balance_change
  end
$$;

revoke all on function group_private.choice_balance_change(public.choices)
  from public, anon, authenticated, service_role;

do $$
declare
  definition text;
  target regprocedure;
  old_amount constant text := 'coalesce(winning_choice.balance_change,0)';
  old_price constant text := '''balanceChange'', c.balance_change,';
begin
  definition := pg_get_functiondef('group_private.control_session(uuid,text)'::regprocedure);
  if strpos(definition, old_amount) = 0 then
    raise exception 'Group choice settlement integration point not found';
  end if;
  execute replace(definition, old_amount,
    'coalesce(group_private.choice_balance_change(winning_choice),0)');

  foreach target in array array[
    'group_private.read_session_state_base(uuid)'::regprocedure,
    'group_private.read_session_review(uuid)'::regprocedure
  ] loop
    definition := pg_get_functiondef(target);
    if strpos(definition, old_price) = 0 then
      raise exception 'Group choice price integration point not found in %', target;
    end if;
    execute replace(definition, old_price,
      '''balanceChange'', group_private.choice_balance_change(c), ''upfrontCost'', c.upfront_cost,');
  end loop;
end
$$;

commit;
