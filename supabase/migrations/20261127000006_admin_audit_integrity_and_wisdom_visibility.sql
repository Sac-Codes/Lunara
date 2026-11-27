-- Restrict cross-user private-record reads to audited SECURITY DEFINER operations.
-- Limit shared Wisdom reads to published content for members; Admins retain full access.

DROP FUNCTION IF EXISTS public.append_admin_audit_log(text, uuid, jsonb);

DROP POLICY IF EXISTS "check_ins_select_admin" ON public.check_ins;
DROP POLICY IF EXISTS "journal_entries_select_admin" ON public.journal_entries;
DROP POLICY IF EXISTS "user_preferences_select_admin" ON public.user_preferences;

DROP POLICY IF EXISTS "wisdom_content_read_authenticated" ON public.wisdom_content;
DROP POLICY IF EXISTS "wisdom_content_read_published_or_admin" ON public.wisdom_content;
CREATE POLICY "wisdom_content_read_published_or_admin"
  ON public.wisdom_content
  FOR SELECT
  TO authenticated
  USING (status = 'published' OR public.is_admin());
