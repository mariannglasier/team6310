-- User decision: no more than six independent bill occurrences in a new run.
BEGIN;
CREATE FUNCTION public.capped_bill_schedule(p_persona uuid,p_version uuid)
RETURNS TABLE(expense_id uuid,due_day integer,amount numeric,version_id uuid,name text,late_fee_amount numeric)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 WITH occurrences AS (
  SELECT e.expense_id,d.day AS due_day,e.amount,e.version_id,e.name,e.late_fee_amount,
   row_number() OVER(ORDER BY CASE WHEN m.library_key='D006' THEN 0 ELSE 1 END,d.day,e.expense_id) AS priority
  FROM public.persona_expenses e
  CROSS JOIN LATERAL generate_series(e.first_due_day::integer,30,coalesce(e.repeat_interval_days::integer,31)) d(day)
  LEFT JOIN public.scenario_bill_links l ON l.expense_id=e.expense_id AND l.version_id=e.version_id
  LEFT JOIN public.scenario_library_metadata m ON m.scenario_id=l.scenario_id AND m.version_id=l.version_id
  WHERE e.persona_id=p_persona AND e.version_id=p_version
 ), remaining AS (
  SELECT o.*,row_number() OVER(ORDER BY due_day,expense_id) AS position,count(*) OVER() AS total
  FROM occurrences o WHERE priority<>1
 )
 SELECT expense_id,due_day,amount,version_id,name,late_fee_amount FROM occurrences WHERE priority=1
 UNION ALL
 SELECT expense_id,due_day,amount,version_id,name,late_fee_amount FROM remaining
 WHERE total<=5 OR position IN (SELECT 1+round(i*(total-1)/4.0)::bigint FROM generate_series(0,4) i);
$$;
REVOKE ALL ON FUNCTION public.capped_bill_schedule(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.capped_bill_schedule(uuid,uuid) TO service_role;

-- Keep the installed ownership/authentication guards and replace only scheduling.
DO $migration$
DECLARE definition text; original text := $old$SELECT NEW.playthrough_id,e.expense_id,d.day,e.amount,e.version_id,e.name,e.late_fee_amount
 FROM public.persona_expenses e
 CROSS JOIN LATERAL generate_series(e.first_due_day::integer,30,
   coalesce(e.repeat_interval_days::integer,31)) d(day)
 WHERE e.persona_id=NEW.persona_id AND e.version_id=NEW.version_id;$old$;
BEGIN
 definition:=pg_get_functiondef('public.initialize_fresh_bill_schedule()'::regprocedure);
 IF position(original in definition)=0 THEN RAISE EXCEPTION 'Review changed bill initializer before applying cap'; END IF;
 EXECUTE replace(definition,original,$new$SELECT NEW.playthrough_id,e.expense_id,e.due_day,e.amount,e.version_id,e.name,e.late_fee_amount
 FROM public.capped_bill_schedule(NEW.persona_id,NEW.version_id) e;$new$);
END $migration$;
COMMIT;
