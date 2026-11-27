import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { mockAuthService } from '../lib/mockAuth';
import type { AuthUser, UserRole } from '../types/lunara';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  rememberedEmail: string;
  signIn: (email: string, password: string, rememberEmail: boolean) => Promise<{ ok: boolean; error?: string }>;
  signInPreview: (role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Active session is held strictly in React memory (never persisted as fake tokens in storage).
  const [user, setUser] = useState<AuthUser | null>(null);
  const [rememberedEmail, setRememberedEmail] = useState<string>(() =>
    mockAuthService.getRememberedEmail()
  );

  const signIn = useCallback(async (email: string, password: string, remember: boolean) => {
    const result = await mockAuthService.signInWithEmail({ email, password });
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    if (remember) {
      mockAuthService.setRememberedEmail(result.user.email);
      setRememberedEmail(result.user.email);
    } else {
      mockAuthService.setRememberedEmail(null);
      setRememberedEmail('');
    }
    setUser(result.user);
    return { ok: true };
  }, []);

  const signInPreview = useCallback(async (role: UserRole) => {
    const previewUser = await mockAuthService.signInPreviewRole(role);
    setUser(previewUser);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'admin',
      rememberedEmail,
      signIn,
      signInPreview,
      logout,
    }),
    [user, rememberedEmail, signIn, signInPreview, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
