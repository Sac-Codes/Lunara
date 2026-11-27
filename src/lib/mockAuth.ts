import type { AuthUser } from '../types/lunara';

const REMEMBERED_EMAIL_KEY = 'lunara_remembered_email';

export interface SimulatedLoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  ok: true;
  user: AuthUser;
}

export interface AuthErrorResult {
  ok: false;
  error: string;
}

function deriveNameFromEmail(email: string): string {
  const local = email.split('@')[0] || 'Friend';
  const cleaned = local.replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return 'Friend';
  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Isolated frontend authentication simulation.
 * Replace this module with Supabase Auth (`supabase.auth.signInWithPassword`, etc.)
 * and server-verified JWT/role claims when backend integration begins.
 */
export const mockAuthService = {
  getRememberedEmail(): string {
    try {
      return window.localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
    } catch {
      return '';
    }
  },

  setRememberedEmail(email: string | null): void {
    try {
      if (email) {
        window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      } else {
        window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  },

  async signInWithEmail(input: SimulatedLoginInput): Promise<AuthResult | AuthErrorResult> {
    const email = input.email.trim().toLowerCase();
    const password = input.password;

    await new Promise((resolve) => window.setTimeout(resolve, 420));

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }

    if (!password || password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }

    // Standard sign-in always resolves to non-privileged 'user' role in preview mode.
    return {
      ok: true,
      user: {
        id: `sim-user-${email}`,
        name: deriveNameFromEmail(email),
        email,
        role: 'user',
        authMode: 'simulated-credentials',
      },
    };
  },

  async signInPreviewMember(): Promise<AuthUser> {
    await new Promise((resolve) => window.setTimeout(resolve, 260));

    return {
      id: 'sim-preview-user',
      name: 'Sora Takahashi',
      email: 'member.preview@lunara.local',
      role: 'user',
      authMode: 'simulated-preview',
    };
  },
};
