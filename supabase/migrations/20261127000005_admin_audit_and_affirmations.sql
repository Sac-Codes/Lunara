-- Persistent shared affirmations and append-only Admin audit history.
-- Apply only after review and approval.

CREATE TABLE IF NOT EXISTS public.affirmations (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  text text NOT NULL CHECK (length(trim(text)) > 0),
  category text NOT NULL CHECK (category IN (
    'Calm', 'Encouragement', 'Self-acceptance', 'Patience', 'Courage',
    'Reflection', 'Gratitude', 'Hope', 'Rest', 'Beginning again'
  )),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'inactive')),
  created_by text NOT NULL,
  scheduled_date date,
  priority integer CHECK (priority IS NULL OR priority >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affirmations_status_priority
  ON public.affirmations (status, priority, created_at DESC);

ALTER TABLE public.affirmations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.affirmations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.affirmations TO authenticated;

DROP POLICY IF EXISTS "affirmations_read_published_or_admin" ON public.affirmations;
CREATE POLICY "affirmations_read_published_or_admin"
  ON public.affirmations
  FOR SELECT
  TO authenticated
  USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "affirmations_insert_admin" ON public.affirmations;
CREATE POLICY "affirmations_insert_admin"
  ON public.affirmations
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "affirmations_update_admin" ON public.affirmations;
CREATE POLICY "affirmations_update_admin"
  ON public.affirmations
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "affirmations_delete_admin" ON public.affirmations;
CREATE POLICY "affirmations_delete_admin"
  ON public.affirmations
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

DROP TRIGGER IF EXISTS set_affirmations_updated_at ON public.affirmations;
CREATE TRIGGER set_affirmations_updated_at
  BEFORE UPDATE ON public.affirmations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.affirmations (
  id, text, category, status, created_by, priority, created_at, updated_at
)
SELECT seed.id, seed.text, seed.category, seed.status, seed.created_by,
  seed.priority, seed.created_at, seed.updated_at
FROM jsonb_to_recordset($affirmation_seed$
[
  {"id":"aff-1","text":"You don't have to figure everything out today.","category":"Calm","status":"published","created_by":"Lunara Editorial","priority":1,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-2","text":"A small pause is still progress.","category":"Rest","status":"published","created_by":"Lunara Editorial","priority":2,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-3","text":"Your feelings deserve space, not judgment.","category":"Self-acceptance","status":"published","created_by":"Lunara Editorial","priority":3,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-4","text":"It's okay to take things one step at a time.","category":"Patience","status":"published","created_by":"Lunara Editorial","priority":4,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-5","text":"You can begin again without explaining yesterday.","category":"Beginning again","status":"published","created_by":"Lunara Editorial","priority":5,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-6","text":"Not every day needs to be extraordinary.","category":"Self-acceptance","status":"published","created_by":"Lunara Editorial","priority":6,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-7","text":"You are allowed to take your time.","category":"Patience","status":"published","created_by":"Lunara Editorial","priority":7,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-8","text":"One difficult moment doesn't define your entire day.","category":"Encouragement","status":"published","created_by":"Lunara Editorial","priority":8,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-9","text":"There is value in simply noticing how you feel.","category":"Reflection","status":"published","created_by":"Lunara Editorial","priority":9,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-10","text":"You don't need to have all the answers right now.","category":"Hope","status":"published","created_by":"Lunara Editorial","priority":10,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-11","text":"Rest and reflection are worthwhile, too.","category":"Rest","status":"published","created_by":"Lunara Editorial","priority":11,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-12","text":"Be patient with the parts of life still unfolding.","category":"Courage","status":"published","created_by":"Lunara Editorial","priority":12,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-13","text":"Resting is not the same as giving up.","category":"Rest","status":"published","created_by":"Lunara Editorial","priority":13,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-14","text":"What you feel right now will not feel this way forever.","category":"Patience","status":"published","created_by":"Lunara Editorial","priority":14,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-15","text":"You have made it through every hard day so far.","category":"Encouragement","status":"published","created_by":"Lunara Editorial","priority":15,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-16","text":"Your pace is not a flaw.","category":"Self-acceptance","status":"published","created_by":"Lunara Editorial","priority":16,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-17","text":"Small efforts accumulate in ways you cannot always see.","category":"Hope","status":"published","created_by":"Lunara Editorial","priority":17,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-18","text":"It is okay not to feel okay sometimes.","category":"Self-acceptance","status":"published","created_by":"Lunara Editorial","priority":18,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-19","text":"Gratitude and difficulty can exist at the same time.","category":"Gratitude","status":"published","created_by":"Lunara Editorial","priority":19,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-20","text":"You do not need to earn rest.","category":"Rest","status":"published","created_by":"Lunara Editorial","priority":20,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-21","text":"Starting over is still moving forward.","category":"Beginning again","status":"published","created_by":"Lunara Editorial","priority":21,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-22","text":"You are allowed to feel something without it meaning everything.","category":"Self-acceptance","status":"published","created_by":"Lunara Editorial","priority":22,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-23","text":"Courage sometimes looks like just getting through the day.","category":"Courage","status":"published","created_by":"Lunara Editorial","priority":23,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-24","text":"The quiet moments matter as much as the productive ones.","category":"Calm","status":"published","created_by":"Lunara Editorial","priority":24,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-25","text":"Uncertainty is not the same as danger.","category":"Courage","status":"published","created_by":"Lunara Editorial","priority":25,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-26","text":"You can be proud of how far you have come.","category":"Gratitude","status":"published","created_by":"Lunara Editorial","priority":26,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-27","text":"Some days, surviving is enough.","category":"Self-acceptance","status":"published","created_by":"Lunara Editorial","priority":27,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-28","text":"Growth does not always feel like growth.","category":"Hope","status":"published","created_by":"Lunara Editorial","priority":28,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-29","text":"Your feelings are information, not instructions.","category":"Reflection","status":"published","created_by":"Lunara Editorial","priority":29,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-30","text":"You deserve the same patience you give to others.","category":"Patience","status":"published","created_by":"Lunara Editorial","priority":30,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-31","text":"Each new morning is a small beginning.","category":"Beginning again","status":"published","created_by":"Lunara Editorial","priority":31,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-32","text":"Difficult days do not cancel your progress.","category":"Encouragement","status":"published","created_by":"Lunara Editorial","priority":32,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-33","text":"Even a small moment of stillness is worth something.","category":"Calm","status":"published","created_by":"Lunara Editorial","priority":33,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-34","text":"You are not behind. You are where you are.","category":"Self-acceptance","status":"published","created_by":"Lunara Editorial","priority":34,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-35","text":"Some things take time, and that is okay.","category":"Patience","status":"published","created_by":"Lunara Editorial","priority":35,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"},
  {"id":"aff-36","text":"Asking for what you need is not weakness.","category":"Courage","status":"published","created_by":"Lunara Editorial","priority":36,"created_at":"2026-11-26T08:00:00.000Z","updated_at":"2026-11-26T08:00:00.000Z"}
]$affirmation_seed$::jsonb)
AS seed(
  id text, text text, category text, status text, created_by text,
  priority integer, created_at timestamptz, updated_at timestamptz
)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  actor_role text NOT NULL DEFAULT 'admin' CHECK (actor_role = 'admin'),
  action text NOT NULL CHECK (action IN (
    'user_records_viewed', 'user_data_exported',
    'affirmation_created', 'affirmation_updated', 'affirmation_deleted',
    'wisdom_created', 'wisdom_updated', 'wisdom_deleted'
  )),
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resource_type text NOT NULL CHECK (length(trim(resource_type)) > 0),
  resource_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON public.audit_logs (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_created
  ON public.audit_logs (target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created
  ON public.audit_logs (action, created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.audit_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.audit_logs TO authenticated;

DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.admin_get_user_records_audited(
  p_target_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  result jsonb;
BEGIN
  IF actor_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only verified administrators can view user records'
      USING ERRCODE = '42501';
  END IF;
  IF p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'A target account is required'
      USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_target_user_id)
     OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_target_user_id) THEN
    RAISE EXCEPTION 'The target account was not found or has no role record'
      USING ERRCODE = 'P0002';
  END IF;

  BEGIN
    INSERT INTO public.audit_logs (
      actor_user_id, actor_role, action, target_user_id, resource_type, resource_id, metadata
    )
    VALUES (
      actor_id, 'admin', 'user_records_viewed', p_target_user_id,
      'user', p_target_user_id::text, '{}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Required audit logging failed; no user records were returned'
      USING ERRCODE = 'P0001';
  END;

  SELECT jsonb_build_object(
    'checkIns', COALESCE((
      SELECT jsonb_agg(to_jsonb(c) ORDER BY c.check_in_date DESC, c.updated_at DESC)
      FROM public.check_ins AS c
      WHERE c.user_id = p_target_user_id
    ), '[]'::jsonb),
    'journals', COALESCE((
      SELECT jsonb_agg(to_jsonb(j) ORDER BY j.entry_date DESC, j.updated_at DESC)
      FROM public.journal_entries AS j
      WHERE j.user_id = p_target_user_id
    ), '[]'::jsonb),
    'profile', (
      SELECT to_jsonb(p)
      FROM public.profiles AS p
      WHERE p.id = p_target_user_id
    ),
    'role', (
      SELECT r.role
      FROM public.user_roles AS r
      WHERE r.user_id = p_target_user_id
    ),
    'preferences', (
      SELECT to_jsonb(prefs)
      FROM public.user_preferences AS prefs
      WHERE prefs.user_id = p_target_user_id
    )
  )
  INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_user_records_audited(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_user_records_audited(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_prepare_user_export_audited(
  p_target_user_id uuid,
  p_format text,
  p_categories text[],
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_confirm_journals boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  allowed_categories text[] := ARRAY[
    'profile', 'checkIns', 'metrics', 'likesDislikes', 'journals',
    'activitySummary', 'calendarSummary'
  ];
  result jsonb;
  include_checkins boolean;
  include_journals boolean;
BEGIN
  IF actor_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only verified administrators can prepare user exports'
      USING ERRCODE = '42501';
  END IF;
  IF p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'A target account is required'
      USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_target_user_id)
     OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_target_user_id) THEN
    RAISE EXCEPTION 'The target account was not found or has no role record'
      USING ERRCODE = 'P0002';
  END IF;
  IF p_format IS NULL OR p_format NOT IN ('json', 'csv', 'html') THEN
    RAISE EXCEPTION 'Unsupported export format'
      USING ERRCODE = '22023';
  END IF;
  IF COALESCE(cardinality(p_categories), 0) = 0
     OR EXISTS (
       SELECT 1
       FROM unnest(p_categories) AS requested(category)
       WHERE requested.category IS NULL
          OR NOT (requested.category = ANY(allowed_categories))
     )
     OR cardinality(p_categories) <> (
       SELECT count(DISTINCT requested.category)
       FROM unnest(p_categories) AS requested(category)
     ) THEN
    RAISE EXCEPTION 'Export categories are invalid'
      USING ERRCODE = '22023';
  END IF;
  IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL AND p_start_date > p_end_date THEN
    RAISE EXCEPTION 'The export start date must not be after the end date'
      USING ERRCODE = '22023';
  END IF;
  IF 'journals' = ANY(p_categories) AND NOT COALESCE(p_confirm_journals, false) THEN
    RAISE EXCEPTION 'Explicit confirmation is required to include journal entries'
      USING ERRCODE = '22023';
  END IF;

  include_checkins := p_categories && ARRAY['checkIns', 'metrics', 'likesDislikes'];
  include_journals := 'journals' = ANY(p_categories);

  BEGIN
    INSERT INTO public.audit_logs (
      actor_user_id, actor_role, action, target_user_id, resource_type, resource_id, metadata
    )
    VALUES (
      actor_id, 'admin', 'user_data_exported', p_target_user_id,
      'user', p_target_user_id::text,
      jsonb_build_object('format', p_format, 'categories', to_jsonb(p_categories))
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Required audit logging failed; no export data was returned'
      USING ERRCODE = 'P0001';
  END;

  SELECT jsonb_build_object(
    'profile', CASE WHEN 'profile' = ANY(p_categories) THEN (
      SELECT jsonb_build_object(
        'id', p.id,
        'displayName', p.display_name,
        'role', r.role,
        'createdAt', p.created_at,
        'preferredCheckInTime', p.preferred_check_in_time
      )
      FROM public.profiles AS p
      JOIN public.user_roles AS r ON r.user_id = p.id
      WHERE p.id = p_target_user_id
    ) ELSE NULL END,
    'preferences', CASE WHEN 'profile' = ANY(p_categories) THEN (
      SELECT to_jsonb(prefs)
      FROM public.user_preferences AS prefs
      WHERE prefs.user_id = p_target_user_id
    ) ELSE NULL END,
    'checkIns', CASE WHEN include_checkins THEN COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', c.check_in_date,
          'mood', CASE WHEN 'checkIns' = ANY(p_categories) THEN c.mood END,
          'notes', CASE WHEN 'checkIns' = ANY(p_categories) THEN c.notes END,
          'activities', CASE WHEN 'checkIns' = ANY(p_categories) THEN c.activities END,
          'customActivities', CASE WHEN 'checkIns' = ANY(p_categories) THEN c.custom_activities END,
          'proudOf', CASE WHEN 'checkIns' = ANY(p_categories) THEN c.proud_of END,
          'needs', CASE WHEN 'checkIns' = ANY(p_categories) THEN c.needs END,
          'tomorrowIntention', CASE WHEN 'checkIns' = ANY(p_categories) THEN c.tomorrow_intention END,
          'customValues', CASE WHEN 'checkIns' = ANY(p_categories) THEN c.custom_values END,
          'happiness', CASE WHEN 'metrics' = ANY(p_categories) THEN c.happiness END,
          'energy', CASE WHEN 'metrics' = ANY(p_categories) THEN c.energy END,
          'stress', CASE WHEN 'metrics' = ANY(p_categories) THEN c.stress END,
          'likes', CASE WHEN 'likesDislikes' = ANY(p_categories) THEN c.likes END,
          'dislikes', CASE WHEN 'likesDislikes' = ANY(p_categories) THEN c.dislikes END
        )
        ORDER BY c.check_in_date DESC, c.updated_at DESC
      )
      FROM public.check_ins AS c
      WHERE c.user_id = p_target_user_id
        AND (p_start_date IS NULL OR c.check_in_date >= p_start_date)
        AND (p_end_date IS NULL OR c.check_in_date <= p_end_date)
    ), '[]'::jsonb) ELSE '[]'::jsonb END,
    'journals', CASE WHEN include_journals THEN COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', j.id,
          'date', j.entry_date,
          'title', j.title,
          'content', j.content,
          'tags', j.tags,
          'createdAt', j.created_at,
          'updatedAt', j.updated_at
        )
        ORDER BY j.entry_date DESC, j.updated_at DESC
      )
      FROM public.journal_entries AS j
      WHERE j.user_id = p_target_user_id
        AND (p_start_date IS NULL OR j.entry_date >= p_start_date)
        AND (p_end_date IS NULL OR j.entry_date <= p_end_date)
    ), '[]'::jsonb) ELSE '[]'::jsonb END,
    'activitySummary', CASE WHEN 'activitySummary' = ANY(p_categories) THEN jsonb_build_object(
      'totalCheckIns', (
        SELECT count(*) FROM public.check_ins AS c
        WHERE c.user_id = p_target_user_id
          AND (p_start_date IS NULL OR c.check_in_date >= p_start_date)
          AND (p_end_date IS NULL OR c.check_in_date <= p_end_date)
      ),
      'totalJournals', (
        SELECT count(*) FROM public.journal_entries AS j
        WHERE j.user_id = p_target_user_id
          AND (p_start_date IS NULL OR j.entry_date >= p_start_date)
          AND (p_end_date IS NULL OR j.entry_date <= p_end_date)
      )
    ) ELSE NULL END,
    'calendarDates', CASE WHEN 'calendarSummary' = ANY(p_categories) THEN jsonb_build_object(
      'checkInDates', COALESCE((
        SELECT jsonb_agg(c.check_in_date ORDER BY c.check_in_date DESC)
        FROM public.check_ins AS c
        WHERE c.user_id = p_target_user_id
          AND (p_start_date IS NULL OR c.check_in_date >= p_start_date)
          AND (p_end_date IS NULL OR c.check_in_date <= p_end_date)
      ), '[]'::jsonb),
      'journalDates', COALESCE((
        SELECT jsonb_agg(j.entry_date ORDER BY j.entry_date DESC)
        FROM public.journal_entries AS j
        WHERE j.user_id = p_target_user_id
          AND (p_start_date IS NULL OR j.entry_date >= p_start_date)
          AND (p_end_date IS NULL OR j.entry_date <= p_end_date)
      ), '[]'::jsonb)
    ) ELSE NULL END
  )
  INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_prepare_user_export_audited(uuid, text, text[], date, date, boolean)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_prepare_user_export_audited(uuid, text, text[], date, date, boolean)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.audit_shared_content_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  event_action text;
  resource_identifier text;
BEGIN
  IF actor_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only verified administrators may change audited shared content'
      USING ERRCODE = '42501';
  END IF;

  event_action := CASE
    WHEN TG_TABLE_NAME = 'affirmations' AND TG_OP = 'INSERT' THEN 'affirmation_created'
    WHEN TG_TABLE_NAME = 'affirmations' AND TG_OP = 'UPDATE' THEN 'affirmation_updated'
    WHEN TG_TABLE_NAME = 'affirmations' AND TG_OP = 'DELETE' THEN 'affirmation_deleted'
    WHEN TG_TABLE_NAME = 'wisdom_content' AND TG_OP = 'INSERT' THEN 'wisdom_created'
    WHEN TG_TABLE_NAME = 'wisdom_content' AND TG_OP = 'UPDATE' THEN 'wisdom_updated'
    WHEN TG_TABLE_NAME = 'wisdom_content' AND TG_OP = 'DELETE' THEN 'wisdom_deleted'
  END;
  resource_identifier := CASE
    WHEN TG_OP = 'DELETE' THEN OLD.id::text
    ELSE NEW.id::text
  END;

  INSERT INTO public.audit_logs (
    actor_user_id, actor_role, action, resource_type, resource_id, metadata
  )
  VALUES (
    actor_id, 'admin', event_action, TG_TABLE_NAME, resource_identifier, '{}'::jsonb
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_shared_content_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS audit_affirmations_change ON public.affirmations;
CREATE TRIGGER audit_affirmations_change
  AFTER INSERT OR UPDATE OR DELETE ON public.affirmations
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_shared_content_change();

DROP TRIGGER IF EXISTS audit_wisdom_content_change ON public.wisdom_content;
CREATE TRIGGER audit_wisdom_content_change
  AFTER INSERT OR UPDATE OR DELETE ON public.wisdom_content
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_shared_content_change();
