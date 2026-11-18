-- Stage 3. Exact guarded in-place publication; existing content/gameplay unchanged.
BEGIN;
CREATE OR REPLACE FUNCTION cms_private.version_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  PERFORM pg_advisory_xact_lock(6310,1115);
  SELECT coalesce(max(version_number),0)+1 INTO NEW.version_number FROM public.content_versions;
  IF NEW.cms_managed THEN
   PERFORM cms_private.require_staff();
   IF NEW.status IS DISTINCT FROM 'draft' OR NEW.published_at IS NOT NULL THEN
    RAISE EXCEPTION 'CMS editions must be created as unpublished drafts'; END IF;
  END IF;
  RETURN NEW;
 END IF;
 IF TG_OP='UPDATE' AND NEW.status='published' THEN PERFORM pg_advisory_xact_lock(6310,1115); END IF;
 IF TG_OP='DELETE' AND OLD.status='draft' AND OLD.published_at IS NULL
  AND EXISTS(SELECT 1 FROM cms_private.deleting WHERE version_id=OLD.version_id) THEN
   PERFORM cms_private.require_staff(); RETURN OLD;
 END IF;
 IF OLD.cms_managed OR (TG_OP='UPDATE' AND NEW.cms_managed) THEN
  PERFORM cms_private.require_staff();
  IF TG_OP='UPDATE' AND OLD.cms_managed AND NEW.cms_managed AND OLD.status='draft' AND OLD.published_at IS NULL
   AND NEW.status='published' AND NEW.published_at IS NOT NULL
   AND (to_jsonb(NEW)-ARRAY['status','published_at'])=(to_jsonb(OLD)-ARRAY['status','published_at'])
   AND EXISTS(SELECT 1 FROM cms_private.publication_permits permit JOIN cms_private.workspaces w USING(version_id)
     WHERE permit.version_id=OLD.version_id AND permit.transaction_id=pg_current_xact_id()
     AND permit.actor=auth.uid() AND permit.revision=w.revision AND permit.request_id IS NOT NULL)
  THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'CMS editions cannot be published, reassigned or deleted';
 END IF;
 IF TG_OP='UPDATE' AND NEW.version_number IS DISTINCT FROM OLD.version_number THEN
  RAISE EXCEPTION 'Edition numbers are immutable'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;
-- The existing immutable-source snapshot/remapping implementation is reused intact.
DO $$ DECLARE definition text; BEGIN
 definition:=pg_get_functiondef('public.cms_create_draft(uuid,text,uuid)'::regprocedure);
 IF position('AND NOT cms_managed' IN definition)=0 THEN RAISE EXCEPTION 'Draft source predicate drift; review before upgrading'; END IF;
 definition:=replace(definition,'AND NOT cms_managed','');
 IF position(' RETURN v;' IN definition)=0 THEN RAISE EXCEPTION 'Draft return path drift'; END IF;
 definition:=replace(definition,' RETURN v;', $copy$
 -- Preserve CMS-authored order when the published source is itself a CMS edition.
 INSERT INTO cms_private.choice_order(version_id,choice_id,position)
 SELECT v,l.draft_id,o.position FROM cms_private.choice_order o
 JOIN cms_private.lineage l ON l.version_id=v AND l.table_name='choices' AND l.source_id=o.choice_id
 WHERE o.version_id=p_source;
 RETURN v;
$copy$);
 EXECUTE definition;
END $$;
CREATE OR REPLACE FUNCTION public.cms_list_drafts() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM cms_private.require_staff();
 RETURN coalesce((SELECT jsonb_agg(to_jsonb(w) ORDER BY w.updated_at DESC,w.version_id)
 FROM cms_private.workspaces w JOIN public.content_versions v USING(version_id)
 WHERE v.cms_managed AND v.status='draft' AND v.published_at IS NULL),'[]');
END $$;
ALTER FUNCTION public.cms_read_draft(uuid) RENAME TO cms_read_draft_authoring;
REVOKE ALL ON FUNCTION public.cms_read_draft_authoring(uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.cms_read_draft(p_version uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 RETURN public.cms_read_draft_authoring(p_version)||jsonb_build_object(
  'edition',(SELECT to_jsonb(v) FROM public.content_versions v WHERE version_id=p_version),
  'publication',(SELECT result FROM cms_private.publications WHERE version_id=p_version));
END $$;
CREATE FUNCTION public.cms_publish_draft(p_version uuid,p_revision integer,p_request uuid,p_validator text,p_heads jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE w cms_private.workspaces; v public.content_versions; prior cms_private.publications; report jsonb; result jsonb; instant timestamptz; x record;
 payload jsonb:=jsonb_build_array('publish',p_version,p_revision,p_validator,p_heads);
 owned oid[]:=ARRAY['public.content_versions'::regclass,'public.jobs'::regclass,'public.personas'::regclass,'public.scenarios'::regclass,'public.choices'::regclass,'public.persona_expenses'::regclass,'public.statistics'::regclass,'public.scenario_statistics'::regclass,'public.cac_support_effects'::regclass,'public.scenario_library_metadata'::regclass,'public.scenario_fact_copy'::regclass,'public.scenario_bill_links'::regclass,'public.scenario_edition_prices'::regclass];
BEGIN
 PERFORM cms_private.require_staff();
 PERFORM set_config('lock_timeout','5s',true);
 PERFORM pg_advisory_xact_lock(6310,1115);
 SELECT * INTO STRICT w FROM cms_private.workspaces WHERE version_id=p_version FOR UPDATE;
 SELECT * INTO prior FROM cms_private.publications WHERE version_id=p_version OR (actor=auth.uid() AND request_id=p_request);
 IF FOUND THEN
  IF prior.actor IS DISTINCT FROM auth.uid() OR prior.request_id IS DISTINCT FROM p_request OR prior.payload IS DISTINCT FROM payload
  THEN RAISE EXCEPTION 'Publication request reused with different input or actor'; END IF;
  RETURN prior.result;
 END IF;
 IF p_request IS NULL OR p_revision IS DISTINCT FROM w.revision OR p_validator IS DISTINCT FROM 'cms-publication-v1' OR p_heads IS DISTINCT FROM cms_private.publication_heads() THEN
  RAISE EXCEPTION 'PUB-STALE-REVIEW: saved revision, validator or published edition changed. Run publication review again.' USING ERRCODE='40001'; END IF;
 -- Freeze content and dependency insertion before taking the edition row lock.
 -- This avoids bill-insertion (table then version-share) lock inversion.
 FOR x IN SELECT DISTINCT rel FROM (SELECT unnest(owned) rel UNION SELECT conrelid FROM pg_constraint WHERE contype='f' AND confrelid=ANY(owned)) q ORDER BY rel LOOP
  EXECUTE format('LOCK TABLE %s IN SHARE MODE',x.rel::regclass);
 END LOOP;
 SELECT * INTO STRICT v FROM public.content_versions WHERE version_id=p_version FOR UPDATE;
 IF NOT v.cms_managed OR v.status IS DISTINCT FROM 'draft' OR v.published_at IS NOT NULL THEN RAISE EXCEPTION 'PUB-STATE: unpublished CMS draft required'; END IF;
 report:=public.cms_publication_preflight(p_version);
 IF (report->>'can_publish') IS DISTINCT FROM 'true' THEN
  RAISE EXCEPTION 'Publication blocked. Review the affected records and platform findings.' USING DETAIL=report::text; END IF;
 INSERT INTO cms_private.publication_permits VALUES(p_version,pg_current_xact_id(),auth.uid(),w.revision,p_request);
 instant:=clock_timestamp();
 UPDATE public.content_versions SET status='published',published_at=instant WHERE version_id=p_version;
 IF cms_private.publication_heads() IS DISTINCT FROM jsonb_build_object('individual',p_version,'group',p_version) THEN
  RAISE EXCEPTION 'PUB-ORDER: selectors would not agree on the new canonical edition'; END IF;
 UPDATE cms_private.workspaces SET revision=revision+1,updated_at=instant WHERE version_id=p_version;
 result:=jsonb_build_object('version_id',p_version,'version_number',v.version_number,'revision',w.revision+1,'published_at',instant,'published_by',auth.uid(),'validator',p_validator);
 INSERT INTO cms_private.publications VALUES(p_version,p_request,auth.uid(),w.revision,p_validator,p_heads,instant,report,payload,result);
 DELETE FROM cms_private.publication_permits WHERE version_id=p_version;
 RETURN result;
END $$;
CREATE FUNCTION public.cms_recover_draft(p_version uuid,p_revision integer,p_source uuid,p_name text,p_request uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE w cms_private.workspaces; receipt cms_private.receipts; created uuid;
 payload jsonb:=jsonb_build_array('recover',p_revision,p_source,p_name);
BEGIN
 PERFORM cms_private.require_staff();
 PERFORM set_config('lock_timeout','5s',true);
 PERFORM pg_advisory_xact_lock(6310,1115);
 SELECT * INTO STRICT w FROM cms_private.workspaces WHERE version_id=p_version FOR UPDATE;
 SELECT * INTO receipt FROM cms_private.receipts WHERE version_id=p_version AND request_id=p_request;
 IF FOUND THEN
  IF receipt.actor IS DISTINCT FROM auth.uid() OR receipt.payload IS DISTINCT FROM payload THEN RAISE EXCEPTION 'Recovery request reused with different input or actor'; END IF;
  RETURN (receipt.result->>'version_id')::uuid;
 END IF;
 IF p_request IS NULL OR w.revision IS DISTINCT FROM p_revision THEN RAISE EXCEPTION 'Draft changed. Review recovery again.' USING ERRCODE='40001'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.content_versions WHERE version_id=p_version AND cms_managed AND status='draft' AND published_at IS NULL) THEN
  RAISE EXCEPTION 'Unpublished CMS draft required'; END IF;
 IF p_source IS NULL OR p_source::text IS DISTINCT FROM cms_private.publication_heads()->>'individual' THEN
  RAISE EXCEPTION 'Latest canonical published source changed. Review recovery again.' USING ERRCODE='40001'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.content_versions d JOIN public.content_versions latest ON latest.version_id=p_source WHERE d.version_id=p_version AND d.version_number<=latest.version_number) THEN
  RAISE EXCEPTION 'This draft is not overtaken. Create a normal new draft if needed.'; END IF;
 created:=public.cms_create_draft(p_source,p_name,p_request);
 INSERT INTO cms_private.receipts VALUES(p_version,p_request,auth.uid(),payload,jsonb_build_object('version_id',created),now());
 RETURN created;
END $$;
CREATE FUNCTION public.cms_list_publications() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM cms_private.require_staff();
 RETURN coalesce((SELECT jsonb_agg(p.result||jsonb_build_object('name',w.name,'source_version',w.source_version) ORDER BY p.published_at DESC,p.version_id)
 FROM cms_private.publications p JOIN cms_private.workspaces w USING(version_id)),'[]');
END $$;
REVOKE ALL ON FUNCTION public.cms_list_publications() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cms_list_publications() TO authenticated;
REVOKE ALL ON FUNCTION cms_private.version_guard(),public.cms_list_drafts(),public.cms_read_draft(uuid),public.cms_publish_draft(uuid,integer,uuid,text,jsonb),public.cms_recover_draft(uuid,integer,uuid,text,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cms_list_drafts(),public.cms_read_draft(uuid),public.cms_publish_draft(uuid,integer,uuid,text,jsonb),public.cms_recover_draft(uuid,integer,uuid,text,uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
