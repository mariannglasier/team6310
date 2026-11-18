-- Stage 1: private publication persistence only; no lifecycle permission yet.
BEGIN;
DO $$
DECLARE t text; signature text;
BEGIN
  FOREACH t IN ARRAY ARRAY['jobs','personas','scenarios','choices','persona_expenses','statistics','scenario_statistics','cac_support_effects','scenario_library_metadata','scenario_fact_copy','scenario_bill_links','scenario_edition_prices'] LOOP
    IF NOT EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid=to_regclass('public.'||t) AND attname='version_id' AND atttypid='uuid'::regtype AND NOT attisdropped)
      OR NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid=to_regclass('public.'||t) AND tgname='cms_content_guard' AND tgenabled='O')
    THEN RAISE EXCEPTION 'Publication schema prerequisite missing: %',t; END IF;
  END LOOP;
  FOREACH signature IN ARRAY ARRAY['cms_private.require_staff()','cms_private.version_guard()','public.guard_bill_publication()','public.cms_create_draft(uuid,text,uuid)','public.cms_read_draft(uuid)','public.manage_scheduled_scenario_progression()','group_private.control_session(uuid,text)'] LOOP
    IF to_regprocedure(signature) IS NULL THEN RAISE EXCEPTION 'Publication function prerequisite missing: %',signature; END IF;
  END LOOP;
  IF NOT EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid='public.jobs'::regclass AND attname='weekly_gross_income' AND attgenerated='s')
    OR NOT EXISTS(SELECT 1 FROM pg_index WHERE indrelid='public.content_versions'::regclass AND indisunique AND indexrelid=to_regclass('public.content_versions_number_unique'))
    OR NOT EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid='public.content_versions'::regclass AND attname='version_number' AND atttypid='smallint'::regtype)
  THEN RAISE EXCEPTION 'Unexpected edition allocation or generated income schema'; END IF;
END $$;
CREATE TABLE cms_private.publications (
  version_id uuid PRIMARY KEY REFERENCES cms_private.workspaces(version_id),
  request_id uuid NOT NULL,
  actor uuid NOT NULL REFERENCES auth.users(id),
  saved_revision integer NOT NULL CHECK(saved_revision>=0),
  validator text NOT NULL,
  heads jsonb NOT NULL CHECK(jsonb_typeof(heads)='object'),
  published_at timestamptz NOT NULL,
  report jsonb NOT NULL,
  payload jsonb NOT NULL,
  result jsonb NOT NULL,
  UNIQUE(actor,request_id)
);
CREATE TABLE cms_private.publication_permits (
  version_id uuid PRIMARY KEY REFERENCES cms_private.workspaces(version_id),
  transaction_id xid8 NOT NULL,
  actor uuid NOT NULL,
  revision integer NOT NULL,
  request_id uuid NOT NULL
);
ALTER TABLE cms_private.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_private.publication_permits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON cms_private.publications,cms_private.publication_permits FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION cms_private.immutable_publication() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
BEGIN RAISE EXCEPTION 'Publication audit records are immutable'; END $$;
REVOKE ALL ON FUNCTION cms_private.immutable_publication() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER publication_audit_immutable BEFORE UPDATE OR DELETE ON cms_private.publications
FOR EACH ROW EXECUTE FUNCTION cms_private.immutable_publication();
COMMENT ON TABLE cms_private.publications IS 'Immutable actor-bound publication receipt and saved-edition validation snapshot. Private; no browser writes.';
COMMENT ON TABLE cms_private.publication_permits IS 'Transient exact-transaction lifecycle capability, inserted/consumed only by the protected publisher.';
COMMIT;
