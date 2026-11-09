-- Bills Stage 1 only. Prepared for review; not authorization to deploy hosted SQL.
-- Development revision: initialization is atomic; no compatibility marker is stored.
-- Earlier local installations require the explicit development refresh described in docs/bills-system.md.
BEGIN;

-- Fail rather than silently reinterpret records created since the read-only review.
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM public.persona_expenses)
 OR EXISTS (SELECT 1 FROM public.playthrough_expenses) THEN
   RAISE EXCEPTION 'Bill foundation requires empty expense tables; review existing data without backfilling';
 END IF;
END $$;

ALTER TABLE public.playthroughs
 ADD CONSTRAINT playthroughs_bill_edition_key UNIQUE (playthrough_id,version_id);

-- Keep numeric unconstrained by typmod so CHECK rejects, rather than rounds,
-- sub-cent input. The range matches numeric(12,2).
ALTER TABLE public.persona_expenses
 ADD COLUMN late_fee_amount numeric NOT NULL,
 ALTER COLUMN persona_id DROP DEFAULT,
 ALTER COLUMN version_id DROP DEFAULT,
 ALTER COLUMN version_id SET NOT NULL,
 ALTER COLUMN name SET NOT NULL,
 ALTER COLUMN amount SET NOT NULL,
 ALTER COLUMN first_due_day SET NOT NULL,
 ADD CONSTRAINT persona_expenses_bill_edition_key UNIQUE (expense_id,version_id),
 ADD CONSTRAINT persona_expenses_bill_name CHECK (length(btrim(name))>0),
 ADD CONSTRAINT persona_expenses_bill_money CHECK (
   amount>=0 AND amount<10000000000 AND amount=round(amount,2)
   AND late_fee_amount>=0 AND late_fee_amount<10000000000
   AND late_fee_amount=round(late_fee_amount,2)),
 ADD CONSTRAINT persona_expenses_bill_schedule CHECK (
   first_due_day>=1 AND (repeat_interval_days IS NULL OR repeat_interval_days>0));

ALTER TABLE public.playthrough_expenses
 ADD COLUMN name_snapshot text NOT NULL,
 ADD COLUMN late_fee_amount numeric NOT NULL,
 ADD COLUMN ignored_at timestamptz,
 ADD COLUMN paid_day smallint,
 ADD COLUMN payment_balance_after numeric,
 ALTER COLUMN playthrough_id DROP DEFAULT,
 ALTER COLUMN expense_id DROP DEFAULT,
 ALTER COLUMN version_id DROP DEFAULT,
 ALTER COLUMN expense_id SET NOT NULL,
 ALTER COLUMN version_id SET NOT NULL,
 ALTER COLUMN due_day SET NOT NULL,
 ALTER COLUMN amount_due SET NOT NULL,
 ADD CONSTRAINT playthrough_expenses_bill_occurrence_key UNIQUE (playthrough_id,expense_id,due_day),
 ADD CONSTRAINT playthrough_expenses_bill_run_edition_fk
   FOREIGN KEY (playthrough_id,version_id) REFERENCES public.playthroughs(playthrough_id,version_id),
 ADD CONSTRAINT playthrough_expenses_bill_definition_edition_fk
   FOREIGN KEY (expense_id,version_id) REFERENCES public.persona_expenses(expense_id,version_id),
 ADD CONSTRAINT playthrough_expenses_bill_snapshot CHECK (
   length(btrim(name_snapshot))>0 AND due_day BETWEEN 1 AND 30
   AND amount_due>=0 AND amount_due<10000000000 AND amount_due=round(amount_due,2)
   AND late_fee_amount>=0 AND late_fee_amount<10000000000
   AND late_fee_amount=round(late_fee_amount,2)),
 ADD CONSTRAINT playthrough_expenses_bill_payment CHECK (
   (paid_at IS NULL AND paid_day IS NULL AND payment_balance_after IS NULL)
   OR (paid_at IS NOT NULL AND paid_day IS NOT NULL AND payment_balance_after IS NOT NULL
     AND paid_day BETWEEN due_day AND 30
     AND payment_balance_after>=0 AND payment_balance_after<'Infinity'::numeric
     AND payment_balance_after=round(payment_balance_after,2)
     AND (ignored_at IS NULL OR ignored_at<=paid_at)));

CREATE INDEX playthrough_expenses_bill_unpaid_idx
 ON public.playthrough_expenses(playthrough_id,due_day) WHERE paid_at IS NULL;
CREATE INDEX persona_expenses_bill_persona_edition_idx
 ON public.persona_expenses(persona_id,version_id);

-- Definitions are authored in drafts. Published definitions cannot be inserted,
-- changed or removed, and persona/edition mismatches never become content.
CREATE FUNCTION public.guard_bill_definition() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE edition uuid;
BEGIN
 IF TG_OP<>'INSERT' THEN
   PERFORM 1 FROM public.content_versions WHERE version_id=OLD.version_id FOR SHARE;
   IF EXISTS(SELECT 1 FROM public.content_versions WHERE version_id=OLD.version_id
      AND published_at IS NOT NULL) THEN RAISE EXCEPTION 'Published bill definitions are immutable'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 edition:=NEW.version_id;
 PERFORM 1 FROM public.content_versions WHERE version_id=edition FOR SHARE;
 IF NOT EXISTS(SELECT 1 FROM public.content_versions WHERE version_id=edition
   AND status='draft' AND published_at IS NULL) THEN RAISE EXCEPTION 'Bill definitions require a draft edition'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.personas WHERE persona_id=NEW.persona_id
   AND version_id=edition) THEN RAISE EXCEPTION 'Bill persona edition mismatch'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER persona_expenses_guard_bill_definition
 BEFORE INSERT OR UPDATE OR DELETE ON public.persona_expenses
 FOR EACH ROW EXECUTE FUNCTION public.guard_bill_definition();

CREATE FUNCTION public.guard_bill_occurrence_snapshot() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF ROW(NEW.playthrough_expense_id,NEW.playthrough_id,NEW.expense_id,NEW.version_id,
   NEW.due_day,NEW.amount_due,NEW.name_snapshot,NEW.late_fee_amount)
 IS DISTINCT FROM ROW(OLD.playthrough_expense_id,OLD.playthrough_id,OLD.expense_id,OLD.version_id,
   OLD.due_day,OLD.amount_due,OLD.name_snapshot,OLD.late_fee_amount) THEN
   RAISE EXCEPTION 'Bill occurrence snapshots are immutable';
 END IF;
 IF OLD.ignored_at IS NOT NULL AND NEW.ignored_at IS DISTINCT FROM OLD.ignored_at THEN
   RAISE EXCEPTION 'Bill Ignore history is immutable';
 END IF;
 IF OLD.paid_at IS NOT NULL AND ROW(NEW.paid_at,NEW.paid_day,NEW.payment_balance_after,NEW.ignored_at)
 IS DISTINCT FROM ROW(OLD.paid_at,OLD.paid_day,OLD.payment_balance_after,OLD.ignored_at) THEN
   RAISE EXCEPTION 'Bill payment history is immutable';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER playthrough_expenses_guard_bill_snapshot
 BEFORE UPDATE ON public.playthrough_expenses
 FOR EACH ROW EXECUTE FUNCTION public.guard_bill_occurrence_snapshot();

CREATE FUNCTION public.initialize_fresh_bill_schedule() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 -- NEW is the original insert tuple: independent of the employment AFTER INSERT
 -- trigger's update and of alphabetical AFTER INSERT trigger ordering.
 IF auth.uid() IS NULL OR NEW.owner_user_id IS DISTINCT FROM auth.uid()
 OR coalesce((auth.jwt()->>'is_anonymous')::boolean,false) IS NOT TRUE
 OR NEW.started_at IS NULL OR NEW.status IS DISTINCT FROM 'active'
 OR NEW.current_day IS DISTINCT FROM 1 OR NEW.session_id IS NOT NULL
 OR NEW.employment_state IS NOT NULL OR NEW.current_job_id IS NOT NULL
 OR NEW.current_scenario_id IS NOT NULL OR NEW.cac_support_enabledabled IS NOT NULL THEN
   RAISE EXCEPTION 'Fresh anonymous individual playthrough required';
 END IF;
 PERFORM 1 FROM public.content_versions WHERE version_id=NEW.version_id FOR SHARE;
 IF NOT EXISTS(SELECT 1 FROM public.personas p JOIN public.content_versions v USING(version_id)
   WHERE p.persona_id=NEW.persona_id AND p.version_id=NEW.version_id
   AND v.status='published' AND v.published_at IS NOT NULL
   AND NEW.current_balance=coalesce(p.general_starting_balance,0)) THEN
   RAISE EXCEPTION 'Published persona and valid starting balance required'; END IF;
 PERFORM 1 FROM public.playthroughs WHERE playthrough_id=NEW.playthrough_id FOR UPDATE;
 IF EXISTS (
   SELECT 1 FROM public.persona_expenses e
   CROSS JOIN LATERAL generate_series(e.first_due_day::integer,30,
     coalesce(e.repeat_interval_days::integer,31)) d(day)
   JOIN public.scenarios s ON s.version_id=e.version_id AND s.persona_intent=e.persona_id
     AND s.schedule_type='scheduled' AND s.default_day=d.day
   WHERE e.persona_id=NEW.persona_id AND e.version_id=NEW.version_id
 ) THEN RAISE EXCEPTION 'Bill and ordinary scenario schedule collision'; END IF;
 INSERT INTO public.playthrough_expenses(playthrough_id,expense_id,due_day,amount_due,
   version_id,name_snapshot,late_fee_amount)
 SELECT NEW.playthrough_id,e.expense_id,d.day,e.amount,e.version_id,e.name,e.late_fee_amount
 FROM public.persona_expenses e
 CROSS JOIN LATERAL generate_series(e.first_due_day::integer,30,
   coalesce(e.repeat_interval_days::integer,31)) d(day)
 WHERE e.persona_id=NEW.persona_id AND e.version_id=NEW.version_id;
 RETURN NEW;
END $$;
CREATE TRIGGER initialize_fresh_bill_schedule AFTER INSERT ON public.playthroughs
 FOR EACH ROW EXECUTE FUNCTION public.initialize_fresh_bill_schedule();

-- Match the existing employment security pattern: reviewed table owner, no
-- inherited creation-default EXECUTE grants, no client-callable initializer.
DO $$
DECLARE owner_name name; f regprocedure; grant_row record; grantee_name name;
BEGIN
 SELECT r.rolname INTO owner_name FROM pg_class c JOIN pg_roles r ON r.oid=c.relowner
 WHERE c.oid='public.playthroughs'::regclass;
 IF EXISTS(SELECT 1 FROM pg_class WHERE oid IN ('public.playthroughs'::regclass,
   'public.persona_expenses'::regclass,'public.playthrough_expenses'::regclass)
   AND (NOT relrowsecurity OR relforcerowsecurity)) THEN
   RAISE EXCEPTION 'Review required: bill tables must enable RLS without FORCE RLS';
 END IF;
 IF NOT has_table_privilege(owner_name,'public.playthroughs','SELECT')
 OR NOT has_table_privilege(owner_name,'public.playthroughs','UPDATE')
 OR NOT has_table_privilege(owner_name,'public.playthrough_expenses','INSERT')
 OR NOT has_table_privilege(owner_name,'public.persona_expenses','SELECT')
 OR NOT has_table_privilege(owner_name,'public.content_versions','SELECT')
 OR NOT has_table_privilege(owner_name,'public.personas','SELECT')
 OR NOT has_table_privilege(owner_name,'public.scenarios','SELECT') THEN
   RAISE EXCEPTION 'Review required: bill function owner lacks necessary table privileges';
 END IF;
 -- Do not accidentally initialize an empty schedule because the elevated
 -- function owner cannot see source rows through another owner's RLS.
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_roles r ON r.rolname=owner_name
   WHERE c.oid IN ('public.persona_expenses'::regclass,'public.playthrough_expenses'::regclass,
     'public.personas'::regclass,'public.content_versions'::regclass,'public.scenarios'::regclass)
   AND c.relrowsecurity AND c.relowner<>r.oid AND NOT r.rolsuper AND NOT r.rolbypassrls) THEN
   RAISE EXCEPTION 'Review required: bill owner needs unfiltered source and occurrence access';
 END IF;
 FOREACH f IN ARRAY ARRAY['public.guard_bill_definition()'::regprocedure,
   'public.guard_bill_occurrence_snapshot()'::regprocedure,
   'public.initialize_fresh_bill_schedule()'::regprocedure] LOOP
   EXECUTE format('ALTER FUNCTION %s OWNER TO %I',f,owner_name);
   EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',f);
   FOR grant_row IN SELECT DISTINCT x.grantee FROM pg_proc p,
     LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) x
     WHERE p.oid=f AND x.grantee<>p.proowner AND x.grantee<>0 LOOP
     SELECT rolname INTO grantee_name FROM pg_roles WHERE oid=grant_row.grantee;
     EXECUTE format('REVOKE ALL ON FUNCTION %s FROM %I CASCADE',f,grantee_name);
   END LOOP;
 END LOOP;
END $$;
COMMIT;
