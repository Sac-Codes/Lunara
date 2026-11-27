-- Lunara Phase 2C: Allow verified backend administrators to perform legitimate
-- cross-user management while preserving strict role and RLS enforcement.

DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "check_ins_select_admin" ON public.check_ins;
CREATE POLICY "check_ins_select_admin"
  ON public.check_ins
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "journal_entries_select_admin" ON public.journal_entries;
CREATE POLICY "journal_entries_select_admin"
  ON public.journal_entries
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "saved_wisdom_select_admin" ON public.saved_wisdom;
CREATE POLICY "saved_wisdom_select_admin"
  ON public.saved_wisdom
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "user_preferences_select_admin" ON public.user_preferences;
CREATE POLICY "user_preferences_select_admin"
  ON public.user_preferences
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "notifications_select_admin" ON public.notifications;
CREATE POLICY "notifications_select_admin"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (public.is_admin());
