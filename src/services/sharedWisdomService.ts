import type { SupabaseClient } from '@supabase/supabase-js';
import { WISDOM_TOPICS } from '../data/wisdomAndAffirmations';
import type { Database } from '../types/database';
import type { WisdomEntry } from '../types/lunara';
import {
  fail,
  mapSupabaseError,
  ok,
  requireAuthenticatedClient,
  type ServiceResult,
} from './serviceHelpers';

type WisdomRow = Database['public']['Tables']['wisdom_content']['Row'];
type NewWisdomEntry = Omit<WisdomEntry, 'id' | 'createdAt' | 'updatedAt'>;
type WisdomEntryUpdates = Partial<NewWisdomEntry>;

function mapWisdomRow(row: WisdomRow): WisdomEntry {
  return {
    id: row.id,
    title: row.title,
    scripture: row.scripture,
    chapter: row.chapter,
    verse: row.verse,
    sanskrit: row.sanskrit,
    transliteration: row.transliteration,
    meaning: row.meaning,
    learning: row.learning,
    reflectionPrompt: row.reflection_prompt,
    takeaway: row.takeaway,
    topic: row.topic,
    sourceNote: row.source_note,
    status: row.status,
    isFeatured: row.is_featured,
    isDaily: row.is_daily,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function requireAdminClient(): Promise<
  ServiceResult<{ client: SupabaseClient<Database> }>
> {
  const auth = await requireAuthenticatedClient();
  if (!auth.ok) return auth;

  const { client } = auth.data;
  const { data: isAdmin, error } = await client.rpc('is_admin');
  if (error) return mapSupabaseError(error);
  if (isAdmin !== true) {
    return fail('FORBIDDEN', 'Only verified administrators can manage shared wisdom.');
  }

  return ok({ client });
}

function validateNewEntry(entry: NewWisdomEntry): ServiceResult<void> {
  if (
    !entry.title.trim() ||
    entry.scripture !== 'Bhagavad Gita' ||
    !Number.isInteger(entry.chapter) ||
    entry.chapter < 1 ||
    entry.chapter > 18 ||
    !entry.verse.trim() ||
    !entry.sanskrit.trim() ||
    !entry.meaning.trim() ||
    !entry.reflectionPrompt.trim() ||
    !entry.takeaway.trim() ||
    (entry.isDaily && entry.status !== 'published') ||
    !WISDOM_TOPICS.includes(entry.topic)
  ) {
    return fail('VALIDATION_ERROR', 'Complete the required wisdom passage fields.');
  }
  return ok(undefined);
}

function mapUpdates(
  updates: WisdomEntryUpdates
): ServiceResult<Database['public']['Tables']['wisdom_content']['Update']> {
  if (Object.keys(updates).length === 0) {
    return fail('VALIDATION_ERROR', 'At least one wisdom field must be updated.');
  }
  if (
    (updates.title !== undefined && !updates.title.trim()) ||
    (updates.scripture !== undefined && updates.scripture !== 'Bhagavad Gita') ||
    (updates.chapter !== undefined &&
      (!Number.isInteger(updates.chapter) || updates.chapter < 1 || updates.chapter > 18)) ||
    (updates.verse !== undefined && !updates.verse.trim()) ||
    (updates.sanskrit !== undefined && !updates.sanskrit.trim()) ||
    (updates.meaning !== undefined && !updates.meaning.trim()) ||
    (updates.reflectionPrompt !== undefined && !updates.reflectionPrompt.trim()) ||
    (updates.takeaway !== undefined && !updates.takeaway.trim()) ||
    (updates.topic !== undefined && !WISDOM_TOPICS.includes(updates.topic)) ||
    (updates.isDaily === true && updates.status === 'draft')
  ) {
    return fail('VALIDATION_ERROR', 'One or more wisdom fields are invalid.');
  }

  const payload: Database['public']['Tables']['wisdom_content']['Update'] = {};
  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.scripture !== undefined) payload.scripture = updates.scripture;
  if (updates.chapter !== undefined) payload.chapter = updates.chapter;
  if (updates.verse !== undefined) payload.verse = updates.verse.trim();
  if (updates.sanskrit !== undefined) payload.sanskrit = updates.sanskrit.trim();
  if (updates.transliteration !== undefined) payload.transliteration = updates.transliteration.trim();
  if (updates.meaning !== undefined) payload.meaning = updates.meaning.trim();
  if (updates.learning !== undefined) payload.learning = updates.learning.trim();
  if (updates.reflectionPrompt !== undefined) payload.reflection_prompt = updates.reflectionPrompt.trim();
  if (updates.takeaway !== undefined) payload.takeaway = updates.takeaway.trim();
  if (updates.topic !== undefined) payload.topic = updates.topic;
  if (updates.sourceNote !== undefined) payload.source_note = updates.sourceNote.trim();
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.isFeatured !== undefined) payload.is_featured = updates.isFeatured;
  if (updates.isDaily !== undefined) payload.is_daily = updates.isDaily;
  return ok(payload);
}

export const sharedWisdomService = {
  async listWisdom(): Promise<ServiceResult<WisdomEntry[]>> {
    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { data, error } = await auth.data.client
      .from('wisdom_content')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: true });

    if (error) return mapSupabaseError(error);
    return ok((data ?? []).map(mapWisdomRow));
  },

  async addWisdom(entry: NewWisdomEntry): Promise<ServiceResult<WisdomEntry>> {
    const validation = validateNewEntry(entry);
    if (!validation.ok) return validation;

    const auth = await requireAdminClient();
    if (!auth.ok) return auth;

    const { data, error } = await auth.data.client
      .from('wisdom_content')
      .insert({
        title: entry.title.trim(),
        scripture: entry.scripture,
        chapter: entry.chapter,
        verse: entry.verse.trim(),
        sanskrit: entry.sanskrit.trim(),
        transliteration: entry.transliteration.trim(),
        meaning: entry.meaning.trim(),
        learning: entry.learning.trim(),
        reflection_prompt: entry.reflectionPrompt.trim(),
        takeaway: entry.takeaway.trim(),
        topic: entry.topic,
        source_note: entry.sourceNote.trim(),
        status: entry.status,
        is_featured: entry.isFeatured,
        is_daily: entry.isDaily,
      })
      .select('*')
      .single();

    if (error) return mapSupabaseError(error);
    return ok(mapWisdomRow(data));
  },

  async updateWisdom(
    id: string,
    updates: WisdomEntryUpdates
  ): Promise<ServiceResult<WisdomEntry>> {
    const trimmedId = id.trim();
    if (!trimmedId) return fail('VALIDATION_ERROR', 'Wisdom ID is required.');

    const validation = mapUpdates(updates);
    if (!validation.ok) return validation;

    const auth = await requireAdminClient();
    if (!auth.ok) return auth;

    const { data, error } = await auth.data.client
      .from('wisdom_content')
      .update(validation.data)
      .eq('id', trimmedId)
      .select('*')
      .single();

    if (error) return mapSupabaseError(error);
    return ok(mapWisdomRow(data));
  },

  async deleteWisdom(id: string): Promise<ServiceResult<void>> {
    const trimmedId = id.trim();
    if (!trimmedId) return fail('VALIDATION_ERROR', 'Wisdom ID is required.');

    const auth = await requireAdminClient();
    if (!auth.ok) return auth;

    const { data, error } = await auth.data.client
      .from('wisdom_content')
      .delete()
      .eq('id', trimmedId)
      .select('id')
      .maybeSingle();

    if (error) return mapSupabaseError(error);
    if (!data) return fail('NOT_FOUND', 'Wisdom passage was not found.');
    return ok(undefined);
  },
};
