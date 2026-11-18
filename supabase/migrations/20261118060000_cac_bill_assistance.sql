BEGIN;

ALTER TABLE public.playthrough_expenses
  ADD COLUMN paid_with_cac boolean NOT NULL DEFAULT false,
  ADD CONSTRAINT cac_bill_payment_requires_settlement
    CHECK (NOT paid_with_cac OR paid_at IS NOT NULL);

CREATE FUNCTION public.pay_bill_with_cac(p_run_id uuid, p_occurrence_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  run public.playthroughs%ROWTYPE;
  bill public.playthrough_expenses%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT (
    coalesce((auth.jwt()->>'is_anonymous')::boolean, false) OR public.is_cac_staff()
  ) THEN
    RAISE EXCEPTION 'Participant authentication required';
  END IF;

  SELECT * INTO run FROM public.playthroughs
    WHERE playthrough_id = p_run_id AND owner_user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND OR run.session_id IS NOT NULL OR run.cac_support_enabledabled IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'CAC bill assistance unavailable';
  END IF;

  SELECT * INTO bill FROM public.playthrough_expenses
    WHERE playthrough_expense_id = p_occurrence_id
      AND playthrough_id = run.playthrough_id AND version_id = run.version_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bill unavailable';
  END IF;
  IF bill.paid_at IS NOT NULL THEN
    RETURN jsonb_build_object('run', to_jsonb(run), 'bill', to_jsonb(bill));
  END IF;
  IF run.status IS DISTINCT FROM 'active' OR run.employment_state->>'stage' IS DISTINCT FROM 'day'
    OR run.current_day IS NULL OR run.current_day NOT BETWEEN bill.due_day AND 30
    OR run.current_balance IS NULL OR run.current_balance < 0
    OR run.current_balance >= 'Infinity'::numeric
    OR run.current_balance <> round(run.current_balance, 2) THEN
    RAISE EXCEPTION 'Bill payment unavailable';
  END IF;

  UPDATE public.playthrough_expenses
    SET paid_at = clock_timestamp(), paid_day = run.current_day,
        payment_balance_after = run.current_balance, paid_with_cac = true
    WHERE playthrough_expense_id = bill.playthrough_expense_id
    RETURNING * INTO bill;

  UPDATE public.playthroughs
    SET employment_state = jsonb_set(employment_state, '{assistanceUsed}', 'true'::jsonb)
    WHERE playthrough_id = run.playthrough_id
    RETURNING * INTO run;

  RETURN jsonb_build_object('run', to_jsonb(run), 'bill', to_jsonb(bill));
END;
$function$;

REVOKE ALL ON FUNCTION public.pay_bill_with_cac(uuid, uuid) FROM PUBLIC;
DO $permissions$
DECLARE
  grantee name;
BEGIN
  FOR grantee IN
    SELECT roles.rolname
    FROM pg_proc p
    CROSS JOIN LATERAL aclexplode(p.proacl) acl
    JOIN pg_roles roles ON roles.oid = acl.grantee
    WHERE p.oid = 'public.pay_bill_with_cac(uuid,uuid)'::regprocedure
      AND acl.grantee <> p.proowner
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.pay_bill_with_cac(uuid, uuid) FROM %I CASCADE', grantee);
  END LOOP;
END;
$permissions$;
GRANT EXECUTE ON FUNCTION public.pay_bill_with_cac(uuid, uuid) TO authenticated;
NOTIFY pgrst, 'reload schema';

COMMIT;
