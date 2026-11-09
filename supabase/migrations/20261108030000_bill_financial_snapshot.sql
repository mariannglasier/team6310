-- Bills Stage 3. One read-only statement/MVCC snapshot; existing scenario storage unchanged.
BEGIN;
CREATE FUNCTION public.get_bill_snapshot(p_run_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT jsonb_build_object('run',to_jsonb(p),'bills',b.items,'paid_total',b.paid_total,
   'overdue_total',b.overdue_total,'outstanding_total',b.outstanding_total,
   'upcoming_total',b.upcoming_total,'scenario_income',s.income,'scenario_charged',s.charged)
 FROM public.playthroughs p
 CROSS JOIN LATERAL (
   SELECT coalesce(jsonb_agg(to_jsonb(e) ORDER BY e.due_day,e.playthrough_expense_id),'[]'::jsonb) items,
     coalesce(sum(CASE WHEN e.paid_at IS NOT NULL THEN e.amount_due+
       CASE WHEN e.ignored_at IS NULL THEN 0 ELSE e.late_fee_amount END ELSE 0 END),0) paid_total,
     coalesce(sum(CASE WHEN e.paid_at IS NULL AND e.ignored_at IS NOT NULL
       THEN e.amount_due+e.late_fee_amount ELSE 0 END),0) overdue_total,
     coalesce(sum(CASE WHEN e.paid_at IS NULL AND e.due_day<=p.current_day THEN e.amount_due+
       CASE WHEN e.ignored_at IS NULL THEN 0 ELSE e.late_fee_amount END ELSE 0 END),0) outstanding_total,
     coalesce(sum(CASE WHEN e.paid_at IS NULL AND e.due_day>p.current_day THEN e.amount_due ELSE 0 END),0) upcoming_total
   FROM public.playthrough_expenses e WHERE e.playthrough_id=p.playthrough_id AND e.version_id=p.version_id
 ) b
 CROSS JOIN LATERAL (
   SELECT coalesce(sum(greatest(pr.balance_change_applied,0)),0) income,
     coalesce(sum(greatest(-pr.balance_change_applied,0)),0) charged
   FROM public.player_responses pr WHERE pr.playthrough_id=p.playthrough_id AND pr.version_id=p.version_id
 ) s
 WHERE p.playthrough_id=p_run_id AND p.owner_user_id=auth.uid() AND p.session_id IS NULL
   AND coalesce((auth.jwt()->>'is_anonymous')::boolean,false);
$$;
-- Invoker/RLS read only; strip default grants before exposing the one operation.
DO $$
DECLARE x record; grantee_name name; owner_name name;
BEGIN
 SELECT r.rolname INTO owner_name FROM pg_class c JOIN pg_roles r ON r.oid=c.relowner
 WHERE c.oid='public.playthroughs'::regclass;
 EXECUTE format('ALTER FUNCTION public.get_bill_snapshot(uuid) OWNER TO %I',owner_name);
 REVOKE ALL ON FUNCTION public.get_bill_snapshot(uuid) FROM PUBLIC;
 FOR x IN SELECT DISTINCT a.grantee FROM pg_proc p,
   LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
   WHERE p.oid='public.get_bill_snapshot(uuid)'::regprocedure AND a.grantee<>p.proowner AND a.grantee<>0 LOOP
   SELECT rolname INTO grantee_name FROM pg_roles WHERE oid=x.grantee;
   EXECUTE format('REVOKE ALL ON FUNCTION public.get_bill_snapshot(uuid) FROM %I CASCADE',grantee_name);
 END LOOP;
 GRANT EXECUTE ON FUNCTION public.get_bill_snapshot(uuid) TO authenticated;
END $$;
COMMIT;
