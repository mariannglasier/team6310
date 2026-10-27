-- Recorded from the live project's migration history (cac-poverty-exercise); applied earlier
-- through the Supabase connection and added here so the repository matches the database.
-- Requires public.content_versions, public.personas and public.playthroughs to already exist.
CREATE TABLE public.jobs (
 job_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 version_id uuid REFERENCES public.content_versions(version_id),
 soc_code text NOT NULL CHECK (soc_code ~ '^[0-9]{2}-[0-9]{4}$'),
 title text NOT NULL,
 description text,
 area_code text NOT NULL DEFAULT '12060',
 area_name text NOT NULL DEFAULT 'Atlanta-Sandy Springs-Roswell, GA',
 geography_level text NOT NULL DEFAULT 'MSA' CHECK (geography_level IN ('MSA','STATE')),
 wage_year integer CHECK (wage_year BETWEEN 2000 AND 2100),
 median_hourly_wage numeric(10,2) CHECK (median_hourly_wage >= 0),
 hours_per_week numeric(5,2) NOT NULL DEFAULT 40 CHECK (hours_per_week > 0 AND hours_per_week <= 168),
 weekly_gross_income numeric(12,2) GENERATED ALWAYS AS (round(median_hourly_wage * hours_per_week,2)) STORED,
 entry_education text,
 related_experience text,
 on_job_training text,
 simulation_requirements jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(simulation_requirements) = 'object'),
 wage_source_url text NOT NULL DEFAULT 'https://www.bls.gov/oes/tables.htm',
 requirements_source_url text,
 reviewed_at timestamptz,
 last_synced_at timestamptz,
 is_approved boolean NOT NULL DEFAULT false,
 is_active boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(version_id,soc_code),
 CHECK (NOT is_active OR (is_approved AND version_id IS NOT NULL AND median_hourly_wage IS NOT NULL AND wage_year IS NOT NULL AND reviewed_at IS NOT NULL))
);
CREATE INDEX jobs_version_active_idx ON public.jobs(version_id) WHERE is_active = true;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.jobs FROM anon,authenticated;
GRANT SELECT ON public.jobs TO anon,authenticated;
CREATE POLICY "read_approved_active_jobs" ON public.jobs FOR SELECT TO anon,authenticated USING (
 is_active AND is_approved AND EXISTS (
 SELECT 1 FROM public.content_versions cv WHERE cv.version_id = jobs.version_id AND cv.status = 'published'
 )
);
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS starting_job_id uuid REFERENCES public.jobs(job_id);
ALTER TABLE public.playthroughs ADD COLUMN IF NOT EXISTS current_job_id uuid REFERENCES public.jobs(job_id);
COMMENT ON TABLE public.jobs IS 'Curated, content-versioned CAC simulation jobs with BLS median hourly wages; no unpublished wages or games modified by automatic sync.';
