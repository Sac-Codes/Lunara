-- Lunara Phase 2A: Initial PostgreSQL Schema
-- Non-destructive, reproducible migration for core user tables, constraints, indexes, and updated_at triggers.

-- Ensure pgcrypto/gen_random_uuid availability
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Shared trigger function for automatic updated_at maintenance
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1. Profiles (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  preferred_check_in_time text NOT NULL DEFAULT 'evening'
    CHECK (preferred_check_in_time IN ('morning', 'evening', 'anytime')),
  daily_reminder_enabled boolean NOT NULL DEFAULT false,
  reminder_time text NOT NULL DEFAULT '20:30',
  show_greeting_prompts boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 2. User Roles (strictly controlled; never self-assignable)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_user_id_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);

CREATE TRIGGER set_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 3. Check-ins (one entry per user per calendar date)
CREATE TABLE IF NOT EXISTS public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_date date NOT NULL,
  mood text CHECK (mood IS NULL OR mood IN ('great', 'good', 'okay', 'low', 'difficult', 'unsure')),
  happiness smallint CHECK (happiness IS NULL OR (happiness BETWEEN 1 AND 5)),
  energy smallint CHECK (energy IS NULL OR (energy BETWEEN 1 AND 5)),
  stress smallint CHECK (stress IS NULL OR (stress BETWEEN 1 AND 5)),
  likes text[] NOT NULL DEFAULT '{}',
  dislikes text[] NOT NULL DEFAULT '{}',
  activities text[] NOT NULL DEFAULT '{}',
  custom_activities text[] NOT NULL DEFAULT '{}',
  proud_of text NOT NULL DEFAULT '',
  needs text[] NOT NULL DEFAULT '{}',
  tomorrow_intention text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  custom_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_ins_user_date_unique UNIQUE (user_id, check_in_date)
);

CREATE INDEX IF NOT EXISTS idx_check_ins_user_date ON public.check_ins (user_id, check_in_date DESC);

CREATE TRIGGER set_check_ins_updated_at
  BEFORE UPDATE ON public.check_ins
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4. Journal Entries
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON public.journal_entries (user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_fav
  ON public.journal_entries (user_id, is_favorite)
  WHERE is_favorite = true;

CREATE TRIGGER set_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 5. Saved Wisdom (references stable wisdom_id without duplicating verse content)
CREATE TABLE IF NOT EXISTS public.saved_wisdom (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wisdom_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saved_wisdom_user_wisdom_unique UNIQUE (user_id, wisdom_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_wisdom_user_created ON public.saved_wisdom (user_id, created_at DESC);

-- 6. User Preferences (theme, favorite affirmations, notification toggles)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_mode text NOT NULL DEFAULT 'dark' CHECK (theme_mode IN ('light', 'dark', 'system')),
  favorite_affirmation_ids text[] NOT NULL DEFAULT '{}',
  notify_affirmations boolean NOT NULL DEFAULT true,
  notify_daily_wisdom boolean NOT NULL DEFAULT true,
  notify_gentle_reminders boolean NOT NULL DEFAULT false,
  notify_admin_messages boolean NOT NULL DEFAULT true,
  notify_announcements boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 7. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  category text NOT NULL DEFAULT 'general'
    CHECK (category IN ('general', 'announcement', 'reminder', 'update', 'affirmation', 'encouragement')),
  is_read boolean NOT NULL DEFAULT false,
  sender text NOT NULL DEFAULT 'Lunara',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications (user_id, created_at DESC);

CREATE TRIGGER set_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
