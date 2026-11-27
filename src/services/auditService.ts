import type { Json } from '../types/database';
import {
  fail,
  mapSupabaseError,
  ok,
  requireAuthenticatedClient,
  type ServiceResult,
} from './serviceHelpers';

export type AdminAuditAction =
  | 'user_records_viewed'
  | 'user_data_exported'
  | 'affirmation_created'
  | 'affirmation_updated'
  | 'affirmation_deleted'
  | 'wisdom_created'
  | 'wisdom_updated'
  | 'wisdom_deleted';

export interface AdminAuditLog {
  id: string;
  actorUserId: string;
  actorName: string;
  action: AdminAuditAction;
  targetUserId: string | null;
  targetName: string | null;
  resourceType: string;
  resourceId: string | null;
  metadata: Json;
  timestamp: string;
}

export interface AdminAuditPage {
  entries: AdminAuditLog[];
  total: number;
}

const MAX_PAGE_SIZE = 100;

async function requireAdminClient() {
  const auth = await requireAuthenticatedClient();
  if (!auth.ok) return auth;
  const { data: isAdmin, error } = await auth.data.client.rpc('is_admin');
  if (error) return mapSupabaseError(error);
  if (isAdmin !== true) return fail('FORBIDDEN', 'Only verified administrators can access audit logs.');
  return ok(auth.data);
}

export const auditService = {
  async listAdminAuditLogs(input: {
    offset?: number;
    limit?: number;
    action?: AdminAuditAction | 'all';
  } = {}): Promise<ServiceResult<AdminAuditPage>> {
    const offset = Math.max(0, Math.floor(input.offset ?? 0));
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(input.limit ?? 50)));
    const auth = await requireAdminClient();
    if (!auth.ok) return auth;

    let query = auth.data.client
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (input.action && input.action !== 'all') query = query.eq('action', input.action);
    const { data, error, count } = await query;
    if (error) return mapSupabaseError(error);

    const rows = data ?? [];
    const profileIds = Array.from(new Set(rows.flatMap((row) =>
      row.target_user_id ? [row.actor_user_id, row.target_user_id] : [row.actor_user_id]
    )));
    const profilesResult = profileIds.length
      ? await auth.data.client.from('profiles').select('id, display_name').in('id', profileIds)
      : { data: [], error: null };
    if (profilesResult.error) return mapSupabaseError(profilesResult.error);

    const names = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile.display_name]));
    const entries = rows.map((row) => ({
      id: row.id,
      actorUserId: row.actor_user_id,
      actorName: names.get(row.actor_user_id) || row.actor_user_id,
      action: row.action as AdminAuditAction,
      targetUserId: row.target_user_id,
      targetName: row.target_user_id ? names.get(row.target_user_id) || row.target_user_id : null,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      metadata: row.metadata,
      timestamp: row.created_at,
    }));
    return ok({ entries, total: count ?? 0 });
  },
};
