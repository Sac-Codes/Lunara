import type { Database } from '../types/database';
import type { NotificationPreferences, ThemeMode } from '../types/lunara';
import {
  mapSupabaseError,
  ok,
  requireAuthenticatedClient,
  type ServiceResult,
} from './serviceHelpers';

type PreferencesRow = Database['public']['Tables']['user_preferences']['Row'];

export interface BackendUserPreferences {
  themeMode: ThemeMode;
  favoriteAffirmationIds: string[];
  notificationPrefs: NotificationPreferences;
  updatedAt: string;
}

function mapRowToPreferences(row: PreferencesRow): BackendUserPreferences {
  return {
    themeMode: row.theme_mode,
    favoriteAffirmationIds: row.favorite_affirmation_ids,
    notificationPrefs: {
      affirmations: row.notify_affirmations,
      dailyWisdom: row.notify_daily_wisdom,
      gentleReminders: row.notify_gentle_reminders,
      adminMessages: row.notify_admin_messages,
      announcements: row.notify_announcements,
    },
    updatedAt: row.updated_at,
  };
}

export interface UpdatePreferencesInput {
  themeMode?: ThemeMode;
  favoriteAffirmationIds?: string[];
  notificationPrefs?: Partial<NotificationPreferences>;
}

export const preferencesService = {
  async getOwnPreferences(): Promise<ServiceResult<BackendUserPreferences | null>> {
    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client, userId } = auth.data;
    const { data, error } = await client
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return mapSupabaseError(error);
    return ok(data ? mapRowToPreferences(data) : null);
  },

  async upsertOwnPreferences(
    patch: UpdatePreferencesInput
  ): Promise<ServiceResult<BackendUserPreferences>> {
    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client, userId } = auth.data;
    const payload: Database['public']['Tables']['user_preferences']['Insert'] = {
      user_id: userId,
    };

    if (patch.themeMode !== undefined) payload.theme_mode = patch.themeMode;
    if (patch.favoriteAffirmationIds !== undefined) {
      payload.favorite_affirmation_ids = patch.favoriteAffirmationIds;
    }
    if (patch.notificationPrefs) {
      const np = patch.notificationPrefs;
      if (np.affirmations !== undefined) payload.notify_affirmations = np.affirmations;
      if (np.dailyWisdom !== undefined) payload.notify_daily_wisdom = np.dailyWisdom;
      if (np.gentleReminders !== undefined) payload.notify_gentle_reminders = np.gentleReminders;
      if (np.adminMessages !== undefined) payload.notify_admin_messages = np.adminMessages;
      if (np.announcements !== undefined) payload.notify_announcements = np.announcements;
    }

    const { data, error } = await client
      .from('user_preferences')
      .upsert(payload, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (error) return mapSupabaseError(error);
    return ok(mapRowToPreferences(data));
  },
};
