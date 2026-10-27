-- Recorded from the live project's migration history.
-- Note: the live playthroughs column is spelled cac_support_enabledabled; it is preserved
-- exactly because the applied policy and RPC reference it. Renaming needs a separate migration.
ALTER TABLE public.playthroughs ADD COLUMN owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX playthrough_owner_user_idx ON public.playthroughs(owner_user_id);
ALTER TABLE public.group_sessions ADD COLUMN host_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE TABLE public.group_participants (
 session_id uuid NOT NULL REFERENCES public.group_sessions(session_id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 joined_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(session_id,user_id)
);
ALTER TABLE public.group_participants ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.playthroughs, public.playthrough_expenses, public.player_responses, public.group_sessions, public.group_participants TO authenticated;
GRANT INSERT ON public.playthroughs,public.group_sessions,public.group_participants TO authenticated;
CREATE POLICY "player_read_own_playthrough" ON public.playthroughs FOR SELECT TO authenticated USING (owner_user_id = (select auth.uid()));
CREATE POLICY "player_start_own_playthrough" ON public.playthroughs FOR INSERT TO authenticated WITH CHECK (
 owner_user_id = (select auth.uid())
 AND session_id IS NULL
 AND status = 'active'
 AND current_day = 1
 AND current_scenario_id IS NULL
 AND current_job_id IS NULL
 AND employment_state IS NULL
 AND cac_support_enabledabled IS NULL
 AND started_at IS NOT NULL
 AND current_balance = (SELECT coalesce(p.general_starting_balance,0) FROM public.personas p WHERE p.persona_id = playthroughs.persona_id AND p.version_id = playthroughs.version_id)
 AND EXISTS (SELECT 1 FROM public.content_versions v WHERE v.version_id=playthroughs.version_id AND v.status='published' AND v.published_at IS NOT NULL)
);
CREATE POLICY "player_read_own_responses" ON public.player_responses FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.playthroughs p WHERE p.playthrough_id=player_responses.playthrough_id AND p.owner_user_id=(select auth.uid())));
CREATE POLICY "player_read_own_expenses" ON public.playthrough_expenses FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.playthroughs p WHERE p.playthrough_id=playthrough_expenses.playthrough_id AND p.owner_user_id=(select auth.uid())));
CREATE POLICY "host_read_group" ON public.group_sessions FOR SELECT TO authenticated USING (host_user_id=(select auth.uid()) OR EXISTS(SELECT 1 FROM public.group_participants m WHERE m.session_id=group_sessions.session_id AND m.user_id=(select auth.uid())));
CREATE POLICY "host_create_group" ON public.group_sessions FOR INSERT TO authenticated WITH CHECK (host_user_id=(select auth.uid()) AND status='waiting' AND current_scenario_id IS NULL AND round_deadline IS NULL AND facilitator_user_id IS NULL AND EXISTS (SELECT 1 FROM public.content_versions v WHERE v.version_id=group_sessions.version_id AND v.status='published' AND v.published_at IS NOT NULL));
CREATE POLICY "member_read_own_membership" ON public.group_participants FOR SELECT TO authenticated USING (user_id=(select auth.uid()));
CREATE POLICY "member_join_self" ON public.group_participants FOR INSERT TO authenticated WITH CHECK (user_id=(select auth.uid()) AND EXISTS(SELECT 1 FROM public.group_sessions g WHERE g.session_id=group_participants.session_id AND g.host_user_id=(select auth.uid())));
