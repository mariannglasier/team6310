-- Persona persistence foundation only. No UI, publication or gameplay changes.
BEGIN;

-- Preserve the existing scenario/choice/fact read chain and its authorization.
ALTER FUNCTION public.cms_read_draft(uuid) RENAME TO cms_read_draft_scenario_content;
REVOKE ALL ON FUNCTION public.cms_read_draft_scenario_content(uuid)
  FROM PUBLIC, anon, authenticated, service_role;
CREATE FUNCTION public.cms_read_draft(p_version uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE content jsonb;
BEGIN
  content := public.cms_read_draft_scenario_content(p_version);
  RETURN content || jsonb_build_object(
    'personas', coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.name, p.persona_id)
      FROM public.personas p WHERE p.version_id = p_version), '[]'::jsonb),
    'expenses', coalesce((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.first_due_day, e.name, e.expense_id)
      FROM public.persona_expenses e WHERE e.version_id = p_version), '[]'::jsonb),
    'bill_links', coalesce((SELECT jsonb_agg(to_jsonb(l) ORDER BY l.expense_id)
      FROM public.scenario_bill_links l WHERE l.version_id = p_version), '[]'::jsonb));
END $$;

CREATE FUNCTION cms_private.persona_money(p_value jsonb) RETURNS numeric
LANGUAGE plpgsql IMMUTABLE SET search_path = '' AS $$
DECLARE value numeric; text_value text := p_value #>> '{}';
BEGIN
  IF jsonb_typeof(p_value) NOT IN ('number', 'string') OR p_value IS NULL
    OR length(text_value) > 32 OR text_value !~ '^[0-9]+(\.[0-9]{1,2})?$' THEN
    RAISE EXCEPTION 'A nonnegative exact USD amount is required';
  END IF;
  value := text_value::numeric;
  IF value >= 10000000000 THEN RAISE EXCEPTION 'USD amount out of range'; END IF;
  RETURN value;
END $$;

CREATE FUNCTION public.cms_save_persona_bundle(
  p_version uuid, p_revision integer, p_request uuid, p_persona uuid,
  p_fields jsonb, p_expenses jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  w cms_private.workspaces; receipt cms_private.receipts;
  prior public.personas; updated public.personas;
  payload jsonb := jsonb_build_array('persona_bundle', p_revision, p_persona, p_fields, p_expenses);
  pid uuid := p_persona; expense uuid; entry jsonb; field text; dependency record;
  retained uuid[] := '{}'; removed uuid[]; client_keys text[] := '{}';
  mapped jsonb := '[]'; result jsonb; old_expenses jsonb;
  blocked boolean; join_sql text;
BEGIN
  PERFORM cms_private.require_staff();
  PERFORM set_config('lock_timeout', '5s', true);
  SELECT * INTO STRICT w FROM cms_private.workspaces WHERE version_id = p_version FOR UPDATE;
  SELECT * INTO receipt FROM cms_private.receipts WHERE version_id = p_version AND request_id = p_request;
  IF FOUND THEN
    IF receipt.actor <> auth.uid() OR receipt.payload <> payload THEN
      RAISE EXCEPTION 'Request reused with different input';
    END IF;
    RETURN receipt.result;
  END IF;
  IF p_request IS NULL OR p_revision IS DISTINCT FROM w.revision THEN
    RAISE EXCEPTION 'Draft changed. Reload before saving.' USING ERRCODE = '40001';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.content_versions WHERE version_id = p_version
    AND cms_managed AND status = 'draft' AND published_at IS NULL) THEN
    RAISE EXCEPTION 'Editable CMS draft required';
  END IF;
  IF jsonb_typeof(p_fields) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Persona fields required'; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(p_fields) k WHERE k NOT IN
    ('name','description','general_starting_balance','has_english_skills','has_computer_skills')) THEN
    RAISE EXCEPTION 'Unsupported persona field';
  END IF;
  IF jsonb_typeof(p_expenses) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Explicit expense array required'; END IF;
  IF pid IS NOT NULL THEN
    SELECT * INTO prior FROM public.personas WHERE persona_id = pid AND version_id = p_version FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Persona must belong to this draft'; END IF;
    -- Never edit content which has unexpectedly acquired gameplay references.
    IF EXISTS (SELECT 1 FROM public.playthroughs WHERE persona_id = pid)
      OR EXISTS (SELECT 1 FROM public.group_sessions WHERE selected_persona_id = pid)
      OR EXISTS (SELECT 1 FROM public.group_participants WHERE persona_id = pid)
      OR EXISTS (SELECT 1 FROM public.playthrough_expenses b JOIN public.persona_expenses e USING (expense_id)
        WHERE e.persona_id = pid) THEN RAISE EXCEPTION 'Persona has historical gameplay dependencies'; END IF;
  ELSE
    IF NOT (p_fields ?& ARRAY['name','description','general_starting_balance','has_english_skills','has_computer_skills']) THEN
      RAISE EXCEPTION 'New persona requires details, starting balance and explicit skills';
    END IF;
    prior.weekly_income := 0;
    prior.starting_job_id := NULL;
  END IF;
  FOREACH field IN ARRAY ARRAY['name','description'] LOOP
    IF p_fields ? field THEN
      IF NOT (p_persona IS NOT NULL AND p_fields->field = 'null'::jsonb
        AND to_jsonb(prior)->field = 'null'::jsonb AND field = 'description') THEN
        IF jsonb_typeof(p_fields->field) IS DISTINCT FROM 'string'
          OR length(btrim(p_fields->>field)) = 0 THEN RAISE EXCEPTION 'Persona name and description must be nonblank text'; END IF;
      END IF;
    END IF;
  END LOOP;
  FOREACH field IN ARRAY ARRAY['has_english_skills','has_computer_skills'] LOOP
    IF p_fields ? field AND jsonb_typeof(p_fields->field) IS DISTINCT FROM 'boolean'
      AND NOT (p_persona IS NOT NULL AND p_fields->field = 'null'::jsonb AND to_jsonb(prior)->field = 'null'::jsonb) THEN
      RAISE EXCEPTION 'Explicit boolean skills required';
    END IF;
  END LOOP;
  IF p_fields ? 'general_starting_balance' AND NOT
    (p_persona IS NOT NULL AND p_fields->'general_starting_balance' = 'null'::jsonb AND prior.general_starting_balance IS NULL) THEN
    PERFORM cms_private.persona_money(p_fields->'general_starting_balance');
  END IF;
  updated := jsonb_populate_record(prior, p_fields);
  IF p_fields ? 'name' THEN updated.name := btrim(updated.name); END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(e)), '[]') INTO old_expenses
    FROM public.persona_expenses e WHERE e.persona_id = pid AND e.version_id = p_version;

  -- Validate the full owned list before any mutation. No reparenting or client IDs.
  FOR entry IN SELECT value FROM jsonb_array_elements(p_expenses) LOOP
    IF jsonb_typeof(entry) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid expense'; END IF;
    IF EXISTS (SELECT 1 FROM jsonb_object_keys(entry) k WHERE k NOT IN
      ('expense_id','client_key','name','amount','first_due_day','repeat_interval_days','late_fee_amount')) THEN
      RAISE EXCEPTION 'Unsupported expense field or relationship';
    END IF;
    IF NOT (entry ?& ARRAY['expense_id','name','amount','first_due_day','repeat_interval_days','late_fee_amount']) THEN
      RAISE EXCEPTION 'Complete expense fields required';
    END IF;
    expense := (entry->>'expense_id')::uuid;
    IF expense IS NOT NULL THEN
      IF expense = ANY(retained) OR NOT EXISTS (SELECT 1 FROM public.persona_expenses
        WHERE expense_id = expense AND persona_id = pid AND version_id = p_version) THEN
        RAISE EXCEPTION 'Duplicate expense or expense outside selected persona and edition';
      END IF;
      IF entry ? 'client_key' THEN RAISE EXCEPTION 'Existing expense cannot have a client key'; END IF;
      retained := array_append(retained, expense);
    ELSE
      IF jsonb_typeof(entry->'client_key') IS DISTINCT FROM 'string'
        OR length(btrim(entry->>'client_key')) NOT BETWEEN 1 AND 120
        OR entry->>'client_key' = ANY(client_keys) THEN RAISE EXCEPTION 'Unique new expense client key required'; END IF;
      client_keys := array_append(client_keys, entry->>'client_key');
    END IF;
    IF jsonb_typeof(entry->'name') IS DISTINCT FROM 'string' OR length(btrim(entry->>'name')) = 0 THEN
      RAISE EXCEPTION 'Expense name required'; END IF;
    PERFORM cms_private.persona_money(entry->'amount');
    PERFORM cms_private.persona_money(entry->'late_fee_amount');
    IF jsonb_typeof(entry->'first_due_day') IS DISTINCT FROM 'number'
      OR entry->>'first_due_day' !~ '^[0-9]+$' THEN RAISE EXCEPTION 'Invalid first due day'; END IF;
    IF (entry->>'first_due_day')::numeric NOT BETWEEN 1 AND 32767 THEN RAISE EXCEPTION 'Invalid first due day'; END IF;
    IF entry->'repeat_interval_days' <> 'null'::jsonb THEN
      IF jsonb_typeof(entry->'repeat_interval_days') IS DISTINCT FROM 'number'
        OR entry->>'repeat_interval_days' !~ '^[0-9]+$' THEN RAISE EXCEPTION 'Invalid repeat interval'; END IF;
      IF (entry->>'repeat_interval_days')::numeric NOT BETWEEN 1 AND 32767 THEN RAISE EXCEPTION 'Invalid repeat interval'; END IF;
    END IF;
  END LOOP;

  SELECT coalesce(array_agg(expense_id), '{}') INTO removed FROM public.persona_expenses
    WHERE persona_id = pid AND version_id = p_version AND NOT (expense_id = ANY(retained));
  IF cardinality(removed) > 0 THEN
    -- Freeze all inbound FK writers, including future/unexpected dependencies.
    FOR dependency IN SELECT rel FROM (SELECT 'public.persona_expenses'::regclass::oid rel
      UNION SELECT conrelid FROM pg_constraint WHERE contype = 'f' AND confrelid = 'public.persona_expenses'::regclass) q ORDER BY rel LOOP
      EXECUTE format('LOCK TABLE %s IN SHARE ROW EXCLUSIVE MODE', dependency.rel::regclass);
    END LOOP;
    FOR dependency IN SELECT * FROM pg_constraint WHERE contype = 'f' AND confrelid = 'public.persona_expenses'::regclass LOOP
      SELECT string_agg(format('c.%I = p.%I', ca.attname, pa.attname), ' AND ') INTO join_sql
        FROM unnest(dependency.conkey, dependency.confkey) k(ca,pa)
        JOIN pg_attribute ca ON ca.attrelid = dependency.conrelid AND ca.attnum = k.ca
        JOIN pg_attribute pa ON pa.attrelid = dependency.confrelid AND pa.attnum = k.pa;
      EXECUTE format('SELECT EXISTS (SELECT 1 FROM %s c JOIN public.persona_expenses p ON %s WHERE p.expense_id = ANY($1))', dependency.conrelid::regclass, join_sql)
        INTO blocked USING removed;
      IF blocked THEN RAISE EXCEPTION 'Expense has external dependencies, including possible bill recap links; nothing was removed'; END IF;
    END LOOP;
  END IF;

  IF pid IS NULL THEN
    pid := gen_random_uuid();
    INSERT INTO public.personas(persona_id,version_id,name,description,general_starting_balance,
      weekly_income,starting_job_id,has_english_skills,has_computer_skills)
    VALUES (pid,p_version,updated.name,updated.description,updated.general_starting_balance,
      0,NULL,updated.has_english_skills,updated.has_computer_skills);
  ELSE
    UPDATE public.personas SET name = updated.name, description = updated.description,
      general_starting_balance = updated.general_starting_balance,
      has_english_skills = updated.has_english_skills, has_computer_skills = updated.has_computer_skills
      WHERE persona_id = pid AND version_id = p_version;
  END IF;
  DELETE FROM cms_private.lineage WHERE version_id = p_version AND table_name = 'persona_expenses' AND draft_id = ANY(removed);
  DELETE FROM public.persona_expenses WHERE expense_id = ANY(removed) AND version_id = p_version;
  FOR entry IN SELECT value FROM jsonb_array_elements(p_expenses) LOOP
    expense := (entry->>'expense_id')::uuid;
    IF expense IS NULL THEN
      expense := gen_random_uuid();
      INSERT INTO public.persona_expenses(expense_id,persona_id,version_id,name,amount,first_due_day,repeat_interval_days,late_fee_amount)
      VALUES (expense,pid,p_version,btrim(entry->>'name'),cms_private.persona_money(entry->'amount'),
        (entry->>'first_due_day')::smallint,(entry->>'repeat_interval_days')::smallint,cms_private.persona_money(entry->'late_fee_amount'));
      mapped := mapped || jsonb_build_array(jsonb_build_object('client_key',entry->>'client_key','expense_id',expense));
    ELSE
      UPDATE public.persona_expenses SET name = btrim(entry->>'name'), amount = cms_private.persona_money(entry->'amount'),
        first_due_day = (entry->>'first_due_day')::smallint, repeat_interval_days = (entry->>'repeat_interval_days')::smallint,
        late_fee_amount = cms_private.persona_money(entry->'late_fee_amount') WHERE expense_id = expense AND persona_id = pid AND version_id = p_version;
    END IF;
  END LOOP;
  -- Existing copied collisions may survive an unrelated edit, never a new or
  -- changed schedule. No new days or gameplay selection rules are introduced.
  IF EXISTS (SELECT 1 FROM public.persona_expenses e JOIN public.scenarios s
    ON s.version_id = e.version_id AND s.persona_intent = e.persona_id
    WHERE e.persona_id = pid AND e.version_id = p_version AND s.schedule_type = 'scheduled'
      AND s.default_day BETWEEN 1 AND 30 AND e.first_due_day <= s.default_day
      AND ((e.repeat_interval_days IS NULL AND e.first_due_day = s.default_day)
        OR (e.repeat_interval_days IS NOT NULL AND (s.default_day - e.first_due_day) % e.repeat_interval_days = 0))
      AND NOT EXISTS (SELECT 1 FROM jsonb_populate_recordset(NULL::public.persona_expenses,old_expenses) old
        WHERE old.expense_id = e.expense_id AND old.first_due_day = e.first_due_day
          AND old.repeat_interval_days IS NOT DISTINCT FROM e.repeat_interval_days)) THEN
    RAISE EXCEPTION 'Bill and ordinary scenario schedule collision';
  END IF;
  UPDATE cms_private.workspaces SET revision = revision + 1, updated_at = now() WHERE version_id = p_version;
  result := jsonb_build_object('persona_id',pid,'revision',w.revision + 1,'new_expenses',mapped);
  INSERT INTO cms_private.receipts VALUES (p_version,p_request,auth.uid(),payload,result,now());
  RETURN result;
END $$;

REVOKE ALL ON FUNCTION cms_private.persona_money(jsonb) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.cms_read_draft(uuid), public.cms_save_persona_bundle(uuid,integer,uuid,uuid,jsonb,jsonb)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cms_read_draft(uuid), public.cms_save_persona_bundle(uuid,integer,uuid,uuid,jsonb,jsonb)
  TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
