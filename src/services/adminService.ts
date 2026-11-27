import type { AdminUserPrototype } from '../types/lunara';
import {
  mapSupabaseError,
  ok,
  requireAuthenticatedClient,
  type ServiceResult,
} from './serviceHelpers';

export const adminService = {
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
