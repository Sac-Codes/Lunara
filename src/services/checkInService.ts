import type { Database } from '../types/database';
import type { CheckInEntry } from '../types/lunara';
import {
  fail,
  isValidDateKey,
  isValidScaleValue,
  mapSupabaseError,
  ok,
  requireAuthenticatedClient,
  type ServiceResult,
} from './serviceHelpers';

type CheckInRow = Database['public']['Tables']['check_ins']['Row'];

function mapRowToCheckIn(row: CheckInRow): CheckInEntry {
  return {
    id: row.id,
    date: row.check_in_date,
    mood: row.mood,
    happiness: row.happiness,
    energy: row.energy,
    stress: row.stress,
    likes: row.likes,
    dislikes: row.dislikes,
    activities: row.activities,
    customActivities: row.custom_activities,
    proudOf: row.proud_of,
    needs: row.needs,
    tomorrowIntention: row.tomorrow_intention,
    notes: row.notes,
    customValues: row.custom_values,
    updatedAt: row.updated_at,
  };
}

export type SaveCheckInInput = Omit<CheckInEntry, 'id' | 'updatedAt' | 'isSample'>;

export const checkInService = {
  async listByUser(): Promise<ServiceResult<CheckInEntry[]>> {
    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client, userId } = auth.data;
    const { data, error } = await client
      .from('check_ins')
      .select('*')
      .eq('user_id', userId)
      .order('check_in_date', { ascending: false });

    if (error) return mapSupabaseError(error);
    return ok((data ?? []).map(mapRowToCheckIn));
  },

  async getByDate(dateKey: string): Promise<ServiceResult<CheckInEntry | null>> {
    if (!isValidDateKey(dateKey)) {
      return fail('VALIDATION_ERROR', 'Date must be in YYYY-MM-DD format.');
    }

    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client, userId } = auth.data;
    const { data, error } = await client
      .from('check_ins')
      .select('*')
      .eq('user_id', userId)
      .eq('check_in_date', dateKey)
      .maybeSingle();

    if (error) return mapSupabaseError(error);
    return ok(data ? mapRowToCheckIn(data) : null);
  },

  /**
   * Upserts a daily check-in by `(user_id, check_in_date)` to prevent duplicate
   * check-ins for the same user on the same calendar day.
   */
  async upsertByDate(input: SaveCheckInInput): Promise<ServiceResult<CheckInEntry>> {
    if (!isValidDateKey(input.date)) {
      return fail('VALIDATION_ERROR', 'Check-in date must be in YYYY-MM-DD format.');
    }
    if (
      !isValidScaleValue(input.happiness) ||
      !isValidScaleValue(input.energy) ||
      !isValidScaleValue(input.stress)
    ) {
      return fail('VALIDATION_ERROR', 'Scale values (happiness, energy, stress) must be integers between 1 and 5.');
    }

    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client, userId } = auth.data;
    const { data, error } = await client
      .from('check_ins')
      .upsert(
        {
          user_id: userId,
          check_in_date: input.date,
          mood: input.mood,
          happiness: input.happiness,
          energy: input.energy,
          stress: input.stress,
          likes: input.likes ?? [],
          dislikes: input.dislikes ?? [],
          activities: input.activities ?? [],
          custom_activities: input.customActivities ?? [],
          proud_of: input.proudOf?.trim() ?? '',
          needs: input.needs ?? [],
          tomorrow_intention: input.tomorrowIntention?.trim() ?? '',
          notes: input.notes?.trim() ?? '',
          custom_values: input.customValues ?? {},
        },
        { onConflict: 'user_id,check_in_date' }
      )
      .select('*')
      .single();

    if (error) return mapSupabaseError(error);
    return ok(mapRowToCheckIn(data));
  },

  async deleteByDate(dateKey: string): Promise<ServiceResult<void>> {
    if (!isValidDateKey(dateKey)) {
      return fail('VALIDATION_ERROR', 'Date must be in YYYY-MM-DD format.');
    }

    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client, userId } = auth.data;
    const { error } = await client
      .from('check_ins')
      .delete()
      .eq('user_id', userId)
      .eq('check_in_date', dateKey);

    if (error) return mapSupabaseError(error);
    return ok(undefined);
  },
};
