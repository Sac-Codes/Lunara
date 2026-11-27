import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const supabasePublishableKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim() ?? '';

/**
 * True only when both required public Vite Supabase environment variables are present
 * and do not contain template placeholder values.
 */
export const isSupabaseConfigured: boolean = Boolean(
  (() => {
    if (!supabaseUrl || !supabasePublishableKey) return false;
    if (supabaseUrl.includes('your-project-ref')) return false;
    if (supabasePublishableKey.includes('your-supabase-publishable')) return false;
    try {
      const parsed = new URL(supabaseUrl);
      return parsed.protocol === 'https:' && Boolean(parsed.hostname);
    } catch {
      return false;
    }
  })()
);

let clientInstance: SupabaseClient<Database> | null = null;

/**
 * Returns the singleton Supabase client when configured, or `null` when running in
 * unconfigured/demo mode. Never throws on missing environment variables.
 */
export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = createClient<Database>(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return clientInstance;
}

/**
 * Convenience singleton reference (may be `null` when Supabase env vars are not configured).
 */
export const supabase = getSupabaseClient();
