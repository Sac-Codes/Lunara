import type { Database } from '../types/database';
import type { NotificationCategory, UserNotification } from '../types/lunara';
import {
  fail,
  mapSupabaseError,
  ok,
  requireAuthenticatedClient,
  type ServiceResult,
} from './serviceHelpers';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];

function mapRowToNotification(row: NotificationRow): UserNotification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    category: row.category,
    read: row.is_read,
    sender: row.sender,
    createdAt: row.created_at,
  };
}

export interface CreateNotificationInput {
  targetUserId?: string;
  title: string;
  message: string;
  category?: NotificationCategory;
  sender?: string;
}

export const notificationService = {
  async listOwnNotifications(): Promise<ServiceResult<UserNotification[]>> {
    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client, userId } = auth.data;
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return mapSupabaseError(error);
    return ok((data ?? []).map(mapRowToNotification));
  },

  async createNotification(
    input: CreateNotificationInput
  ): Promise<ServiceResult<UserNotification>> {
    if (!input.title.trim() || !input.message.trim()) {
      return fail('VALIDATION_ERROR', 'Notification title and message are required.');
    }

    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client, userId } = auth.data;
    const recipientId = input.targetUserId?.trim() || userId;

    const { data, error } = await client
      .from('notifications')
      .insert({
        user_id: recipientId,
        title: input.title.trim(),
        message: input.message.trim(),
        category: input.category ?? 'general',
        sender: input.sender?.trim() || 'Lunara',
      })
      .select('*')
      .single();

    if (error) return mapSupabaseError(error);
    return ok(mapRowToNotification(data));
  },

  async markRead(id: string, read = true): Promise<ServiceResult<UserNotification>> {
    if (!id.trim()) {
      return fail('VALIDATION_ERROR', 'Notification ID is required.');
    }

    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client, userId } = auth.data;
    const { data, error } = await client
      .from('notifications')
      .update({ is_read: read })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) return mapSupabaseError(error);
    return ok(mapRowToNotification(data));
  },

  async markAllRead(): Promise<ServiceResult<void>> {
    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client, userId } = auth.data;
    const { error } = await client
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) return mapSupabaseError(error);
    return ok(undefined);
  },

  async remove(id: string): Promise<ServiceResult<void>> {
    if (!id.trim()) {
      return fail('VALIDATION_ERROR', 'Notification ID is required.');
    }

    const auth = await requireAuthenticatedClient();
    if (!auth.ok) return auth;

    const { client, userId } = auth.data;
    const { error } = await client
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) return mapSupabaseError(error);
    return ok(undefined);
  },
};
