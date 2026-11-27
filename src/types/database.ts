import type {
  AffirmationCategory,
  AffirmationItem,
  MoodId,
  NotificationCategory,
  ThemeMode,
  UserProfile,
  UserRole,
  WisdomEntry,
  WisdomTopic,
} from './lunara';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          preferred_check_in_time: UserProfile['preferredCheckInTime'];
          daily_reminder_enabled: boolean;
          reminder_time: string;
          show_greeting_prompts: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          avatar_url?: string | null;
          preferred_check_in_time?: UserProfile['preferredCheckInTime'];
          daily_reminder_enabled?: boolean;
          reminder_time?: string;
          show_greeting_prompts?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          preferred_check_in_time?: UserProfile['preferredCheckInTime'];
          daily_reminder_enabled?: boolean;
          reminder_time?: string;
          show_greeting_prompts?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      affirmations: {
        Row: {
          id: string;
          text: string;
          category: AffirmationCategory;
          status: AffirmationItem['status'];
          created_by: string;
          scheduled_date: string | null;
          priority: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          text: string;
          category: AffirmationCategory;
          status?: AffirmationItem['status'];
          created_by: string;
          scheduled_date?: string | null;
          priority?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          text?: string;
          category?: AffirmationCategory;
          status?: AffirmationItem['status'];
          created_by?: string;
          scheduled_date?: string | null;
          priority?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      check_ins: {
        Row: {
          id: string;
          user_id: string;
          check_in_date: string;
          mood: MoodId | null;
          happiness: number | null;
          energy: number | null;
          stress: number | null;
          likes: string[];
          dislikes: string[];
          activities: string[];
          custom_activities: string[];
          proud_of: string;
          needs: string[];
          tomorrow_intention: string;
          notes: string;
          custom_values: Record<string, string | number>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          check_in_date: string;
          mood?: MoodId | null;
          happiness?: number | null;
          energy?: number | null;
          stress?: number | null;
          likes?: string[];
          dislikes?: string[];
          activities?: string[];
          custom_activities?: string[];
          proud_of?: string;
          needs?: string[];
          tomorrow_intention?: string;
          notes?: string;
          custom_values?: Record<string, string | number>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          check_in_date?: string;
          mood?: MoodId | null;
          happiness?: number | null;
          energy?: number | null;
          stress?: number | null;
          likes?: string[];
          dislikes?: string[];
          activities?: string[];
          custom_activities?: string[];
          proud_of?: string;
          needs?: string[];
          tomorrow_intention?: string;
          notes?: string;
          custom_values?: Record<string, string | number>;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          entry_date: string;
          title: string;
          content: string;
          tags: string[];
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entry_date: string;
          title?: string;
          content?: string;
          tags?: string[];
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entry_date?: string;
          title?: string;
          content?: string;
          tags?: string[];
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      saved_wisdom: {
        Row: {
          id: string;
          user_id: string;
          wisdom_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          wisdom_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          wisdom_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      wisdom_content: {
        Row: {
          id: string;
          title: string;
          scripture: WisdomEntry['scripture'];
          chapter: number;
          verse: string;
          sanskrit: string;
          transliteration: string;
          meaning: string;
          learning: string;
          reflection_prompt: string;
          takeaway: string;
          topic: WisdomTopic;
          source_note: string;
          status: WisdomEntry['status'];
          is_featured: boolean;
          is_daily: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          scripture?: WisdomEntry['scripture'];
          chapter: number;
          verse: string;
          sanskrit: string;
          transliteration?: string;
          meaning: string;
          learning?: string;
          reflection_prompt: string;
          takeaway: string;
          topic: WisdomTopic;
          source_note?: string;
          status?: WisdomEntry['status'];
          is_featured?: boolean;
          is_daily?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          scripture?: WisdomEntry['scripture'];
          chapter?: number;
          verse?: string;
          sanskrit?: string;
          transliteration?: string;
          meaning?: string;
          learning?: string;
          reflection_prompt?: string;
          takeaway?: string;
          topic?: WisdomTopic;
          source_note?: string;
          status?: WisdomEntry['status'];
          is_featured?: boolean;
          is_daily?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_user_id: string;
          actor_role: 'admin';
          action: string;
          target_user_id: string | null;
          resource_type: string;
          resource_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id: string;
          actor_role: 'admin';
          action: string;
          target_user_id?: string | null;
          resource_type: string;
          resource_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_user_id?: string;
          actor_role?: 'admin';
          action?: string;
          target_user_id?: string | null;
          resource_type?: string;
          resource_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          user_id: string;
          theme_mode: ThemeMode;
          favorite_affirmation_ids: string[];
          notify_affirmations: boolean;
          notify_daily_wisdom: boolean;
          notify_gentle_reminders: boolean;
          notify_admin_messages: boolean;
          notify_announcements: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          theme_mode?: ThemeMode;
          favorite_affirmation_ids?: string[];
          notify_affirmations?: boolean;
          notify_daily_wisdom?: boolean;
          notify_gentle_reminders?: boolean;
          notify_admin_messages?: boolean;
          notify_announcements?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          theme_mode?: ThemeMode;
          favorite_affirmation_ids?: string[];
          notify_affirmations?: boolean;
          notify_daily_wisdom?: boolean;
          notify_gentle_reminders?: boolean;
          notify_admin_messages?: boolean;
          notify_announcements?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          category: NotificationCategory;
          is_read: boolean;
          sender: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          category?: NotificationCategory;
          is_read?: boolean;
          sender?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          category?: NotificationCategory;
          is_read?: boolean;
          sender?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      admin_get_user_records_audited: {
        Args: {
          p_target_user_id: string;
        };
        Returns: Json;
      };
      admin_prepare_user_export_audited: {
        Args: {
          p_target_user_id: string;
          p_format: 'json' | 'csv' | 'html';
          p_categories: Array<
            | 'profile'
            | 'checkIns'
            | 'metrics'
            | 'likesDislikes'
            | 'journals'
            | 'activitySummary'
            | 'calendarSummary'
          >;
          p_start_date?: string | null;
          p_end_date?: string | null;
          p_confirm_journals?: boolean;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
