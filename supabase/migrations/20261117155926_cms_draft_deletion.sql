BEGIN;
-- Private transaction-scoped authorization for the existing version guard.
CREATE TABLE cms_private.deleting(version_id uuid PRIMARY KEY);
ALTER TABLE cms_private.deleting ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON cms_private.deleting FROM PUBLIC,anon,authenticated,service_role;
DO $$ DECLARE definition text; BEGIN
 definition:=pg_get_functiondef('cms_private.version_guard()'::regprocedure);
 IF position(' IF OLD.cms_managed OR' IN definition)=0 THEN RAISE EXCEPTION 'CMS guard drift'; END IF;
 definition:=replace(definition,' IF OLD.cms_managed OR',
 ' IF TG_OP=''DELETE'' AND EXISTS(SELECT 1 FROM cms_private.deleting WHERE version_id=OLD.version_id) THEN PERFORM cms_private.require_staff(); RETURN OLD; END IF; IF OLD.cms_managed OR');
 EXECUTE definition;
END $$;
CREATE FUNCTION public.cms_delete_draft(p_version uuid,p_revision integer) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE w cms_private.workspaces; x record; join_sql text; found_ref boolean; t text;
 owned oid[]:=ARRAY['public.content_versions'::regclass,'public.jobs'::regclass,'public.personas'::regclass,'public.scenarios'::regclass,'public.choices'::regclass,'public.persona_expenses'::regclass,'public.statistics'::regclass,'public.scenario_statistics'::regclass,'public.cac_support_effects'::regclass,'public.scenario_library_metadata'::regclass,'public.scenario_fact_copy'::regclass,'public.scenario_bill_links'::regclass,'public.scenario_edition_prices'::regclass,'cms_private.workspaces'::regclass,'cms_private.lineage'::regclass,'cms_private.receipts'::regclass,'cms_private.choice_order'::regclass];
BEGIN
 PERFORM cms_private.require_staff();
 -- Serialize with edition creation and workspace saves. Fail rather than wait indefinitely.
 PERFORM set_config('lock_timeout','5s',true);
 PERFORM pg_advisory_xact_lock(6310,1115);
 SELECT * INTO w FROM cms_private.workspaces WHERE version_id=p_version FOR UPDATE;
 IF NOT FOUND THEN
  IF NOT EXISTS(SELECT 1 FROM public.content_versions WHERE version_id=p_version) THEN RETURN; END IF;
  RAISE EXCEPTION 'CMS draft required';
 END IF;
 IF w.revision IS DISTINCT FROM p_revision THEN RAISE EXCEPTION 'Draft changed. Reload before deleting.' USING ERRCODE='40001'; END IF;
 PERFORM 1 FROM public.content_versions WHERE version_id=p_version AND cms_managed AND status='draft' AND published_at IS NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unpublished CMS draft required'; END IF;
 -- Include every referencing table: block concurrent dependency insertion during inspection/deletion.
 FOR x IN SELECT DISTINCT rel FROM (SELECT unnest(owned) rel UNION SELECT conrelid FROM pg_constraint WHERE contype='f' AND confrelid=ANY(owned)) q ORDER BY rel LOOP
  EXECUTE format('LOCK TABLE %s IN SHARE ROW EXCLUSIVE MODE',x.rel::regclass);
 END LOOP;
 FOR x IN SELECT * FROM pg_constraint WHERE contype='f' AND confrelid=ANY(owned) LOOP
  SELECT string_agg(format('c.%I=p.%I',ca.attname,pa.attname),' AND ') INTO join_sql
  FROM unnest(x.conkey,x.confkey) k(ca,pa)
  JOIN pg_attribute ca ON ca.attrelid=x.conrelid AND ca.attnum=k.ca
  JOIN pg_attribute pa ON pa.attrelid=x.confrelid AND pa.attnum=k.pa;
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM %s c JOIN %s p ON %s WHERE p.version_id=$1 %s)',x.conrelid::regclass,x.confrelid::regclass,join_sql,
    CASE WHEN x.conrelid=ANY(owned) THEN 'AND c.version_id IS DISTINCT FROM $1' ELSE '' END) INTO found_ref USING p_version;
  IF found_ref THEN RAISE EXCEPTION 'Draft has external dependencies; nothing was deleted'; END IF;
 END LOOP;
 -- Explicit reverse dependency order; no gameplay cascades are relied on.
 FOREACH t IN ARRAY ARRAY['cms_private.choice_order','cms_private.receipts','cms_private.lineage','public.scenario_bill_links','public.scenario_fact_copy','public.scenario_library_metadata','public.scenario_statistics','public.cac_support_effects','public.choices','public.persona_expenses','public.scenarios','public.personas','public.jobs','public.statistics','public.scenario_edition_prices'] LOOP
  EXECUTE format('DELETE FROM %s WHERE version_id=$1',t) USING p_version;
 END LOOP;
 DELETE FROM cms_private.workspaces WHERE version_id=p_version;
 INSERT INTO cms_private.deleting VALUES(p_version);
 DELETE FROM public.content_versions WHERE version_id=p_version;
 DELETE FROM cms_private.deleting WHERE version_id=p_version;
END $$;
REVOKE ALL ON FUNCTION public.cms_delete_draft(uuid,integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cms_delete_draft(uuid,integer) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
