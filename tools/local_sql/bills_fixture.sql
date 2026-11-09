-- Synthetic LOCAL manual-test content only. Never a production migration/seed.
-- Loaded once by the agent into the fixed local verification container.
BEGIN;
DO $$
DECLARE v public.content_versions%rowtype; p public.personas%rowtype;
 j public.jobs%rowtype; s public.scenarios%rowtype; c public.choices%rowtype;
 columns_sql text; new_version constant uuid:='63100000-0000-4000-8000-000000000800';
 source_version constant uuid:='3c463a7f-7036-4e0c-9c1b-1f5db7c502f3';
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext('team6310-local-bills-fixture'));
 IF current_database()<>'postgres' OR current_user<>'postgres' OR NOT EXISTS(
   SELECT 1 FROM public.personas WHERE persona_id='cfe33068-d657-482f-b770-ef3918a87e03'
   AND name='[LOCAL TEST] Alex' AND version_id=source_version) THEN
   RAISE EXCEPTION 'Expected local employment fixture missing; refusing content changes';
 END IF;
 IF EXISTS(SELECT 1 FROM public.content_versions WHERE version_id=new_version) THEN
   IF NOT EXISTS(SELECT 1 FROM public.content_versions WHERE version_id=new_version AND status='published' AND published_at IS NOT NULL)
   OR (SELECT count(*) FROM public.personas WHERE version_id=new_version AND name IN ('[LOCAL TEST] Bills Alex','[LOCAL TEST] Bills Low funds'))<>2
   OR (SELECT count(*) FROM public.persona_expenses WHERE version_id=new_version)<>8
   OR (SELECT count(*) FROM public.persona_expenses e JOIN (VALUES
     ('Local rent',50::numeric,2,7,5::numeric),('Local utilities',20,3,NULL,2),
     ('Local phone',10,3,NULL,1),('Local final bill',15,30,NULL,1)
   ) expected(name,amount,first_due,interval_days,fee) ON e.name=expected.name AND e.amount=expected.amount
     AND e.first_due_day=expected.first_due AND e.repeat_interval_days IS NOT DISTINCT FROM expected.interval_days
     AND e.late_fee_amount=expected.fee WHERE e.version_id=new_version)<>8 THEN
     RAISE EXCEPTION 'Existing bills fixture differs; refusing overwrite';
   END IF;
   RETURN;
 END IF;
 SELECT * INTO STRICT v FROM public.content_versions WHERE version_id=source_version;
 v.version_id:=new_version; v.version_number:=(SELECT max(version_number)+1 FROM public.content_versions);
 v.status:='draft'; v.published_at:=NULL;
 INSERT INTO public.content_versions SELECT v.*;
 FOR p IN SELECT * FROM public.personas WHERE version_id=source_version ORDER BY persona_id LOOP
   IF p.name NOT IN ('[LOCAL TEST] Alex','[LOCAL TEST] Low funds') THEN RAISE EXCEPTION 'Unexpected source persona'; END IF;
   p.persona_id:=md5('local-bills:'||p.persona_id::text)::uuid; p.version_id:=new_version;
   p.name:=replace(p.name,'[LOCAL TEST] ','[LOCAL TEST] Bills ');
   p.description:='Synthetic local bills manual-test fixture. Amounts are test inputs only.';
   INSERT INTO public.personas SELECT p.*;
   INSERT INTO public.persona_expenses(expense_id,persona_id,version_id,name,amount,first_due_day,repeat_interval_days,late_fee_amount)
   SELECT md5('local-bills:'||p.persona_id::text||':'||e.name)::uuid,p.persona_id,new_version,
     e.name,e.amount,e.first_due,e.interval_days,e.fee
   FROM (VALUES ('Local rent',50::numeric,2,7,5::numeric),('Local utilities',20,3,NULL,2),
     ('Local phone',10,3,NULL,1),('Local final bill',15,30,NULL,1)) e(name,amount,first_due,interval_days,fee);
 END LOOP;
 -- Exclude generated weekly income columns: PostgreSQL calculates them from the
 -- copied, existing local job inputs. No wages are invented or overwritten.
 SELECT string_agg(quote_ident(attname),',' ORDER BY attnum) INTO columns_sql FROM pg_attribute
 WHERE attrelid='public.jobs'::regclass AND attnum>0 AND NOT attisdropped AND attgenerated='' AND attidentity='';
 FOR j IN SELECT * FROM public.jobs WHERE version_id=source_version LOOP
   j.job_id:=md5('local-bills:'||j.job_id::text)::uuid; j.version_id:=new_version;
   EXECUTE format('INSERT INTO public.jobs (%s) SELECT %s FROM jsonb_populate_record(NULL::public.jobs,$1)',columns_sql,columns_sql) USING to_jsonb(j);
 END LOOP;
 -- Retain the existing Day 4–7 ordinary decisions under new edition/identity
 -- bindings, so bills can also be tested alongside normal scenario progression.
 FOR s IN SELECT * FROM public.scenarios WHERE version_id=source_version AND schedule_type='scheduled' AND default_day BETWEEN 4 AND 7 LOOP
   s.scenario_id:=md5('local-bills:'||s.scenario_id::text)::uuid; s.version_id:=new_version;
   s.persona_intent:=md5('local-bills:'||s.persona_intent::text)::uuid;
   INSERT INTO public.scenarios SELECT s.*;
 END LOOP;
 FOR c IN SELECT ch.* FROM public.choices ch JOIN public.scenarios sc ON sc.scenario_id=ch.scenario_id
   WHERE sc.version_id=source_version AND sc.schedule_type='scheduled' AND sc.default_day BETWEEN 4 AND 7 LOOP
   IF c.next_scenario_id IS NOT NULL THEN RAISE EXCEPTION 'Unexpected branching fixture'; END IF;
   c.choice_id:=md5('local-bills:'||c.choice_id::text)::uuid;
   c.scenario_id:=md5('local-bills:'||c.scenario_id::text)::uuid; c.version_id:=new_version;
   INSERT INTO public.choices SELECT c.*;
 END LOOP;
 UPDATE public.content_versions SET status='published',published_at=clock_timestamp() WHERE version_id=new_version;
END $$;
NOTIFY pgrst,'reload schema';
COMMIT;
