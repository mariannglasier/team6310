-- Draft persona and owned expense deletion only. No gameplay or shared-data cascades.
BEGIN;
CREATE FUNCTION public.cms_delete_persona(p_version uuid,p_revision integer,p_request uuid,p_persona uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  w cms_private.workspaces; receipt cms_private.receipts;
  payload jsonb := jsonb_build_array('delete_persona',p_revision,p_persona);
  owned oid[] := ARRAY['public.personas'::regclass,'public.persona_expenses'::regclass];
  doomed jsonb := '{}'; rows jsonb; x record; t oid; joins text; blocked boolean; result jsonb;
BEGIN
  PERFORM cms_private.require_staff();
  PERFORM set_config('lock_timeout','5s',true);
  SELECT * INTO STRICT w FROM cms_private.workspaces WHERE version_id=p_version FOR UPDATE;
  SELECT * INTO receipt FROM cms_private.receipts WHERE version_id=p_version AND request_id=p_request;
  IF FOUND THEN
    IF receipt.actor<>auth.uid() OR receipt.payload<>payload THEN RAISE EXCEPTION 'Request reused with different input'; END IF;
    RETURN receipt.result;
  END IF;
  IF p_request IS NULL OR p_revision IS DISTINCT FROM w.revision THEN
    RAISE EXCEPTION 'Draft changed. Reload before deleting.' USING ERRCODE='40001';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.content_versions WHERE version_id=p_version AND cms_managed
    AND status='draft' AND published_at IS NULL) THEN RAISE EXCEPTION 'Unpublished CMS draft required'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.personas WHERE persona_id=p_persona AND version_id=p_version) THEN
    RAISE EXCEPTION 'Persona must belong to this draft'; END IF;
  -- Freeze every inbound FK writer, including newly introduced/cascading dependencies.
  FOR x IN SELECT DISTINCT rel FROM (SELECT unnest(owned) rel UNION SELECT conrelid FROM pg_constraint
    WHERE contype='f' AND confrelid=ANY(owned)) q ORDER BY rel LOOP
    EXECUTE format('LOCK TABLE %s IN SHARE ROW EXCLUSIVE MODE',x.rel::regclass);
  END LOOP;
  IF EXISTS(SELECT 1 FROM public.scenarios WHERE persona_intent=p_persona) THEN
    RAISE EXCEPTION 'Persona still has linked scenarios. Reassign them in Scenario Editor before deleting. Nothing was deleted'; END IF;
  IF EXISTS(SELECT 1 FROM public.scenario_bill_links l JOIN public.persona_expenses e USING(expense_id)
    WHERE e.persona_id=p_persona) THEN
    RAISE EXCEPTION 'Persona has expenses linked to bill recaps. Those references must be resolved before deletion. Nothing was deleted'; END IF;
  FOREACH t IN ARRAY owned LOOP
    EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(r)),''[]'') FROM %s r WHERE persona_id=$1 AND version_id=$2',t::regclass)
      INTO rows USING p_persona,p_version;
    doomed := jsonb_set(doomed,ARRAY[t::text],rows);
  END LOOP;
  FOR x IN SELECT * FROM pg_constraint WHERE contype='f' AND confrelid=ANY(owned) LOOP
    SELECT string_agg(format('c.%I=p.%I',ca.attname,pa.attname),' AND ') INTO joins
      FROM unnest(x.conkey,x.confkey) k(ca,pa)
      JOIN pg_attribute ca ON ca.attrelid=x.conrelid AND ca.attnum=k.ca
      JOIN pg_attribute pa ON pa.attrelid=x.confrelid AND pa.attnum=k.pa;
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %s c JOIN %s p ON %s WHERE $1 @> jsonb_build_array(to_jsonb(p)) AND NOT($2 @> jsonb_build_array(to_jsonb(c))))',x.conrelid::regclass,x.confrelid::regclass,joins)
      INTO blocked USING doomed->x.confrelid::text,coalesce(doomed->x.conrelid::text,'[]');
    IF blocked THEN RAISE EXCEPTION 'Persona or its expenses have historical or external dependencies. Nothing was deleted'
      USING DETAIL=format('Referencing table: %s',x.conrelid::regclass); END IF;
  END LOOP;
  DELETE FROM cms_private.lineage WHERE version_id=p_version AND
    ((table_name='personas' AND draft_id=p_persona) OR (table_name='persona_expenses' AND draft_id IN
      (SELECT expense_id FROM public.persona_expenses WHERE persona_id=p_persona AND version_id=p_version)));
  DELETE FROM public.persona_expenses WHERE persona_id=p_persona AND version_id=p_version;
  DELETE FROM public.personas WHERE persona_id=p_persona AND version_id=p_version;
  UPDATE cms_private.workspaces SET revision=revision+1,updated_at=now() WHERE version_id=p_version;
  result := jsonb_build_object('persona_id',p_persona,'revision',w.revision+1);
  INSERT INTO cms_private.receipts VALUES(p_version,p_request,auth.uid(),payload,result,now());
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.cms_delete_persona(uuid,integer,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cms_delete_persona(uuid,integer,uuid,uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
