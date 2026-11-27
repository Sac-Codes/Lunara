import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase';
import type { Database } from '../types/database';

export type ServiceErrorCode =
  | 'NOT_CONFIGURED'
  | 'UNAUTHENTICATED'
  | 'VALIDATION_ERROR'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'DATABASE_ERROR';

export interface ServiceError {
  code: ServiceErrorCode;
  message: string;
  details?: string;
}

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ServiceError };

export function ok<T>(data: T): ServiceResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(
  code: ServiceErrorCode,
  message: string,
  details?: string
): ServiceResult<T> {
  return { ok: false, error: { code, message, details } };
}

/**
 * Resolves the configured Supabase client and currently authenticated user ID.
 * Returns a structured error if Supabase is unconfigured or the user is not signed in.
 */
export async function requireAuthenticatedClient(): Promise<
  ServiceResult<{ client: SupabaseClient<Database>; userId: string }>
> {
  const client = getSupabaseClient();
  if (!client) {
    return fail(
      'NOT_CONFIGURED',
      'Supabase is not configured. Running in local/demo mode.'
    );
  }

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    return fail(
      'UNAUTHENTICATED',
      'An authenticated session is required for this operation.',
      error?.message
    );
  }

  return ok({ client, userId: data.user.id });
}

/**
 * Normalizes PostgREST / Supabase errors into a consistent `ServiceError`.
 */
export function mapSupabaseError<T = never>(error: {
  code?: string;
  message: string;
  details?: string | null;
}): ServiceResult<T> {
  if (error.code === '42501') {
    return fail('FORBIDDEN', 'You do not have permission to perform this action.', error.message);
  }
  if (error.code === 'PGRST116') {
    return fail('NOT_FOUND', 'Requested record was not found.', error.message);
  }
  return fail('DATABASE_ERROR', error.message, error.details ?? undefined);
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateKey(value: string): boolean {
  return DATE_KEY_PATTERN.test(value);
}

export function isValidScaleValue(value: number | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  return Number.isInteger(value) && value >= 1 && value <= 5;
}
