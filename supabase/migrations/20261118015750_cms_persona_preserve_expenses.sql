-- Persona detail saves must not normalize untouched expense definitions.
-- Keep the Stage 1 RPC, security, identity, revision and receipt contract intact.
BEGIN;
DO $$
DECLARE definition text; original text := 'WHERE expense_id = expense AND persona_id = pid AND version_id = p_version;';
BEGIN
  definition := pg_get_functiondef('public.cms_save_persona_bundle(uuid,integer,uuid,uuid,jsonb,jsonb)'::regprocedure);
  IF position(original IN definition) = 0 THEN RAISE EXCEPTION 'Persona bundle definition drift; review before applying'; END IF;
  definition := replace(definition, original,
    'WHERE expense_id = expense AND persona_id = pid AND version_id = p_version
      AND ROW(name,amount,first_due_day,repeat_interval_days,late_fee_amount)
        IS DISTINCT FROM ROW(entry->>''name'',cms_private.persona_money(entry->''amount''),
          (entry->>''first_due_day'')::smallint,(entry->>''repeat_interval_days'')::smallint,
          cms_private.persona_money(entry->''late_fee_amount''));');
  EXECUTE definition;
END $$;
COMMIT;
