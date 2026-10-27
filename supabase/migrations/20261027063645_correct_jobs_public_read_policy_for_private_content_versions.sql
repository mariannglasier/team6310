-- Recorded from the live project's migration history; superseded by 20261027064141.
DROP POLICY IF EXISTS "read_approved_active_jobs" ON public.jobs;
CREATE POLICY "read_approved_active_jobs" ON public.jobs FOR SELECT TO anon,authenticated
USING (is_active AND is_approved AND version_id IS NOT NULL);
COMMENT ON POLICY "read_approved_active_jobs" ON public.jobs IS 'Only approved jobs activated by trusted admin/publisher, versioned content. Avoid depending on content_versions RLS for anonymous query.';
