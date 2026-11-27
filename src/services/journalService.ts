import type { Database } from '../types/database';
import type { JournalEntry } from '../types/lunara';
import {
  fail,
  isValidDateKey,
  mapSupabaseError,
  ok,
  requireAuthenticatedClient,
  type ServiceResult,
} from './serviceHelpers';

type JournalRow = Database['public']['Tables']['journal_entries']['Row'];

export interface BackendJournalEntry extends JournalEntry {
  isFavorite: boolean;
}

function mapRowToJournal(row: JournalRow): BackendJournalEntry {
  return {
    id: row.id,
    date: row.entry_date,
    title: row.title,
    content: row.content,
    tags: row.tags,
    isFavorite: row.is_favorite,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface SaveJournalInput {
  id?: string;
  date: string;
  title: string;
  content: string;
  tags?: string[];
  isFavorite?: boolean;
}

export const journalService = {
  async listByUser(): Promise<ServiceResult<BackendJournalEntry[]>> {
    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client, userId } = auth.data;
    const { data, error } = await client
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) return mapSupabaseError(error);
    return ok((data ?? []).map(mapRowToJournal));
  },

  async create(input: SaveJournalInput): Promise<ServiceResult<BackendJournalEntry>> {
    if (!isValidDateKey(input.date)) {
      return fail('VALIDATION_ERROR', 'Journal date must be in YYYY-MM-DD format.');
    }
    if (!input.title.trim() && !input.content.trim()) {
      return fail('VALIDATION_ERROR', 'Journal entry must have a title or content.');
    }

    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client, userId } = auth.data;
    const { data, error } = await client
      .from('journal_entries')
      .insert({
        user_id: userId,
        entry_date: input.date,
        title: input.title.trim(),
        content: input.content.trim(),
        tags: input.tags ?? [],
        is_favorite: Boolean(input.isFavorite),
      })
      .select('*')
      .single();

    if (error) return mapSupabaseError(error);
    return ok(mapRowToJournal(data));
  },

  async update(
    id: string,
    patch: Partial<Omit<SaveJournalInput, 'id'>>
  ): Promise<ServiceResult<BackendJournalEntry>> {
    if (!id.trim()) {
      return fail('VALIDATION_ERROR', 'Journal entry ID is required.');
    }
    if (patch.date !== undefined && !isValidDateKey(patch.date)) {
      return fail('VALIDATION_ERROR', 'Journal date must be in YYYY-MM-DD format.');
    }

    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client, userId } = auth.data;
    const updatePayload: Database['public']['Tables']['journal_entries']['Update'] = {};
    if (patch.date !== undefined) updatePayload.entry_date = patch.date;
    if (patch.title !== undefined) updatePayload.title = patch.title.trim();
    if (patch.content !== undefined) updatePayload.content = patch.content.trim();
    if (patch.tags !== undefined) updatePayload.tags = patch.tags;
    if (patch.isFavorite !== undefined) updatePayload.is_favorite = patch.isFavorite;

    const { data, error } = await client
      .from('journal_entries')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) return mapSupabaseError(error);
    return ok(mapRowToJournal(data));
  },

  async toggleFavorite(id: string, isFavorite: boolean): Promise<ServiceResult<BackendJournalEntry>> {
    return this.update(id, { isFavorite });
  },

  async remove(id: string): Promise<ServiceResult<void>> {
    if (!id.trim()) {
      return fail('VALIDATION_ERROR', 'Journal entry ID is required.');
    }

    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client, userId } = auth.data;
    const { error } = await client
      .from('journal_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) return mapSupabaseError(error);
    return ok(undefined);
  },
};
