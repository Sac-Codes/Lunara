import type { UserRole } from '../types/lunara';
import {
  fail,
  mapSupabaseError,
  ok,
  requireAuthenticatedClient,
  type ServiceResult,
} from './serviceHelpers';

export const roleService = {
  /**
   * Fetches the authenticated user's backend-verified role.
   * Defaults to `'user'` if no row is returned.
   */
  async getOwnRole(): Promise<ServiceResult<UserRole>> {
    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client, userId } = auth.data;
    const { data, error } = await client
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return mapSupabaseError(error);
    return ok(data?.role ?? 'user');
  },

  /**
   * Verifies admin privileges via the backend `public.is_admin()` RPC.
   */
  async isCurrentUserAdmin(): Promise<ServiceResult<boolean>> {
    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client } = auth.data;
    const { data, error } = await client.rpc('is_admin');

    if (error) return mapSupabaseError(error);
    return ok(Boolean(data));
  },

  /**
   * Assigns a role to a target user. Enforced by RLS (`public.is_admin()`).
   * Non-admin callers are rejected by PostgreSQL with a permission error.
   */
  async setUserRole(targetUserId: string, role: UserRole): Promise<ServiceResult<UserRole>> {
    if (!targetUserId.trim()) {
      return fail('VALIDATION_ERROR', 'Target user ID is required.');
    }
    if (role !== 'user' && role !== 'admin') {
      return fail('VALIDATION_ERROR', 'Role must be either "user" or "admin".');
    }

    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client } = auth.data;
    const { data, error } = await client
      .from('user_roles')
      .upsert({ user_id: targetUserId.trim(), role }, { onConflict: 'user_id' })
      .select('role')
      .single();

    if (error) return mapSupabaseError(error);
    return ok(data.role);
  },
};
