begin;

-- Vote handlers acquire the session row lock before checking the cutoff.
-- now() reflects transaction start, which can precede a lock wait.
do $$
declare
  target regprocedure;
  definition text;
begin
  foreach target in array array[
    'group_private.submit_vote(uuid,uuid)'::regprocedure,
    'group_private.submit_job_vote(uuid,uuid)'::regprocedure,
    'group_private.submit_employment_vote(uuid,text)'::regprocedure
  ] loop
    definition := pg_get_functiondef(target);
    if definition !~ 's\.round_deadline\s*<=\s*now\(\)' then
      raise exception 'Group vote deadline check not found in %', target;
    end if;
    execute regexp_replace(definition, 's\.round_deadline\s*<=\s*now\(\)',
      's.round_deadline is null or s.round_deadline <= clock_timestamp()');
  end loop;

  target := 'group_private.read_session_state_base(uuid)'::regprocedure;
  definition := pg_get_functiondef(target);
  if strpos(definition, 's.round_deadline > now()') = 0 then
    raise exception 'Group state deadline check not found in %', target;
  end if;
  execute replace(definition, 's.round_deadline > now()', 's.round_deadline > clock_timestamp()');

  target := 'group_private.control_session(uuid,text)'::regprocedure;
  definition := pg_get_functiondef(target);
  if strpos(definition, 'now()+make_interval(secs=>decision_duration_seconds)') = 0 then
    raise exception 'Group round opening clock not found in %', target;
  end if;
  execute replace(definition, 'now()+make_interval(secs=>decision_duration_seconds)',
    'clock_timestamp()+make_interval(secs=>decision_duration_seconds)');
end
$$;

commit;
