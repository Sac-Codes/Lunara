import type { SupabaseClient } from '@supabase/supabase-js';
import { AFFIRMATION_CATEGORIES } from '../data/wisdomAndAffirmations';
import type { Database } from '../types/database';
import type { AffirmationItem } from '../types/lunara';
import {
  fail,
  mapSupabaseError,
  ok,
  requireAuthenticatedClient,
  type ServiceResult,
} from './serviceHelpers';

type AffirmationRow = Database['public']['Tables']['affirmations']['Row'];
type NewAffirmation = Omit<AffirmationItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
type AffirmationUpdates = Partial<NewAffirmation>;

function mapRow(row: AffirmationRow): AffirmationItem {
  return {
    id: row.id,
    text: row.text,
    category: row.category,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    ...(row.scheduled_date ? { scheduledDate: row.scheduled_date } : {}),
    ...(row.priority !== null ? { priority: row.priority } : {}),
  };
}

async function requireAdminClient(): Promise<
  ServiceResult<{ client: SupabaseClient<Database>; userId: string }>
> {
  const auth = await requireAuthenticatedClient();
  if (!auth.ok) return auth;
  const { data: isAdmin, error } = await auth.data.client.rpc('is_admin');
  if (error) return mapSupabaseError(error);
  if (isAdmin !== true) return fail('FORBIDDEN', 'Only verified administrators can manage affirmations.');
  return ok(auth.data);
}

function validateAffirmation(value: Pick<NewAffirmation, 'text' | 'category' | 'status'>): boolean {
  return Boolean(
    value.text.trim() &&
    AFFIRMATION_CATEGORIES.includes(value.category) &&
    ['published', 'draft', 'inactive'].includes(value.status)
  );
}

function mapUpdates(
  updates: AffirmationUpdates
): ServiceResult<Database['public']['Tables']['affirmations']['Update']> {
  if (Object.keys(updates).length === 0) {
    return fail('VALIDATION_ERROR', 'At least one affirmation field must be updated.');
  }
  if (
    (updates.text !== undefined && !updates.text.trim()) ||
    (updates.category !== undefined && !AFFIRMATION_CATEGORIES.includes(updates.category)) ||
    (updates.status !== undefined && !['published', 'draft', 'inactive'].includes(updates.status)) ||
    (updates.priority !== undefined &&
      (!Number.isInteger(updates.priority) || updates.priority < 0)) ||
    (updates.scheduledDate !== undefined &&
      Boolean(updates.scheduledDate) &&
      !/^\d{4}-\d{2}-\d{2}$/.test(updates.scheduledDate))
  ) {
    return fail('VALIDATION_ERROR', 'One or more affirmation fields are invalid.');
  }

  const payload: Database['public']['Tables']['affirmations']['Update'] = {};
  if (updates.text !== undefined) payload.text = updates.text.trim();
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.scheduledDate !== undefined) payload.scheduled_date = updates.scheduledDate || null;
  return ok(payload);
}

export const affirmationService = {
  async listAffirmations(): Promise<ServiceResult<AffirmationItem[]>> {
    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;
    const { data, error } = await auth.data.client
      .from('affirmations')
      .select('*')
      .order('priority', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });
    if (error) return mapSupabaseError(error);
    return ok((data ?? []).map(mapRow));
  },

  async addAffirmation(entry: NewAffirmation): Promise<ServiceResult<AffirmationItem>> {
    if (!validateAffirmation(entry)) {
      return fail('VALIDATION_ERROR', 'Provide affirmation text, a valid category, and status.');
    }
    if (entry.priority !== undefined && (!Number.isInteger(entry.priority) || entry.priority < 0)) {
      return fail('VALIDATION_ERROR', 'Affirmation priority must be a non-negative whole number.');
    }
    if (entry.scheduledDate && !/^\d{4}-\d{2}-\d{2}$/.test(entry.scheduledDate)) {
      return fail('VALIDATION_ERROR', 'Scheduled date must use YYYY-MM-DD format.');
    }
    const auth = await requireAdminClient();
    if (!auth.ok) return auth;
    const { data, error } = await auth.data.client
      .from('affirmations')
      .insert({
        text: entry.text.trim(),
        category: entry.category,
        status: entry.status,
        created_by: auth.data.userId,
        scheduled_date: entry.scheduledDate || null,
        priority: entry.priority ?? null,
      })
      .select('*')
      .single();
    if (error) return mapSupabaseError(error);
    return ok(mapRow(data));
  },

  async updateAffirmation(
    id: string,
    updates: AffirmationUpdates
  ): Promise<ServiceResult<AffirmationItem>> {
    const cleanId = id.trim();
    if (!cleanId) return fail('VALIDATION_ERROR', 'Affirmation ID is required.');
    const payload = mapUpdates(updates);
    if (!payload.ok) return payload;
    const auth = await requireAdminClient();
    if (!auth.ok) return auth;
    const { data, error } = await auth.data.client
      .from('affirmations')
      .update(payload.data)
      .eq('id', cleanId)
      .select('*')
      .single();
    if (error) return mapSupabaseError(error);
    return ok(mapRow(data));
  },

  async deleteAffirmation(id: string): Promise<ServiceResult<void>> {
    const cleanId = id.trim();
    if (!cleanId) return fail('VALIDATION_ERROR', 'Affirmation ID is required.');
    const auth = await requireAdminClient();
    if (!auth.ok) return auth;
    const { data, error } = await auth.data.client
      .from('affirmations')
      .delete()
      .eq('id', cleanId)
      .select('id')
      .maybeSingle();
    if (error) return mapSupabaseError(error);
    if (!data) return fail('NOT_FOUND', 'Affirmation was not found.');
    return ok(undefined);
  },
};
