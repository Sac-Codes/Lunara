import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import type { AuthUser, UserRole } from '../types/lunara';
import { profileService } from './profileService';
import { roleService } from './roleService';
import { fail, ok, type ServiceResult } from './serviceHelpers';

export interface SignInResult {
  user: User;
  session: Session;
}

export interface SignUpResult {
  user: User | null;
  session: Session | null;
  requiresEmailConfirmation: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireConfiguredClient() {
  if (!isSupabaseConfigured) {
    return fail(
      'NOT_CONFIGURED',
      'Supabase authentication is not configured in this environment.'
    );
  }

  const client = getSupabaseClient();
  if (!client) {
    return fail(
      'NOT_CONFIGURED',
      'Supabase client is unavailable in this environment.'
    );
  }

  return ok(client);
}

function getAuthRedirectUrl(path = '/login'): string | undefined {
  const configuredUrl = (import.meta.env.VITE_APP_URL as string | undefined)?.trim();
  const baseUrl =
    configuredUrl && !configuredUrl.includes('MY_APP_URL')
      ? configuredUrl.replace(/\/+$/, '')
      : typeof window !== 'undefined'
        ? window.location.origin
        : '';

  return baseUrl ? `${baseUrl}${path}` : undefined;
}

function deriveDisplayName(email: string, profileName?: string, metadataName?: unknown): string {
  const cleanProfileName = profileName?.trim();
  if (cleanProfileName) return cleanProfileName;

  if (typeof metadataName === 'string' && metadataName.trim()) {
    return metadataName.trim();
  }

  const localPart = email.split('@')[0] || 'Friend';
  const cleaned = localPart.replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return 'Friend';

  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function sanitizeAuthErrorMessage(message?: string): string {
  if (!message) return 'Authentication request failed. Please try again.';

  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in.';
  }
  if (lower.includes('user already registered')) {
    return 'An account with this email already exists.';
  }
  if (lower.includes('password should be at least')) {
    return 'Password does not meet the minimum length requirement.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  return message;
}

export const authService = {
  async signIn(email: string, password: string): Promise<ServiceResult<SignInResult>> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !EMAIL_PATTERN.test(cleanEmail)) {
      return fail('VALIDATION_ERROR', 'Please enter a valid email address.');
    }
    if (!password) {
      return fail('VALIDATION_ERROR', 'Password is required.');
    }

    const clientResult = requireConfiguredClient();
    if (!clientResult.ok) return clientResult;

    const { data, error } = await clientResult.data.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error || !data.user || !data.session) {
      return fail(
        'UNAUTHENTICATED',
        sanitizeAuthErrorMessage(error?.message)
      );
    }

    return ok({
      user: data.user,
      session: data.session,
    });
  },

  async signUp(
    email: string,
    password: string,
    displayName?: string
  ): Promise<ServiceResult<SignUpResult>> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !EMAIL_PATTERN.test(cleanEmail)) {
      return fail('VALIDATION_ERROR', 'Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      return fail('VALIDATION_ERROR', 'Password must be at least 6 characters.');
    }

    const clientResult = requireConfiguredClient();
    if (!clientResult.ok) return clientResult;

    const cleanDisplayName = displayName?.trim() || '';
    const redirectTo = getAuthRedirectUrl('/login');

    const { data, error } = await clientResult.data.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: cleanDisplayName ? { display_name: cleanDisplayName } : undefined,
        ...(redirectTo ? { emailRedirectTo: redirectTo } : {}),
      },
    });

    if (error) {
      return fail('VALIDATION_ERROR', sanitizeAuthErrorMessage(error.message));
    }

    return ok({
      user: data.user,
      session: data.session,
      requiresEmailConfirmation: Boolean(data.user && !data.session),
    });
  },

  async signOut(): Promise<ServiceResult<void>> {
    const clientResult = requireConfiguredClient();
    if (!clientResult.ok) return clientResult;

    const { error } = await clientResult.data.auth.signOut();
    if (error) {
      return fail('DATABASE_ERROR', sanitizeAuthErrorMessage(error.message));
    }

    return ok(undefined);
  },

  async resetPassword(email: string): Promise<ServiceResult<void>> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !EMAIL_PATTERN.test(cleanEmail)) {
      return fail('VALIDATION_ERROR', 'Please enter a valid email address.');
    }

    const clientResult = requireConfiguredClient();
    if (!clientResult.ok) return clientResult;

    const redirectTo = getAuthRedirectUrl('/login');
    const { error } = await clientResult.data.auth.resetPasswordForEmail(
      cleanEmail,
      redirectTo ? { redirectTo } : undefined
    );

    if (error) {
      return fail('DATABASE_ERROR', sanitizeAuthErrorMessage(error.message));
    }

    return ok(undefined);
  },

  async getSession(): Promise<ServiceResult<Session | null>> {
    const clientResult = requireConfiguredClient();
    if (!clientResult.ok) return clientResult;

    const { data, error } = await clientResult.data.auth.getSession();
    if (error) {
      return fail('UNAUTHENTICATED', sanitizeAuthErrorMessage(error.message));
    }

    return ok(data.session ?? null);
  },

  /**
   * Resolves the current server-verified Supabase user along with their
   * backend-verified role (`user_roles`) and profile display name.
   * Never trusts role claims from user_metadata; defaults to `'user'` if role lookup fails.
   */
  async getSessionUserWithRole(): Promise<ServiceResult<AuthUser | null>> {
    const clientResult = requireConfiguredClient();
    if (!clientResult.ok) return clientResult;

    const { data, error } = await clientResult.data.auth.getUser();
    if (error) {
      return fail('UNAUTHENTICATED', sanitizeAuthErrorMessage(error.message));
    }

    if (!data.user) {
      return ok(null);
    }

    const [roleResult, profileResult] = await Promise.all([
      roleService.getOwnRole(),
      profileService.getOwnProfile(),
    ]);

    if (!roleResult.ok) {
      return roleResult;
    }
    if (!profileResult.ok) {
      return profileResult;
    }
    if (!profileResult.data) {
      return fail(
        'NOT_FOUND',
        'Your Lunara profile is missing. Please sign in again or contact support.'
      );
    }

    const resolvedRole: UserRole =
      roleResult.data === 'admin' ? 'admin' : 'user';

    const email = data.user.email ?? '';
    const profileDisplayName = profileResult.ok ? profileResult.data?.displayName : undefined;
    const metadataDisplayName =
      data.user.user_metadata && typeof data.user.user_metadata === 'object'
        ? (data.user.user_metadata as Record<string, unknown>).display_name
        : undefined;

    return ok({
      id: data.user.id,
      name: deriveDisplayName(email, profileDisplayName, metadataDisplayName),
      email,
      role: resolvedRole,
      authMode: 'supabase',
    });
  },
};
