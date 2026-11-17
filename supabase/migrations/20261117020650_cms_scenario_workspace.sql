-- Forward CMS Stage 1. Apply locally first; no hosted deployment authorization.
BEGIN;
CREATE SCHEMA cms_private;
REVOKE ALL ON SCHEMA cms_private FROM PUBLIC,anon,authenticated,service_role;
ALTER TABLE public.content_versions ADD COLUMN cms_managed boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX content_versions_number_unique ON public.content_versions(version_number);
CREATE TABLE cms_private.workspaces (
 version_id uuid PRIMARY KEY REFERENCES public.content_versions(version_id),
 source_version uuid NOT NULL REFERENCES public.content_versions(version_id),
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 120),
 created_by uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 revision integer NOT NULL DEFAULT 0, request_id uuid NOT NULL,
 UNIQUE(created_by,request_id)
);
CREATE TABLE cms_private.lineage (
 version_id uuid NOT NULL REFERENCES cms_private.workspaces(version_id),
 table_name text NOT NULL, source_id uuid NOT NULL, draft_id uuid NOT NULL,
 PRIMARY KEY(version_id,table_name,source_id), UNIQUE(version_id,table_name,draft_id)
);
CREATE TABLE cms_private.receipts (
 version_id uuid NOT NULL REFERENCES cms_private.workspaces(version_id), request_id uuid NOT NULL,
 actor uuid NOT NULL REFERENCES auth.users(id), payload jsonb NOT NULL, result jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(version_id,request_id)
);
ALTER TABLE cms_private.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_private.lineage ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_private.receipts ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION cms_private.require_staff() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF public.is_cac_staff() IS NOT TRUE OR auth.role() IS DISTINCT FROM 'authenticated' THEN
 RAISE EXCEPTION 'Active staff access required' USING ERRCODE='42501'; END IF;
END $$;
-- Every edition writer, including maintenance, uses the publisher's existing lock.
CREATE FUNCTION cms_private.version_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  PERFORM pg_advisory_xact_lock(6310,1115);
  SELECT coalesce(max(version_number),0)+1 INTO NEW.version_number FROM public.content_versions;
  IF NEW.cms_managed THEN PERFORM cms_private.require_staff(); END IF;
  RETURN NEW;
 END IF;
 IF OLD.cms_managed OR (TG_OP='UPDATE' AND NEW.cms_managed) THEN
  RAISE EXCEPTION 'CMS editions cannot be published, reassigned or deleted';
 END IF;
 IF TG_OP='UPDATE' AND NEW.version_number IS DISTINCT FROM OLD.version_number THEN
 RAISE EXCEPTION 'Edition numbers are immutable'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER cms_version_guard BEFORE INSERT OR UPDATE OR DELETE ON public.content_versions
FOR EACH ROW EXECUTE FUNCTION cms_private.version_guard();
CREATE FUNCTION cms_private.content_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v uuid;
BEGIN
 FOR v IN SELECT DISTINCT x FROM unnest(ARRAY[
 CASE WHEN TG_OP<>'INSERT' THEN OLD.version_id END,
 CASE WHEN TG_OP<>'DELETE' THEN NEW.version_id END]) x WHERE x IS NOT NULL LOOP
  IF EXISTS(SELECT 1 FROM public.content_versions WHERE version_id=v AND cms_managed) THEN
   PERFORM cms_private.require_staff();
   IF NOT EXISTS(SELECT 1 FROM public.content_versions WHERE version_id=v AND status='draft' AND published_at IS NULL)
   THEN RAISE EXCEPTION 'Editable CMS draft required'; END IF;
  END IF;
 END LOOP;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['jobs','personas','scenarios','choices','persona_expenses','statistics','scenario_statistics','cac_support_effects','scenario_library_metadata','scenario_fact_copy','scenario_bill_links','scenario_edition_prices'] LOOP
  IF to_regclass('public.'||t) IS NULL THEN RAISE EXCEPTION 'Missing current-schema dependency: %',t; END IF;
  EXECUTE format('CREATE TRIGGER cms_content_guard BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION cms_private.content_guard()',t);
 END LOOP;
END $$;
CREATE FUNCTION public.cms_list_drafts() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM cms_private.require_staff();
 RETURN coalesce((SELECT jsonb_agg(to_jsonb(w) ORDER BY updated_at DESC) FROM cms_private.workspaces w),'[]');
END $$;
CREATE FUNCTION public.cms_read_draft(p_version uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE w cms_private.workspaces; BEGIN
 PERFORM cms_private.require_staff();
 SELECT * INTO STRICT w FROM cms_private.workspaces WHERE version_id=p_version;
 RETURN jsonb_build_object('workspace',to_jsonb(w),
 'scenarios',coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.title,s.scenario_id) FROM public.scenarios s WHERE version_id=p_version),'[]'),
 'personas',coalesce((SELECT jsonb_agg(jsonb_build_object('persona_id',persona_id,'name',name) ORDER BY name) FROM public.personas WHERE version_id=p_version),'[]'),
 'categories',coalesce((SELECT jsonb_agg(jsonb_build_object('category_id',category_id,'name',name) ORDER BY name) FROM public.categories),'[]'));
END $$;
CREATE FUNCTION public.cms_create_draft(p_source uuid,p_name text,p_request uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v uuid; prior cms_private.workspaces; tables text[]:=ARRAY['jobs','personas','scenarios','choices','persona_expenses','statistics','cac_support_effects','scenario_statistics','scenario_library_metadata','scenario_fact_copy','scenario_bill_links','scenario_edition_prices'];
 t text; key text; snapshot jsonb; item jsonb; field record; mapped uuid; cols text; q text;
BEGIN
 PERFORM cms_private.require_staff();
 IF p_request IS NULL OR p_name IS NULL OR length(btrim(p_name)) NOT BETWEEN 1 AND 120 THEN RAISE EXCEPTION 'Draft name and request required'; END IF;
 PERFORM pg_advisory_xact_lock(6310,1115);
 SELECT * INTO prior FROM cms_private.workspaces WHERE created_by=auth.uid() AND request_id=p_request;
 IF FOUND THEN
  IF prior.source_version<>p_source OR prior.name<>btrim(p_name) THEN RAISE EXCEPTION 'Request reused with different input'; END IF;
  RETURN prior.version_id;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.content_versions WHERE version_id=p_source AND status='published' AND published_at IS NOT NULL AND NOT cms_managed)
 THEN RAISE EXCEPTION 'Published source edition required'; END IF;
 -- One statement captures all source content in one MVCC snapshot.
 SELECT string_agg(format('SELECT %L AS name, coalesce(jsonb_agg(to_jsonb(r)),''[]''::jsonb) AS rows FROM public.%I r WHERE version_id=$1',x,x),' UNION ALL ') INTO q FROM unnest(tables) x;
 EXECUTE 'SELECT jsonb_object_agg(name,rows) FROM ('||q||') captured' INTO snapshot USING p_source;
 INSERT INTO public.content_versions(version_id,version_number,status,created_by,created_at,published_at,change_summary,cms_managed)
 VALUES(gen_random_uuid(),1,'draft',auth.uid(),now(),NULL,btrim(p_name),true) RETURNING version_id INTO v;
 INSERT INTO cms_private.workspaces(version_id,source_version,name,created_by,request_id) VALUES(v,p_source,btrim(p_name),auth.uid(),p_request);
 FOREACH t IN ARRAY ARRAY['jobs','personas','scenarios','choices','persona_expenses','statistics','cac_support_effects'] LOOP
  key:=CASE t WHEN 'jobs' THEN 'job_id' WHEN 'personas' THEN 'persona_id' WHEN 'scenarios' THEN 'scenario_id' WHEN 'choices' THEN 'choice_id' WHEN 'persona_expenses' THEN 'expense_id' WHEN 'statistics' THEN 'statistic_id' ELSE 'support_effect_id' END;
  INSERT INTO cms_private.lineage SELECT v,t,(r->>key)::uuid,gen_random_uuid() FROM jsonb_array_elements(snapshot->t) r;
 END LOOP;
 FOREACH t IN ARRAY tables LOOP
  SELECT string_agg(quote_ident(attname),',' ORDER BY attnum) INTO cols FROM pg_attribute WHERE attrelid=('public.'||t)::regclass AND attnum>0 AND NOT attisdropped AND attgenerated='';
  FOR item IN SELECT value FROM jsonb_array_elements(snapshot->t) LOOP
   item:=jsonb_set(item,'{version_id}',to_jsonb(v));
   -- Remap owned primary IDs and every FK into copied content, retaining shared references.
   FOR field IN SELECT a.attname AS column_name, rt.relname AS target
    FROM pg_constraint c JOIN pg_class rt ON rt.oid=c.confrelid
    JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
    WHERE c.conrelid=('public.'||t)::regclass AND c.contype='f' AND cardinality(c.conkey)=1
      AND rt.relname=ANY(ARRAY['jobs','personas','scenarios','choices','persona_expenses','statistics','cac_support_effects'])
    UNION SELECT CASE t WHEN 'jobs' THEN 'job_id' WHEN 'personas' THEN 'persona_id' WHEN 'scenarios' THEN 'scenario_id' WHEN 'choices' THEN 'choice_id' WHEN 'persona_expenses' THEN 'expense_id' WHEN 'statistics' THEN 'statistic_id' WHEN 'cac_support_effects' THEN 'support_effect_id' END,t
    WHERE t=ANY(ARRAY['jobs','personas','scenarios','choices','persona_expenses','statistics','cac_support_effects']) LOOP
     IF item->>field.column_name IS NOT NULL THEN
      SELECT draft_id INTO mapped FROM cms_private.lineage WHERE version_id=v AND table_name=field.target AND source_id=(item->>field.column_name)::uuid;
      IF NOT FOUND THEN RAISE EXCEPTION 'Cross-edition dependency in %.%',t,field.column_name; END IF;
      item:=jsonb_set(item,ARRAY[field.column_name],to_jsonb(mapped));
     END IF;
   END LOOP;
   EXECUTE format('INSERT INTO public.%I (%s) SELECT %s FROM jsonb_populate_record(NULL::public.%I,$1)',t,cols,cols,t) USING item;
  END LOOP;
 END LOOP;
 RETURN v;
END $$;
CREATE FUNCTION public.cms_save_scenario(p_version uuid,p_revision integer,p_request uuid,p_scenario uuid,p_title text,p_description text,p_category uuid,p_persona uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE w cms_private.workspaces; receipt cms_private.receipts; payload jsonb:=jsonb_build_array(p_revision,p_scenario,p_title,p_description,p_category,p_persona); sid uuid:=p_scenario; result jsonb; k integer;
BEGIN
 PERFORM cms_private.require_staff();
 SELECT * INTO STRICT w FROM cms_private.workspaces WHERE version_id=p_version FOR UPDATE;
 SELECT * INTO receipt FROM cms_private.receipts WHERE version_id=p_version AND request_id=p_request;
 IF FOUND THEN
  IF receipt.actor<>auth.uid() OR receipt.payload<>payload THEN RAISE EXCEPTION 'Request reused with different input'; END IF;
  RETURN receipt.result;
 END IF;
 IF p_request IS NULL OR p_revision IS DISTINCT FROM w.revision THEN RAISE EXCEPTION 'Draft changed. Reload before saving.' USING ERRCODE='40001'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.content_versions WHERE version_id=p_version AND cms_managed AND status='draft' AND published_at IS NULL) THEN RAISE EXCEPTION 'Editable draft required'; END IF;
 IF p_title IS NULL OR length(btrim(p_title)) NOT BETWEEN 1 AND 200 OR p_description IS NULL OR length(btrim(p_description)) NOT BETWEEN 1 AND 20000 THEN RAISE EXCEPTION 'Title and description required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.categories WHERE category_id=p_category) THEN RAISE EXCEPTION 'Valid category required'; END IF;
 IF p_persona IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.personas WHERE persona_id=p_persona AND version_id=p_version) THEN RAISE EXCEPTION 'Persona must belong to this draft'; END IF;
 IF sid IS NULL THEN
  sid:=gen_random_uuid();
  INSERT INTO public.scenarios(scenario_id,version_id,title,description,category_id,persona_intent,schedule_type,default_day)
  VALUES(sid,p_version,btrim(p_title),p_description,p_category,p_persona,'non_scheduled',NULL);
  SELECT greatest(coalesce(max(substring(library_key from 2)::integer),0),60)+1 INTO k FROM public.scenario_library_metadata WHERE version_id=p_version;
  IF k>999 THEN RAISE EXCEPTION 'Library key capacity reached'; END IF;
  INSERT INTO public.scenario_library_metadata(scenario_id,version_id,library_key,engine) VALUES(sid,p_version,'D'||lpad(k::text,3,'0'),'ordinary');
 ELSE
  UPDATE public.scenarios SET title=btrim(p_title),description=p_description,category_id=p_category,persona_intent=p_persona WHERE scenario_id=sid AND version_id=p_version;
  IF NOT FOUND THEN RAISE EXCEPTION 'Scenario does not belong to this draft'; END IF;
 END IF;
 UPDATE cms_private.workspaces SET revision=revision+1,updated_at=now() WHERE version_id=p_version;
 result:=jsonb_build_object('scenario_id',sid,'revision',w.revision+1);
 INSERT INTO cms_private.receipts VALUES(p_version,p_request,auth.uid(),payload,result,now());
 RETURN result;
END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA cms_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.cms_list_drafts(),public.cms_read_draft(uuid),public.cms_create_draft(uuid,text,uuid),public.cms_save_scenario(uuid,integer,uuid,uuid,text,text,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cms_list_drafts(),public.cms_read_draft(uuid),public.cms_create_draft(uuid,text,uuid),public.cms_save_scenario(uuid,integer,uuid,uuid,text,text,uuid,uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
