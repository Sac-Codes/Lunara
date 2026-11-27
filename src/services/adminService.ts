import type { Database } from '../types/database';
import type { AdminUserPrototype, CheckInEntry, JournalEntry } from '../types/lunara';
import {
  fail,
  mapSupabaseError,
  ok,
  requireAuthenticatedClient,
  type ServiceResult,
} from './serviceHelpers';

export interface AdminUserRecords {
  checkIns: CheckInEntry[];
  journals: JournalEntry[];
}

const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mapCheckInRow(row: Database['public']['Tables']['check_ins']['Row']): CheckInEntry {
  return {
    id: row.id,
    date: row.check_in_date,
    mood: row.mood,
    happiness: row.happiness,
    energy: row.energy,
    stress: row.stress,
    likes: row.likes,
    dislikes: row.dislikes,
    notes: row.notes,
    customValues: row.custom_values,
    activities: row.activities,
    customActivities: row.custom_activities,
    proudOf: row.proud_of,
    needs: row.needs,
    tomorrowIntention: row.tomorrow_intention,
    updatedAt: row.updated_at,
  };
}

function mapJournalRow(row: Database['public']['Tables']['journal_entries']['Row']): JournalEntry {
  return {
    id: row.id,
    date: row.entry_date,
    title: row.title,
    content: row.content,
    tags: row.tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const adminService = {
  async getUserRecords(targetUserId: string): Promise<ServiceResult<AdminUserRecords>> {
    if (!USER_ID_PATTERN.test(targetUserId)) {
      return fail('VALIDATION_ERROR', 'A valid target user ID is required.');
    }

    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client } = auth.data;
    const { data: isAdmin, error: authorizationError } = await client.rpc('is_admin');
    if (authorizationError) return mapSupabaseError(authorizationError);
    if (isAdmin !== true) {
      return fail('FORBIDDEN', 'Only verified administrators can inspect another user’s records.');
    }

    const [checkInsResult, journalsResult] = await Promise.all([
      client
        .from('check_ins')
        .select('*')
        .eq('user_id', targetUserId)
        .order('check_in_date', { ascending: false })
        .order('updated_at', { ascending: false }),
      client
        .from('journal_entries')
        .select('*')
        .eq('user_id', targetUserId)
        .order('entry_date', { ascending: false })
        .order('updated_at', { ascending: false }),
    ]);

    if (checkInsResult.error) return mapSupabaseError(checkInsResult.error);
    if (journalsResult.error) return mapSupabaseError(journalsResult.error);

    return ok({
      checkIns: (checkInsResult.data ?? []).map(mapCheckInRow),
      journals: (journalsResult.data ?? []).map(mapJournalRow),
    });
  },

  async listUsers(): Promise<ServiceResult<AdminUserPrototype[]>> {
    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client } = auth.data;
    const [profilesResult, rolesResult] = await Promise.all([
      client.from('profiles').select('id, display_name, preferred_check_in_time, created_at, updated_at'),
      client.from('user_roles').select('user_id, role'),
    ]);

    if (profilesResult.error) return mapSupabaseError(profilesResult.error);
    if (rolesResult.error) return mapSupabaseError(rolesResult.error);

    const roles = new Map((rolesResult.data ?? []).map((row) => [row.user_id, row.role]));
    const users = (profilesResult.data ?? []).map((profile) => ({
      id: profile.id,
      name: profile.display_name || 'Lunara member',
      email: '',
      role: roles.get(profile.id) === 'admin' ? 'Admin' as const : 'Member' as const,
      status: 'active' as const,
      joinedDate: profile.created_at.slice(0, 10),
      lastActive: profile.updated_at,
      preferredWindow: profile.preferred_check_in_time,
      checkIns: [],
      journals: [],
    }));
    return ok(users);
  },
};
