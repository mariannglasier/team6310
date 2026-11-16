-- LOCAL VERIFICATION ONLY. Not a production or historical migration.
-- Current reviewed catalog captured read-only on 2026-11-13; no hosted data.
-- Prerequisite: the existing November 9 migrations, in filename order.
-- These two base tables have no creation migration in the repository.
BEGIN;
SET LOCAL search_path=public,pg_catalog;
CREATE TABLE public.cac_services (
  "service_key" text NOT NULL,
  "service_name" text NOT NULL,
  "confirmed_by" uuid NOT NULL,
  "confirmed_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.cac_services OWNER TO postgres;
ALTER TABLE public.cac_services ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cac_services FROM PUBLIC,anon,authenticated,service_role;
ALTER TABLE public.cac_services ADD CONSTRAINT "cac_services_confirmed_by_fkey" FOREIGN KEY (confirmed_by) REFERENCES auth.users(id);
ALTER TABLE public.cac_services ADD CONSTRAINT "cac_services_pkey" PRIMARY KEY (service_key);
ALTER TABLE public.cac_services ADD CONSTRAINT "cac_services_service_key_check" CHECK ((service_key ~ '^[a-z][a-z0-9_]{1,99}$'::text));
ALTER TABLE public.cac_services ADD CONSTRAINT "cac_services_service_name_check" CHECK (((length(btrim(service_name)) >= 1) AND (length(btrim(service_name)) <= 200)));
CREATE POLICY "staff_read_services" ON public.cac_services AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_cac_staff());
GRANT INSERT ON public.cac_services TO "service_role";
GRANT SELECT ON public.cac_services TO "service_role";
GRANT UPDATE ON public.cac_services TO "service_role";
GRANT DELETE ON public.cac_services TO "service_role";
GRANT TRUNCATE ON public.cac_services TO "service_role";
GRANT REFERENCES ON public.cac_services TO "service_role";
GRANT TRIGGER ON public.cac_services TO "service_role";
GRANT MAINTAIN ON public.cac_services TO "service_role";
GRANT SELECT ON public.cac_services TO "authenticated";
CREATE TABLE public.cac_service_facts (
  "fact_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "service_key" character varying NOT NULL,
  "fact_key" character varying NOT NULL,
  "fact_title" text NOT NULL,
  "value" numeric NOT NULL,
  "unit" text NOT NULL,
  "reporting_year" integer NOT NULL
);
ALTER TABLE public.cac_service_facts OWNER TO postgres;
ALTER TABLE public.cac_service_facts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cac_service_facts FROM PUBLIC,anon,authenticated,service_role;
ALTER TABLE public.cac_service_facts ADD CONSTRAINT "cac_service_facts_finite" CHECK (((value)::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text])));
ALTER TABLE public.cac_service_facts ADD CONSTRAINT "cac_service_facts_identity" UNIQUE (service_key, fact_key, reporting_year);
ALTER TABLE public.cac_service_facts ADD CONSTRAINT "cac_service_facts_key" CHECK (((fact_key)::text ~ '^[a-z][a-z0-9_]{1,99}$'::text));
ALTER TABLE public.cac_service_facts ADD CONSTRAINT "cac_service_facts_pkey" PRIMARY KEY (fact_id);
ALTER TABLE public.cac_service_facts ADD CONSTRAINT "cac_service_facts_service_fkey" FOREIGN KEY (service_key) REFERENCES cac_services(service_key);
ALTER TABLE public.cac_service_facts ADD CONSTRAINT "cac_service_facts_year" CHECK (((reporting_year >= 1900) AND (reporting_year <= 2199)));
CREATE POLICY "staff_read_service_facts" ON public.cac_service_facts AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_cac_staff());
GRANT INSERT ON public.cac_service_facts TO "service_role";
GRANT SELECT ON public.cac_service_facts TO "service_role";
GRANT UPDATE ON public.cac_service_facts TO "service_role";
GRANT DELETE ON public.cac_service_facts TO "service_role";
GRANT TRUNCATE ON public.cac_service_facts TO "service_role";
GRANT REFERENCES ON public.cac_service_facts TO "service_role";
GRANT TRIGGER ON public.cac_service_facts TO "service_role";
GRANT MAINTAIN ON public.cac_service_facts TO "service_role";
GRANT SELECT ON public.cac_service_facts TO "authenticated";
-- Names only: catalog comparison confirmed identical constraint/policy expressions.
ALTER TABLE public.scenario_statistics RENAME CONSTRAINT scenario_statistics_statistic_id_fke TO scenario_statistics_statistic_id_fkey;
ALTER TABLE public.playthrough_expenses RENAME CONSTRAINT playthrough_expenses_playthrough_id TO playthrough_expenses_playthrough_id_fkey;
ALTER TABLE public.playthrough_expenses RENAME CONSTRAINT playthrough_expenses_version_id_fke TO playthrough_expenses_version_id_fkey;
ALTER POLICY public_read_published_scenario_stati ON public.scenario_statistics RENAME TO public_read_published_scenario_statistics;
ALTER POLICY public_read_published_support_effect ON public.cac_support_effects RENAME TO public_read_published_support_effects;
NOTIFY pgrst,'reload schema';
COMMIT;
