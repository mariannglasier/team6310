begin;

-- Return the same edition-pinned amount that group advancement applies.
do $$
declare
  definition text;
  choice_field constant text := '''choiceId'', c.choice_id,';
  price_field constant text := '''balanceChange'', c.balance_change,';
  target regprocedure;
begin
  foreach target in array array[
    'group_private.read_session_state_base(uuid)'::regprocedure,
    'group_private.read_session_review(uuid)'::regprocedure
  ] loop
    definition := pg_get_functiondef(target);
    if strpos(definition, choice_field) = 0 then
      raise exception 'Choice payload integration point not found in %', target;
    end if;
    execute replace(definition, choice_field, choice_field || ' ' || price_field);
  end loop;
end
$$;

commit;
