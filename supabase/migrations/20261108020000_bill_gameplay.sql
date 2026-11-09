-- Bills Stage 2. Requires the reviewed Stage 1 foundation; no hosted auto-deploy.
BEGIN;
CREATE FUNCTION public.pay_bill(p_run_id uuid,p_occurrence_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.playthroughs%rowtype; b public.playthrough_expenses%rowtype; cost numeric;
BEGIN
 IF auth.uid() IS NULL OR coalesce((auth.jwt()->>'is_anonymous')::boolean,false) IS NOT TRUE THEN
   RAISE EXCEPTION 'Anonymous participant required'; END IF;
 SELECT * INTO r FROM public.playthroughs WHERE playthrough_id=p_run_id AND owner_user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND OR r.session_id IS NOT NULL THEN RAISE EXCEPTION 'Bills unavailable'; END IF;
 SELECT * INTO b FROM public.playthrough_expenses WHERE playthrough_expense_id=p_occurrence_id
   AND playthrough_id=r.playthrough_id AND version_id=r.version_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Bill unavailable'; END IF;
 IF b.paid_at IS NOT NULL THEN RETURN jsonb_build_object('run',to_jsonb(r),'bill',to_jsonb(b)); END IF;
 IF r.status IS DISTINCT FROM 'active' OR r.employment_state->>'stage' IS DISTINCT FROM 'day'
 OR r.current_day IS NULL OR r.current_day<b.due_day OR r.current_day>30
 OR r.current_balance IS NULL OR r.current_balance<0 OR r.current_balance>='Infinity'::numeric
 OR r.current_balance<>round(r.current_balance,2) THEN RAISE EXCEPTION 'Bill payment unavailable'; END IF;
 cost:=b.amount_due+CASE WHEN b.ignored_at IS NULL THEN 0 ELSE b.late_fee_amount END;
 IF r.current_balance<cost THEN RAISE EXCEPTION 'Insufficient funds to pay this bill in full'; END IF;
 UPDATE public.playthrough_expenses SET paid_at=clock_timestamp(),paid_day=r.current_day,
   payment_balance_after=r.current_balance-cost WHERE playthrough_expense_id=b.playthrough_expense_id RETURNING * INTO b;
 UPDATE public.playthroughs SET current_balance=current_balance-cost
   WHERE playthrough_id=r.playthrough_id RETURNING * INTO r;
 RETURN jsonb_build_object('run',to_jsonb(r),'bill',to_jsonb(b));
END $$;

CREATE FUNCTION public.ignore_bill(p_run_id uuid,p_occurrence_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.playthroughs%rowtype; b public.playthrough_expenses%rowtype;
BEGIN
 IF auth.uid() IS NULL OR coalesce((auth.jwt()->>'is_anonymous')::boolean,false) IS NOT TRUE THEN
   RAISE EXCEPTION 'Anonymous participant required'; END IF;
 SELECT * INTO r FROM public.playthroughs WHERE playthrough_id=p_run_id AND owner_user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND OR r.session_id IS NOT NULL THEN RAISE EXCEPTION 'Bills unavailable'; END IF;
 SELECT * INTO b FROM public.playthrough_expenses WHERE playthrough_expense_id=p_occurrence_id
   AND playthrough_id=r.playthrough_id AND version_id=r.version_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Bill unavailable'; END IF;
 IF b.ignored_at IS NOT NULL OR b.paid_at IS NOT NULL THEN
   RETURN jsonb_build_object('run',to_jsonb(r),'bill',to_jsonb(b)); END IF;
 IF r.status IS DISTINCT FROM 'active' OR r.employment_state->>'stage' IS DISTINCT FROM 'day'
 OR r.current_day IS DISTINCT FROM b.due_day THEN RAISE EXCEPTION 'Bill Ignore unavailable'; END IF;
 UPDATE public.playthrough_expenses SET ignored_at=clock_timestamp()
   WHERE playthrough_expense_id=b.playthrough_expense_id RETURNING * INTO b;
 RETURN jsonb_build_object('run',to_jsonb(r),'bill',to_jsonb(b));
END $$;

CREATE FUNCTION public.guard_bill_advancement() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF (NEW.current_day IS DISTINCT FROM OLD.current_day OR NEW.status='completed'
     OR NEW.employment_state->>'stage'='complete')
 AND EXISTS(SELECT 1 FROM public.playthrough_expenses WHERE playthrough_id=OLD.playthrough_id
   AND due_day<=OLD.current_day AND paid_at IS NULL AND ignored_at IS NULL) THEN
   RAISE EXCEPTION 'Pay or Ignore every due bill before continuing'; END IF;
 IF NEW.status='active' AND NEW.current_scenario_id IS NOT NULL
 AND EXISTS(SELECT 1 FROM public.playthrough_expenses WHERE playthrough_id=NEW.playthrough_id
   AND due_day=NEW.current_day) THEN RAISE EXCEPTION 'Bill and ordinary scenario schedule collision'; END IF;
 RETURN NEW;
END $$;
-- Runs after the existing scenario selector so newly selected collisions are seen.
CREATE TRIGGER z_bill_advancement BEFORE UPDATE ON public.playthroughs
 FOR EACH ROW EXECUTE FUNCTION public.guard_bill_advancement();

CREATE FUNCTION public.guard_scenario_bill_collision() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM 1 FROM public.content_versions WHERE version_id=NEW.version_id FOR SHARE;
 IF NEW.schedule_type='scheduled' AND NEW.default_day BETWEEN 1 AND 30
 AND EXISTS(SELECT 1 FROM public.persona_expenses e
   WHERE e.version_id=NEW.version_id AND e.persona_id=NEW.persona_intent
   AND e.first_due_day<=NEW.default_day
   AND ((e.repeat_interval_days IS NULL AND e.first_due_day=NEW.default_day)
     OR (e.repeat_interval_days IS NOT NULL AND (NEW.default_day-e.first_due_day)%e.repeat_interval_days=0))) THEN
   RAISE EXCEPTION 'Bill and ordinary scenario schedule collision'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER scenarios_guard_bill_collision BEFORE INSERT OR UPDATE ON public.scenarios
 FOR EACH ROW EXECUTE FUNCTION public.guard_scenario_bill_collision();

CREATE FUNCTION public.guard_bill_publication() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.status='published' AND EXISTS(
   SELECT 1 FROM public.persona_expenses e JOIN public.scenarios s
     ON s.version_id=e.version_id AND s.persona_intent=e.persona_id
   WHERE e.version_id=NEW.version_id AND s.schedule_type='scheduled' AND s.default_day BETWEEN 1 AND 30
     AND e.first_due_day<=s.default_day
     AND ((e.repeat_interval_days IS NULL AND e.first_due_day=s.default_day)
       OR (e.repeat_interval_days IS NOT NULL AND (s.default_day-e.first_due_day)%e.repeat_interval_days=0))
 ) THEN RAISE EXCEPTION 'Bill and ordinary scenario schedule collision'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER content_versions_guard_bill_publication BEFORE UPDATE ON public.content_versions
 FOR EACH ROW EXECUTE FUNCTION public.guard_bill_publication();

DO $$
DECLARE f regprocedure; owner_name name; x record; grantee_name name;
BEGIN
 SELECT r.rolname INTO owner_name FROM pg_class c JOIN pg_roles r ON r.oid=c.relowner
 WHERE c.oid='public.playthroughs'::regclass;
 FOREACH f IN ARRAY ARRAY['public.pay_bill(uuid,uuid)'::regprocedure,'public.ignore_bill(uuid,uuid)'::regprocedure,
 'public.guard_bill_advancement()'::regprocedure,'public.guard_scenario_bill_collision()'::regprocedure,
 'public.guard_bill_publication()'::regprocedure] LOOP
   EXECUTE format('ALTER FUNCTION %s OWNER TO %I',f,owner_name);
   EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',f);
   FOR x IN SELECT DISTINCT a.grantee FROM pg_proc p,
     LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
     WHERE p.oid=f AND a.grantee<>p.proowner AND a.grantee<>0 LOOP
     SELECT rolname INTO grantee_name FROM pg_roles WHERE oid=x.grantee;
     EXECUTE format('REVOKE ALL ON FUNCTION %s FROM %I CASCADE',f,grantee_name);
   END LOOP;
 END LOOP;
 GRANT EXECUTE ON FUNCTION public.pay_bill(uuid,uuid),public.ignore_bill(uuid,uuid) TO authenticated;
END $$;
COMMIT;
