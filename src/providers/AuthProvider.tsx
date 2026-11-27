import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { mockAuthService } from '../lib/mockAuth';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { authService } from '../services/authService';
import type { AuthUser } from '../types/lunara';

export interface AuthActionResult {
  ok: boolean;
  error?: string;
}

export interface SignUpActionResult extends AuthActionResult {
  requiresEmailConfirmation?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPreviewMode: boolean;
  isVerifiedAdmin: boolean;
  isLoading: boolean;
  isSupabaseEnabled: boolean;
  rememberedEmail: string;
  signIn: (
    email: string,
    password: string,
    rememberEmail: boolean
  ) => Promise<AuthActionResult>;
  signUp: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<SignUpActionResult>;
  resetPassword: (email: string) => Promise<AuthActionResult>;
  signInPreview: () => Promise<AuthActionResult>;
  logout: () => Promise<AuthActionResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(isSupabaseConfigured);
  const [rememberedEmail, setRememberedEmail] = useState<string>(() =>
    mockAuthService.getRememberedEmail()
  );

  // Monotonic sequence counter prevents stale async hydrations from overwriting newer auth state.
  const hydrationSeqRef = useRef(0);
  const inFlightUserIdRef = useRef<string | null>(null);
  const inFlightPromiseRef = useRef<Promise<AuthUser | null> | null>(null);
  const userRef = useRef<AuthUser | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const hydrateSupabaseUser = useCallback(
    async (expectedUserId?: string, forceRefresh = false): Promise<AuthUser | null> => {
      if (!isSupabaseConfigured) {
        return null;
      }

      // Coalesce concurrent hydrations for the same user unless a forced refresh (e.g., USER_UPDATED) is requested.
      if (
        !forceRefresh &&
        expectedUserId &&
        inFlightUserIdRef.current === expectedUserId &&
        inFlightPromiseRef.current
      ) {
        return inFlightPromiseRef.current;
      }

      const seq = ++hydrationSeqRef.current;
      const run = (async () => {
        const result = await authService.getSessionUserWithRole();

        if (!mountedRef.current || seq !== hydrationSeqRef.current) {
          return null;
        }

        if (!result.ok) {
          setUser(null);
          setIsLoading(false);
          return null;
        }

        if (!result.data) {
          setUser(null);
          setIsLoading(false);
          return null;
        }

        setUser(result.data);
        setIsLoading(false);
        return result.data;
      })();

      if (expectedUserId) {
        inFlightUserIdRef.current = expectedUserId;
        inFlightPromiseRef.current = run;
      }

      try {
        return await run;
      } finally {
        if (inFlightPromiseRef.current === run) {
          inFlightUserIdRef.current = null;
          inFlightPromiseRef.current = null;
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setIsLoading(false);
      return;
    }

    let active = true;

    // 1. Initial session restoration on mount.
    void (async () => {
      try {
        const sessionResult = await authService.getSession();
        if (!active || !mountedRef.current) return;

        if (sessionResult.ok && sessionResult.data?.user) {
          await hydrateSupabaseUser(sessionResult.data.user.id);
        } else {
          hydrationSeqRef.current += 1;
          setUser(null);
        }
      } finally {
        if (active && mountedRef.current) {
          setIsLoading(false);
        }
      }
    })();

    // 2. Subscribe to auth state changes. Keep callback synchronous to avoid Supabase auth-lock deadlocks;
    //    defer any async profile/role queries via setTimeout(0).
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (!active || !mountedRef.current) return;

      if (event === 'INITIAL_SESSION') {
        // Handled by initial startup restoration above to prevent duplicate hydration.
        return;
      }

      if (event === 'SIGNED_OUT' || !session?.user) {
        hydrationSeqRef.current += 1;
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const targetUserId = session.user.id;
        const forceRefresh = event === 'USER_UPDATED';
        if (userRef.current?.authMode !== 'supabase' || userRef.current.id !== targetUserId) {
          setUser(null);
          setIsLoading(true);
        }
        window.setTimeout(() => {
          if (!active || !mountedRef.current) return;
          void hydrateSupabaseUser(targetUserId, forceRefresh);
        }, 0);
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        const targetUserId = session.user.id;
        window.setTimeout(() => {
          if (!active || !mountedRef.current) return;
          const current = userRef.current;
          if (current?.authMode === 'supabase' && current.id === targetUserId) {
            return;
          }
          void hydrateSupabaseUser(targetUserId);
        }, 0);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [hydrateSupabaseUser]);

  const updateRememberedEmail = useCallback((email: string, remember: boolean) => {
    if (remember) {
      mockAuthService.setRememberedEmail(email);
      setRememberedEmail(email);
    } else {
      mockAuthService.setRememberedEmail(null);
      setRememberedEmail('');
    }
  }, []);

  const signIn = useCallback(
    async (
      email: string,
      password: string,
      remember: boolean
    ): Promise<AuthActionResult> => {
      if (!isSupabaseConfigured) {
        return {
          ok: false,
          error: 'Authentication is unavailable because Supabase is not configured.',
        };
      }

      hydrationSeqRef.current += 1;
      setUser(null);
      setIsLoading(true);

      const result = await authService.signIn(email, password);
      if (!result.ok) {
        setIsLoading(false);
        return { ok: false, error: result.error.message };
      }

      updateRememberedEmail(result.data.user.email ?? email.trim().toLowerCase(), remember);
      const hydratedUser = await hydrateSupabaseUser(result.data.user.id);
      if (!hydratedUser || hydratedUser.id !== result.data.user.id) {
        setUser(null);
        setIsLoading(false);
        return {
          ok: false,
          error: 'Your session could not be verified. Please try signing in again.',
        };
      }
      return { ok: true };
    },
    [hydrateSupabaseUser, updateRememberedEmail]
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName?: string
    ): Promise<SignUpActionResult> => {
      if (!isSupabaseConfigured) {
        return {
          ok: false,
          error: 'Account registration requires Supabase authentication to be configured.',
        };
      }

      const result = await authService.signUp(email, password, displayName);
      if (!result.ok) {
        return { ok: false, error: result.error.message };
      }

      if (result.data.session && result.data.user) {
        setUser(null);
        setIsLoading(true);
        const hydratedUser = await hydrateSupabaseUser(result.data.user.id);
        if (!hydratedUser || hydratedUser.id !== result.data.user.id) {
          setUser(null);
          setIsLoading(false);
          return {
            ok: false,
            error: 'Your account was created, but its profile could not be verified. Please sign in after confirmation.',
          };
        }
        setIsLoading(false);
      }

      return {
        ok: true,
        requiresEmailConfirmation: result.data.requiresEmailConfirmation,
      };
    },
    [hydrateSupabaseUser]
  );

  const resetPassword = useCallback(async (email: string): Promise<AuthActionResult> => {
    if (!isSupabaseConfigured) {
      return {
        ok: false,
        error: 'Password recovery requires Supabase authentication to be configured.',
      };
    }

    const result = await authService.resetPassword(email);
    if (!result.ok) {
      return { ok: false, error: result.error.message };
    }

    return { ok: true };
  }, []);

  const signInPreview = useCallback(async (): Promise<AuthActionResult> => {
    if (userRef.current?.authMode === 'supabase') {
      return {
        ok: false,
        error: 'Sign out of your cloud account before entering preview mode.',
      };
    }

    if (isSupabaseConfigured) {
      const sessionResult = await authService.getSession();
      if (sessionResult.ok && sessionResult.data?.user) {
        return {
          ok: false,
          error: 'An active cloud session exists. Sign out before entering preview mode.',
        };
      }
    }

    const seq = ++hydrationSeqRef.current;
    const previewUser = await mockAuthService.signInPreviewMember();
    const latestUser = userRef.current as AuthUser | null;

    if (!mountedRef.current || seq !== hydrationSeqRef.current || latestUser?.authMode === 'supabase') {
      return {
        ok: false,
        error: 'Preview session was superseded by another authentication state.',
      };
    }

    setUser(previewUser);
    return { ok: true };
  }, []);

  const logout = useCallback(async (): Promise<AuthActionResult> => {
    hydrationSeqRef.current += 1;
    setIsLoading(true);
    setUser(null);

    if (!isSupabaseConfigured || user?.authMode !== 'supabase') {
      setUser(null);
      setIsLoading(false);
      return { ok: true };
    }

    try {
      const result = await authService.signOut();
      if (!result.ok) {
        setIsLoading(false);
        return { ok: false, error: result.error.message };
      }
      setUser(null);
      setIsLoading(false);
      return { ok: true };
    } catch {
      setUser(null);
      setIsLoading(false);
      return { ok: false, error: 'Logout failed because the Supabase session could not be cleared.' };
    }
  }, [user?.authMode]);

  const isPreviewMode = user?.authMode === 'simulated-preview';
  const isVerifiedAdmin = user?.authMode === 'supabase' && user?.role === 'admin';
  const isAdmin = isVerifiedAdmin;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isAdmin,
      isPreviewMode,
      isVerifiedAdmin,
      isLoading,
      isSupabaseEnabled: isSupabaseConfigured,
      rememberedEmail,
      signIn,
      signUp,
      resetPassword,
      signInPreview,
      logout,
    }),
    [
      user,
      isAdmin,
      isPreviewMode,
      isVerifiedAdmin,
      isLoading,
      rememberedEmail,
      signIn,
      signUp,
      resetPassword,
      signInPreview,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
