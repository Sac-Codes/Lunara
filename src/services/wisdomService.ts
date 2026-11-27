import {
  fail,
  mapSupabaseError,
  ok,
  requireAuthenticatedClient,
  type ServiceResult,
} from './serviceHelpers';

export const wisdomService = {
  /**
   * Lists the authenticated user's saved/bookmarked wisdom entry IDs.
   * Wisdom verse content itself remains in the curated frontend dataset.
   */
  async listSavedIds(): Promise<ServiceResult<string[]>> {
    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client, userId } = auth.data;
    const { data, error } = await client
      .from('saved_wisdom')
      .select('wisdom_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return mapSupabaseError(error);
    return ok((data ?? []).map((row) => row.wisdom_id));
  },

  async saveWisdom(wisdomId: string): Promise<ServiceResult<void>> {
    const trimmed = wisdomId.trim();
    if (!trimmed) {
      return fail('VALIDATION_ERROR', 'Wisdom ID is required.');
    }

    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client, userId } = auth.data;
    const { error } = await client
      .from('saved_wisdom')
      .upsert(
        { user_id: userId, wisdom_id: trimmed },
        { onConflict: 'user_id,wisdom_id', ignoreDuplicates: true }
      );

    if (error) return mapSupabaseError(error);
    return ok(undefined);
  },

  async unsaveWisdom(wisdomId: string): Promise<ServiceResult<void>> {
    const trimmed = wisdomId.trim();
    if (!trimmed) {
      return fail('VALIDATION_ERROR', 'Wisdom ID is required.');
    }

    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client, userId } = auth.data;
    const { error } = await client
      .from('saved_wisdom')
      .delete()
      .eq('user_id', userId)
      .eq('wisdom_id', trimmed);

    if (error) return mapSupabaseError(error);
    return ok(undefined);
  },
};
