begin;

do $$
declare
  definition text := pg_get_functiondef('group_private.bill_snapshot(public.group_sessions)'::regprocedure);
  old_field constant text := '''isBillDay'', exists';
begin
  if strpos(definition, old_field) = 0 then
    raise exception 'Group upcoming expense integration point not found';
  end if;
  execute replace(definition, old_field, $upcoming$
    'upcomingBills', coalesce((
      select jsonb_agg(jsonb_build_object(
        'billId', b.bill_id, 'name', b.name, 'amount', b.principal, 'dueDay', b.due_day
      ) order by b.due_day, b.name, b.bill_id)
      from (
        select bill_id, name, principal, due_day
        from group_private.bill_occurrences
        where session_id = s.session_id and due_day >= s.current_question_number
          and paid_day is null and ignored_at is null
        order by due_day, name, bill_id
        limit 3
      ) b
    ), '[]'::jsonb),
    'isBillDay', exists$upcoming$);
end
$$;

commit;
