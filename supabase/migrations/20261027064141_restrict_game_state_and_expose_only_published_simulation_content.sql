-- Recorded from the live project's migration history.
DO $$ DECLARE t text; BEGIN
FOREACH t IN ARRAY ARRAY['content_versions','personas','scenarios','choices','statistics','scenario_statistics','persona_expenses','cac_support_effects','group_sessions','playthroughs','player_responses','playthrough_expenses'] LOOP
 EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated',t);
END LOOP; END $$;
GRANT SELECT ON public.content_versions, public.personas, public.scenarios, public.choices, public.statistics, public.scenario_statistics, public.persona_expenses, public.cac_support_effects TO anon,authenticated;
CREATE POLICY "public_read_published_versions" ON public.content_versions FOR SELECT TO anon,authenticated USING (status='published' AND published_at IS NOT NULL);
CREATE POLICY "public_read_published_personas" ON public.personas FOR SELECT TO anon,authenticated USING (version_id IN (SELECT version_id FROM public.content_versions WHERE status='published' AND published_at IS NOT NULL));
CREATE POLICY "public_read_published_scenarios" ON public.scenarios FOR SELECT TO anon,authenticated USING (version_id IN (SELECT version_id FROM public.content_versions WHERE status='published' AND published_at IS NOT NULL));
CREATE POLICY "public_read_published_choices" ON public.choices FOR SELECT TO anon,authenticated USING (version_id IN (SELECT version_id FROM public.content_versions WHERE status='published' AND published_at IS NOT NULL));
CREATE POLICY "public_read_published_statistics" ON public.statistics FOR SELECT TO anon,authenticated USING (version_id IN (SELECT version_id FROM public.content_versions WHERE status='published' AND published_at IS NOT NULL));
CREATE POLICY "public_read_published_scenario_statistics" ON public.scenario_statistics FOR SELECT TO anon,authenticated USING (version_id IN (SELECT version_id FROM public.content_versions WHERE status='published' AND published_at IS NOT NULL));
CREATE POLICY "public_read_published_persona_expenses" ON public.persona_expenses FOR SELECT TO anon,authenticated USING (version_id IN (SELECT version_id FROM public.content_versions WHERE status='published' AND published_at IS NOT NULL));
CREATE POLICY "public_read_published_support_effects" ON public.cac_support_effects FOR SELECT TO anon,authenticated USING (version_id IN (SELECT version_id FROM public.content_versions WHERE status='published' AND published_at IS NOT NULL));
DROP POLICY IF EXISTS "read_approved_active_jobs" ON public.jobs;
CREATE POLICY "read_approved_active_jobs" ON public.jobs FOR SELECT TO anon,authenticated USING (is_active AND is_approved AND version_id IN (SELECT version_id FROM public.content_versions WHERE status='published' AND published_at IS NOT NULL));
