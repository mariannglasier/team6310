BEGIN;
CREATE FUNCTION public.cms_delete_scenario(p_version uuid,p_revision integer,p_request uuid,p_scenario uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE w cms_private.workspaces; receipt cms_private.receipts; payload jsonb:=jsonb_build_array('delete_scenario',p_revision,p_scenario); result jsonb; x record; t oid; predicate text; joins text; blocked boolean; doomed jsonb:='{}'; rows jsonb;
 owned oid[]:=ARRAY['public.scenarios'::regclass,'public.choices'::regclass,'public.scenario_fact_copy'::regclass,'public.scenario_statistics'::regclass,'public.scenario_library_metadata'::regclass,'public.scenario_bill_links'::regclass,'public.cac_support_effects'::regclass,'cms_private.choice_order'::regclass];
BEGIN
 PERFORM cms_private.require_staff();
 PERFORM set_config('lock_timeout','5s',true);
 SELECT * INTO STRICT w FROM cms_private.workspaces WHERE version_id=p_version FOR UPDATE;
 SELECT * INTO receipt FROM cms_private.receipts WHERE version_id=p_version AND request_id=p_request;
 IF FOUND THEN
 IF receipt.actor<>auth.uid() OR receipt.payload<>payload THEN RAISE EXCEPTION 'Request reused with different input'; END IF;
 RETURN receipt.result; END IF;
 IF p_request IS NULL OR p_revision IS DISTINCT FROM w.revision THEN RAISE EXCEPTION 'Draft changed. Reload before deleting.' USING ERRCODE='40001'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.content_versions WHERE version_id=p_version AND cms_managed AND status='draft' AND published_at IS NULL) THEN RAISE EXCEPTION 'Unpublished CMS draft required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.scenarios WHERE scenario_id=p_scenario AND version_id=p_version) THEN RAISE EXCEPTION 'Scenario must belong to draft'; END IF;
 FOR x IN SELECT DISTINCT rel FROM (SELECT unnest(owned) rel UNION SELECT conrelid FROM pg_constraint WHERE contype='f' AND confrelid=ANY(owned)) q ORDER BY rel LOOP
 EXECUTE format('LOCK TABLE %s IN SHARE ROW EXCLUSIVE MODE',x.rel::regclass); END LOOP;
 FOREACH t IN ARRAY owned LOOP
 predicate:=CASE WHEN t=ANY(ARRAY['public.cac_support_effects'::regclass,'cms_private.choice_order'::regclass]) THEN 'r.choice_id IN (SELECT choice_id FROM public.choices WHERE scenario_id=$1 AND version_id=$2)' ELSE 'r.scenario_id=$1' END;
 EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(r)),''[]'') FROM %s r WHERE %s AND r.version_id=$2',t::regclass,predicate) INTO rows USING p_scenario,p_version;
 doomed:=jsonb_set(doomed,ARRAY[t::text],rows);
 END LOOP;
 FOR x IN SELECT * FROM pg_constraint WHERE contype='f' AND confrelid=ANY(owned) LOOP
 SELECT string_agg(format('c.%I=p.%I',ca.attname,pa.attname),' AND ') INTO joins
 FROM unnest(x.conkey,x.confkey) k(ca,pa) JOIN pg_attribute ca ON ca.attrelid=x.conrelid AND ca.attnum=k.ca JOIN pg_attribute pa ON pa.attrelid=x.confrelid AND pa.attnum=k.pa;
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM %s c JOIN %s p ON %s WHERE $1 @> jsonb_build_array(to_jsonb(p)) AND NOT ($2 @> jsonb_build_array(to_jsonb(c))))',x.conrelid::regclass,x.confrelid::regclass,joins)
 INTO blocked USING doomed->x.confrelid::text,coalesce(doomed->x.conrelid::text,'[]');
 IF blocked THEN RAISE EXCEPTION 'Scenario has external dependencies; nothing was deleted'; END IF;
 END LOOP;
 DELETE FROM cms_private.lineage l WHERE version_id=p_version AND ((table_name='scenarios' AND draft_id=p_scenario) OR (table_name='choices' AND draft_id IN(SELECT choice_id FROM public.choices WHERE scenario_id=p_scenario AND version_id=p_version)) OR (table_name='cac_support_effects' AND draft_id IN(SELECT e.support_effect_id FROM public.cac_support_effects e JOIN public.choices c USING(choice_id) WHERE c.scenario_id=p_scenario AND c.version_id=p_version)));
 FOREACH t IN ARRAY ARRAY['cms_private.choice_order'::regclass,'public.cac_support_effects'::regclass,'public.scenario_bill_links'::regclass,'public.scenario_fact_copy'::regclass,'public.scenario_statistics'::regclass,'public.scenario_library_metadata'::regclass,'public.choices'::regclass,'public.scenarios'::regclass] LOOP
 EXECUTE format('DELETE FROM %s r WHERE $1 @> jsonb_build_array(to_jsonb(r))',t::regclass) USING doomed->t::text;
 END LOOP;
 UPDATE cms_private.workspaces SET revision=revision+1,updated_at=now() WHERE version_id=p_version;
 result:=jsonb_build_object('scenario_id',p_scenario,'revision',w.revision+1);
 INSERT INTO cms_private.receipts VALUES(p_version,p_request,auth.uid(),payload,result,now());
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.cms_delete_scenario(uuid,integer,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cms_delete_scenario(uuid,integer,uuid,uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
