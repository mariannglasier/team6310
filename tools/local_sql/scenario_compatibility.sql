-- LOCAL VERIFICATION DATABASE ONLY. Not a repository migration or hosted installer.
-- Definitions verified through read-only hosted catalogs on 2026-11-06.
-- Run only through the fixed local Docker container, after inspecting existing state.
BEGIN;
DO $$
BEGIN
  IF current_database() <> 'postgres' OR current_user <> 'postgres' THEN
    RAISE EXCEPTION 'Unexpected verification database identity';
  END IF;
  IF to_regclass('public.categories') IS NOT NULL THEN
    RAISE EXCEPTION 'Categories already exists; inspect instead of reapplying';
  END IF;
END $$;
CREATE TABLE public.categories (
  category_id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone,
  CONSTRAINT categories_pkey PRIMARY KEY (category_id)
);
ALTER TABLE public.categories OWNER TO postgres;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
-- Match hosted table ACLs; no category policies exist on hosted.
REVOKE ALL ON public.categories FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
  ON public.categories TO anon, authenticated, service_role;
ALTER TABLE public.scenarios ADD COLUMN persona_intent uuid;
ALTER TABLE public.scenarios
  ADD CONSTRAINT scenarios_category_id_fkey FOREIGN KEY (category_id)
    REFERENCES public.categories(category_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT scenarios_persona_intent_fkey FOREIGN KEY (persona_intent)
    REFERENCES public.personas(persona_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT scenarios_version_id_fkey FOREIGN KEY (version_id)
    REFERENCES public.content_versions(version_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
NOTIFY pgrst, 'reload schema';
COMMIT;
