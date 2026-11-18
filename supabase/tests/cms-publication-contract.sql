\set ON_ERROR_STOP on
BEGIN;
DO $$ DECLARE r text; t text; BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  FOREACH t IN ARRAY ARRAY['publications','publication_permits'] LOOP
   ASSERT NOT has_table_privilege(r,'cms_private.'||t,'SELECT,INSERT,UPDATE,DELETE');
   ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid=('cms_private.'||t)::regclass);
  END LOOP;
 END LOOP;
 ASSERT position('CMS editions cannot be published' IN pg_get_functiondef('cms_private.version_guard()'::regprocedure))>0;
 ASSERT NOT EXISTS(SELECT 1 FROM cms_private.publication_permits);
 ASSERT NOT has_table_privilege('authenticated','public.content_versions','UPDATE');
 ASSERT NOT has_table_privilege('authenticated','public.jobs','UPDATE');
 ASSERT (SELECT attgenerated='s' FROM pg_attribute WHERE attrelid='public.jobs'::regclass AND attname='weekly_gross_income');
 ASSERT EXISTS(SELECT 1 FROM pg_index WHERE indexrelid='public.content_versions_number_unique'::regclass AND indisunique);
 RAISE NOTICE 'Stage 1 private persistence, RLS, ACLs, existing publication guard, allocator and generated income passed';
END $$;
ROLLBACK;
