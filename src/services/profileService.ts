import type { Database } from '../types/database';
import type { UserProfile } from '../types/lunara';
import {
  mapSupabaseError,
  ok,
  requireAuthenticatedClient,
  type ServiceResult,
} from './serviceHelpers';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface BackendUserProfile extends UserProfile {
  id: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapRowToProfile(row: ProfileRow): BackendUserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    preferredCheckInTime: row.preferred_check_in_time,
    dailyReminderEnabled: row.daily_reminder_enabled,
    reminderTime: row.reminder_time,
    showGreetingPrompts: row.show_greeting_prompts,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface UpdateProfileInput extends Partial<UserProfile> {
  avatarUrl?: string | null;
}

export const profileService = {
  async getOwnProfile(): Promise<ServiceResult<BackendUserProfile | null>> {
    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client, userId } = auth.data;
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) return mapSupabaseError(error);
    return ok(data ? mapRowToProfile(data) : null);
  },

  async upsertOwnProfile(patch: UpdateProfileInput): Promise<ServiceResult<BackendUserProfile>> {
    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client, userId } = auth.data;
    const payload: Database['public']['Tables']['profiles']['Insert'] = {
      id: userId,
    };

    if (patch.displayName !== undefined) payload.display_name = patch.displayName.trim();
    if (patch.avatarUrl !== undefined) payload.avatar_url = patch.avatarUrl;
    if (patch.preferredCheckInTime !== undefined) {
      payload.preferred_check_in_time = patch.preferredCheckInTime;
    }
    if (patch.dailyReminderEnabled !== undefined) {
      payload.daily_reminder_enabled = patch.dailyReminderEnabled;
    }
    if (patch.reminderTime !== undefined) payload.reminder_time = patch.reminderTime;
    if (patch.showGreetingPrompts !== undefined) {
      payload.show_greeting_prompts = patch.showGreetingPrompts;
    }

    const { data, error } = await client
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) return mapSupabaseError(error);
    return ok(mapRowToProfile(data));
  },
};
