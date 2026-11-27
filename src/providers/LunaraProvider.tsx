import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildSampleJourney,
  DEFAULT_ADMIN_CONFIG,
  DEFAULT_CHECKIN_PARAMETERS,
} from '../data/sampleJourney';
import {
  DEFAULT_AFFIRMATIONS,
  DEFAULT_ANNOUNCEMENTS,
  DEFAULT_NOTIFICATION_PREFS,
  DEFAULT_REFLECTION_PROMPTS,
  DEFAULT_WISDOM_ENTRIES,
} from '../data/wisdomAndAffirmations';
import { lunaraStorage } from '../lib/storage';
import { adminService } from '../services/adminService';
import { checkInService } from '../services/checkInService';
import { journalService } from '../services/journalService';
import { notificationService } from '../services/notificationService';
import { preferencesService } from '../services/preferencesService';
import { profileService } from '../services/profileService';
import { roleService } from '../services/roleService';
import { sharedWisdomService } from '../services/sharedWisdomService';
import { wisdomService } from '../services/wisdomService';
import { useAuth } from './AuthProvider';
import type {
  AdminSystemConfig,
  AdminUserPrototype,
  AffirmationItem,
  AnnouncementItem,
  AuditLogEntry,
  CheckInEntry,
  CheckInParameterConfig,
  JournalEntry,
  NotificationCategory,
  NotificationPreferences,
  ReflectionPromptItem,
  ThemeMode,
  UserNotification,
  UserProfile,
  WisdomEntry,
} from '../types/lunara';

export interface ToastMessage {
  id: string;
  message: string;
  tone?: 'lavender' | 'teal' | 'blue' | 'rose' | 'amber';
}

export type LunaraDataMode = 'transition' | 'demo' | 'authenticated';

const EMPTY_PROFILE: UserProfile = {
  displayName: '',
  preferredCheckInTime: 'evening',
  dailyReminderEnabled: false,
  reminderTime: '20:30',
  showGreetingPrompts: true,
};

interface LunaraContextValue {
  dataMode: LunaraDataMode;
  isDataReady: boolean;

  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;

  checkIns: CheckInEntry[];
  saveCheckIn: (entry: Omit<CheckInEntry, 'id' | 'updatedAt'> & { id?: string }) => Promise<CheckInEntry>;
  deleteCheckIn: (dateKey: string) => Promise<void>;
  getCheckInByDate: (dateKey: string) => CheckInEntry | undefined;

  journals: JournalEntry[];
  saveJournal: (
    entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => Promise<JournalEntry>;
  deleteJournal: (id: string) => Promise<void>;

  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;

  parameters: CheckInParameterConfig[];
  updateParameters: (next: CheckInParameterConfig[]) => void;

  adminConfig: AdminSystemConfig;
  updateAdminConfig: (patch: Partial<AdminSystemConfig>) => void;

  // Affirmations
  affirmations: AffirmationItem[];
  publishedAffirmations: AffirmationItem[];
  favoriteAffirmationIds: string[];
  toggleFavoriteAffirmation: (id: string) => void;
  addAffirmation: (
    item: Omit<AffirmationItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ) => AffirmationItem;
  updateAffirmation: (id: string, patch: Partial<AffirmationItem>) => void;
  deleteAffirmation: (id: string) => void;

  // Wisdom (Bhagavad Gita)
  wisdomEntries: WisdomEntry[];
  publishedWisdom: WisdomEntry[];
  dailyWisdom: WisdomEntry | null;
  wisdomLoading: boolean;
  wisdomError: string | null;
  refreshWisdom: () => Promise<void>;
  savedWisdomIds: string[];
  addWisdom: (item: Omit<WisdomEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<WisdomEntry>;
  updateWisdom: (id: string, patch: Partial<WisdomEntry>) => Promise<void>;
  deleteWisdom: (id: string) => Promise<void>;
  setDailyWisdom: (id: string) => Promise<void>;
  toggleBookmarkWisdom: (id: string) => Promise<void>;

  // Reflection Prompts
  reflectionPrompts: ReflectionPromptItem[];
  savePrompt: (
    prompt: Omit<ReflectionPromptItem, 'id' | 'updatedAt'> & { id?: string }
  ) => void;
  deletePrompt: (id: string) => void;

  // Announcements & Notifications
  announcements: AnnouncementItem[];
  publishAnnouncement: (item: {
    title: string;
    message: string;
    category?: NotificationCategory;
  }) => void;
  deleteAnnouncement: (id: string) => void;

  notifications: UserNotification[];
  unreadNotificationCount: number;
  notificationPrefs: NotificationPreferences;
  updateNotificationPrefs: (patch: Partial<NotificationPreferences>) => Promise<void>;
  sendNotification: (payload: {
    title: string;
    message: string;
    category: NotificationCategory;
    targetUserId?: string;
    targetUserLabel?: string;
    targetUserName?: string;
  }) => Promise<void>;
  markNotificationRead: (id: string, read?: boolean) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;

  // Admin Prototype Directory & Audit Logs
  adminUsers: AdminUserPrototype[];
  addAdminUser: (user: Omit<AdminUserPrototype, 'id' | 'joinedDate' | 'lastActive'>) => AdminUserPrototype;
  updateAdminUser: (id: string, patch: Partial<AdminUserPrototype>) => void;
  auditLogs: AuditLogEntry[];
  appendAuditLog: (action: string, details: string, targetUserName?: string) => void;

  hasSampleData: boolean;
  loadSampleJourney: () => void;
  clearSampleJourney: () => void;
  clearAllData: () => void;

  toasts: ToastMessage[];
  showToast: (message: string, tone?: ToastMessage['tone']) => void;
  dismissToast: (id: string) => void;
}

const LunaraContext = createContext<LunaraContextValue | null>(null);

export const LunaraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading: isAuthLoading } = useAuth();

  const dataMode: LunaraDataMode = useMemo(() => {
    if (isAuthLoading || !user) return 'transition';
    return user.authMode === 'supabase' ? 'authenticated' : 'demo';
  }, [isAuthLoading, user]);

  const targetContextKey = useMemo(() => {
    if (isAuthLoading) return 'auth-loading';
    if (!user) return 'signed-out';
    return user.authMode === 'supabase' ? `auth:${user.id}` : `demo:${user.id}`;
  }, [isAuthLoading, user]);

  const [hydratedContextKey, setHydratedContextKey] = useState<string>('');
  const contextVersionRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => lunaraStorage.getTheme());
  const [systemDark, setSystemDark] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : true
  );

  // Initialize user-specific state strictly empty/default so legacy localStorage
  // is never exposed before auth context resolves or in authenticated mode.
  const [checkIns, setCheckIns] = useState<CheckInEntry[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [parameters, setParameters] = useState<CheckInParameterConfig[]>(DEFAULT_CHECKIN_PARAMETERS);
  const [adminConfig, setAdminConfig] = useState<AdminSystemConfig>(DEFAULT_ADMIN_CONFIG);

  const [affirmations, setAffirmations] = useState<AffirmationItem[]>(DEFAULT_AFFIRMATIONS);
  const [favoriteAffirmationIds, setFavoriteAffirmationIds] = useState<string[]>([]);
  const [wisdomEntries, setWisdomEntries] = useState<WisdomEntry[]>([]);
  const [wisdomLoading, setWisdomLoading] = useState(false);
  const [wisdomError, setWisdomError] = useState<string | null>(null);
  const [savedWisdomIds, setSavedWisdomIds] = useState<string[]>([]);
  const [reflectionPrompts, setReflectionPrompts] =
    useState<ReflectionPromptItem[]>(DEFAULT_REFLECTION_PROMPTS);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(DEFAULT_ANNOUNCEMENTS);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [notificationPrefs, setNotificationPrefs] =
    useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFS);
  const [adminUsers, setAdminUsers] = useState<AdminUserPrototype[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToastRef = useRef<(message: string, tone?: ToastMessage['tone']) => void>(() => { });

  // Isolate and reset user-specific state on every auth context transition.
  useEffect(() => {
    const version = ++contextVersionRef.current;

    if (isAuthLoading) {
      setCheckIns([]);
      setJournals([]);
      setProfile(EMPTY_PROFILE);
      setParameters(DEFAULT_CHECKIN_PARAMETERS);
      setAdminConfig(DEFAULT_ADMIN_CONFIG);
      setAffirmations(DEFAULT_AFFIRMATIONS);
      setFavoriteAffirmationIds([]);
      setWisdomEntries([]);
      setWisdomLoading(true);
      setWisdomError(null);
      setSavedWisdomIds([]);
      setReflectionPrompts(DEFAULT_REFLECTION_PROMPTS);
      setAnnouncements([]);
      setNotifications([]);
      setNotificationPrefs(DEFAULT_NOTIFICATION_PREFS);
      setAdminUsers([]);
      setAuditLogs([]);
      return;
    }

    if (!user) {
      setCheckIns([]);
      setJournals([]);
      setProfile(EMPTY_PROFILE);
      setParameters(DEFAULT_CHECKIN_PARAMETERS);
      setAdminConfig(DEFAULT_ADMIN_CONFIG);
      setAffirmations(DEFAULT_AFFIRMATIONS);
      setFavoriteAffirmationIds([]);
      setWisdomEntries(DEFAULT_WISDOM_ENTRIES);
      setWisdomLoading(false);
      setWisdomError(null);
      setSavedWisdomIds([]);
      setReflectionPrompts(DEFAULT_REFLECTION_PROMPTS);
      setAnnouncements(DEFAULT_ANNOUNCEMENTS);
      setNotifications([]);
      setNotificationPrefs(DEFAULT_NOTIFICATION_PREFS);
      setAdminUsers([]);
      setAuditLogs([]);
      if (version === contextVersionRef.current) {
        setHydratedContextKey(targetContextKey);
      }
      return;
    }

    if (user.authMode === 'supabase') {
      // Authenticated mode: strictly isolate from legacy global localStorage,
      // then hydrate cloud personal data for the current user.
      setCheckIns([]);
      setJournals([]);
      setProfile({
        ...EMPTY_PROFILE,
        displayName: user.name,
      });
      setParameters(DEFAULT_CHECKIN_PARAMETERS);
      setAdminConfig(DEFAULT_ADMIN_CONFIG);
      setAffirmations(DEFAULT_AFFIRMATIONS);
      setFavoriteAffirmationIds([]);
      setWisdomEntries([]);
      setWisdomLoading(true);
      setWisdomError(null);
      setSavedWisdomIds([]);
      setReflectionPrompts(DEFAULT_REFLECTION_PROMPTS);
      setAnnouncements([]);
      setNotifications([]);
      setNotificationPrefs(DEFAULT_NOTIFICATION_PREFS);
      setAdminUsers([]);
      setAuditLogs([]);

      void (async () => {
        try {
          const [
            checkInsResult,
            journalsResult,
            profileResult,
            preferencesResult,
            savedWisdomResult,
            wisdomResult,
            notificationsResult,
          ] = await Promise.all([
            checkInService.listByUser(),
            journalService.listByUser(),
            profileService.getOwnProfile(),
            preferencesService.getOwnPreferences(),
            wisdomService.listSavedIds(),
            sharedWisdomService.listWisdom(),
            notificationService.listOwnNotifications(),
          ]);
          if (!mountedRef.current || version !== contextVersionRef.current) {
            return;
          }

          if (checkInsResult.ok) setCheckIns(checkInsResult.data);
          if (journalsResult.ok) setJournals(journalsResult.data);
          if (profileResult.ok && profileResult.data) {
            setProfile({
              displayName: profileResult.data.displayName,
              preferredCheckInTime: profileResult.data.preferredCheckInTime,
              dailyReminderEnabled: profileResult.data.dailyReminderEnabled,
              reminderTime: profileResult.data.reminderTime,
              showGreetingPrompts: profileResult.data.showGreetingPrompts,
            });
          }
          if (preferencesResult.ok && preferencesResult.data) {
            setThemeModeState(preferencesResult.data.themeMode);
            setFavoriteAffirmationIds(preferencesResult.data.favoriteAffirmationIds);
            setNotificationPrefs(preferencesResult.data.notificationPrefs);
          }
          if (savedWisdomResult.ok) setSavedWisdomIds(savedWisdomResult.data);
          if (wisdomResult.ok) {
            setWisdomEntries(wisdomResult.data);
            setWisdomError(null);
          } else {
            setWisdomEntries([]);
            setWisdomError(wisdomResult.error.message);
          }
          if (notificationsResult.ok) setNotifications(notificationsResult.data);
          if (user.role === 'admin') {
            const adminUsersResult = await adminService.listUsers();
            if (mountedRef.current && version === contextVersionRef.current) {
              if (adminUsersResult.ok) setAdminUsers(adminUsersResult.data);
              else showToastRef.current(adminUsersResult.error.message, 'amber');
            }
          }

          const failures = [
            checkInsResult,
            journalsResult,
            profileResult,
            preferencesResult,
            savedWisdomResult,
            wisdomResult,
            notificationsResult,
          ].filter((result) => !result.ok);
          if (failures.length > 0) {
            showToastRef.current('Some cloud data could not be loaded. You can retry by refreshing.', 'amber');
          }
        } catch {
          if (!mountedRef.current || version !== contextVersionRef.current) {
            return;
          }
          setCheckIns([]);
          setWisdomEntries([]);
          setWisdomError('Shared wisdom could not be loaded. Please retry.');
          showToastRef.current('Could not load your saved check-ins.', 'amber');
        } finally {
          if (mountedRef.current && version === contextVersionRef.current) {
            setWisdomLoading(false);
            setHydratedContextKey(targetContextKey);
          }
        }
      })();

      return () => {
        contextVersionRef.current += 1;
      };
    }

    // Demo / preview mode: load legacy localStorage sandbox.
    setCheckIns(lunaraStorage.getCheckIns());
    setJournals(lunaraStorage.getJournals());
    setProfile(lunaraStorage.getProfile());
    setParameters(lunaraStorage.getParameters());
    setAdminConfig(lunaraStorage.getAdminConfig());
    setAffirmations(lunaraStorage.getAffirmations());
    setFavoriteAffirmationIds(lunaraStorage.getFavoriteAffirmationIds());
    setWisdomEntries(lunaraStorage.getWisdomEntries());
    setWisdomLoading(false);
    setWisdomError(null);
    setSavedWisdomIds(lunaraStorage.getSavedWisdomIds());
    setReflectionPrompts(lunaraStorage.getReflectionPrompts());
    setAnnouncements(lunaraStorage.getAnnouncements());
    setNotifications(lunaraStorage.getNotifications());
    setNotificationPrefs(lunaraStorage.getNotificationPrefs());
    setAdminUsers(lunaraStorage.getAdminUsers());
    setAuditLogs(lunaraStorage.getAuditLogs());
    if (version === contextVersionRef.current) {
      setHydratedContextKey(targetContextKey);
    }
  }, [isAuthLoading, user, targetContextKey]);

  const isDataReady = !isAuthLoading && hydratedContextKey === targetContextKey;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  const resolvedTheme: 'light' | 'dark' =
    themeMode === 'system' ? (systemDark ? 'dark' : 'light') : themeMode;

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', resolvedTheme === 'dark' ? '#17131F' : '#F5F0F7');
    }
  }, [resolvedTheme]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    if (dataMode === 'authenticated') {
      void preferencesService.upsertOwnPreferences({ themeMode: mode }).then((result) => {
        if (!result.ok) showToastRef.current(result.error.message, 'amber');
      });
    } else if (dataMode === 'demo') {
      lunaraStorage.setTheme(mode);
    }
  }, [dataMode]);

  const toggleTheme = useCallback(() => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
  }, [resolvedTheme, setThemeMode]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastMessage['tone'] = 'lavender') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 3400);
    },
    [dismissToast]
  );

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  const guardDemoOnlyMutation = useCallback(
    (notifyInAuth = true): boolean => {
      if (dataMode === 'demo') return true;
      if (dataMode === 'authenticated' && notifyInAuth) {
        showToast('This setting is demo-only and unavailable in a cloud account.', 'blue');
      }
      return false;
    },
    [dataMode, showToast]
  );

  const appendAuditLog = useCallback(
    (action: string, details: string, targetUserName?: string) => {
      if (dataMode !== 'demo') return;
      const entry: AuditLogEntry = {
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        actorName: user?.name || 'Workspace Admin',
        actorEmail: user?.email || 'admin@lunara.example',
        action,
        targetUserName,
        details,
      };
      setAuditLogs((prev) => {
        const next = [entry, ...prev].slice(0, 100);
        lunaraStorage.setAuditLogs(next);
        return next;
      });
    },
    [dataMode, user]
  );

  const saveCheckIn = useCallback(
    async (entry: Omit<CheckInEntry, 'id' | 'updatedAt'> & { id?: string }) => {
      const now = new Date().toISOString();
      if (dataMode === 'authenticated') {
        const existing = checkIns.find((checkIn) => checkIn.date === entry.date);
        const merged: typeof entry = {
          ...existing,
          ...entry,
          likes: entry.likes ?? existing?.likes ?? [],
          dislikes: entry.dislikes ?? existing?.dislikes ?? [],
          activities: entry.activities ?? existing?.activities ?? [],
          customActivities: entry.customActivities ?? existing?.customActivities ?? [],
          needs: entry.needs ?? existing?.needs ?? [],
          customValues: entry.customValues ?? existing?.customValues ?? {},
          proudOf: entry.proudOf ?? existing?.proudOf ?? '',
          tomorrowIntention: entry.tomorrowIntention ?? existing?.tomorrowIntention ?? '',
          notes: entry.notes ?? existing?.notes ?? '',
        };
        const result = await checkInService.upsertByDate(merged);
        if (!result.ok) {
          throw new Error(result.error.message);
        }
        setCheckIns((prev) => {
          const next = prev.some((checkIn) => checkIn.date === result.data.date)
            ? prev.map((checkIn) => (checkIn.date === result.data.date ? result.data : checkIn))
            : [...prev, result.data];
          next.sort((a, b) => b.date.localeCompare(a.date));
          return next;
        });
        return result.data;
      }
      if (dataMode !== 'demo') {
        throw new Error('Your personal data is still initializing.');
      }
      let savedRecord: CheckInEntry | null = null;
      setCheckIns((prev) => {
        const existing = prev.find((c) => c.date === entry.date);
        const record: CheckInEntry = {
          ...entry,
          id: existing?.id || entry.id || `ci-${entry.date}-${Date.now()}`,
          updatedAt: now,
          isSample: false,
        };
        savedRecord = record;
        const next = existing
          ? prev.map((c) => (c.date === entry.date ? record : c))
          : [...prev, record];
        next.sort((a, b) => b.date.localeCompare(a.date));
        lunaraStorage.setCheckIns(next);
        return next;
      });
      return (
        savedRecord || {
          ...entry,
          id: entry.id || `ci-${entry.date}`,
          updatedAt: now,
        }
      );
    },
    [dataMode, checkIns]
  );

  const deleteCheckIn = useCallback(
    async (dateKey: string) => {
      if (dataMode === 'authenticated') {
        const result = await checkInService.deleteByDate(dateKey);
        if (!result.ok) throw new Error(result.error.message);
        setCheckIns((prev) => prev.filter((checkIn) => checkIn.date !== dateKey));
        return;
      }
      if (dataMode !== 'demo') throw new Error('Your personal data is still initializing.');
      setCheckIns((prev) => {
        const next = prev.filter((c) => c.date !== dateKey);
        lunaraStorage.setCheckIns(next);
        return next;
      });
    },
    [dataMode]
  );

  const getCheckInByDate = useCallback(
    (dateKey: string) => checkIns.find((c) => c.date === dateKey),
    [checkIns]
  );

  const saveJournal = useCallback(
    async (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const now = new Date().toISOString();
      if (dataMode === 'authenticated') {
        const result = entry.id
          ? await journalService.update(entry.id, {
              date: entry.date,
              title: entry.title,
              content: entry.content,
              tags: entry.tags,
            })
          : await journalService.create({
              date: entry.date,
              title: entry.title,
              content: entry.content,
              tags: entry.tags,
            });
        if (!result.ok) throw new Error(result.error.message);
        setJournals((prev) => {
          const next = prev.some((journal) => journal.id === result.data.id)
            ? prev.map((journal) => (journal.id === result.data.id ? result.data : journal))
            : [result.data, ...prev];
          next.sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
          return next;
        });
        return result.data;
      }
      if (dataMode !== 'demo') {
        throw new Error('Your personal data is still initializing.');
      }
      let savedRecord: JournalEntry | null = null;
      setJournals((prev) => {
        const existing = entry.id ? prev.find((j) => j.id === entry.id) : undefined;
        const record: JournalEntry = {
          ...entry,
          id: existing?.id || entry.id || `jr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: existing?.createdAt || now,
          updatedAt: now,
          isSample: false,
        };
        savedRecord = record;
        const next = existing
          ? prev.map((j) => (j.id === existing.id ? record : j))
          : [record, ...prev];
        next.sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
        lunaraStorage.setJournals(next);
        return next;
      });
      return (
        savedRecord || {
          ...entry,
          id: entry.id || `jr-${Date.now()}`,
          createdAt: now,
          updatedAt: now,
        }
      );
    },
    [dataMode]
  );

  const deleteJournal = useCallback(
    async (id: string) => {
      if (dataMode === 'authenticated') {
        const result = await journalService.remove(id);
        if (!result.ok) throw new Error(result.error.message);
        setJournals((prev) => prev.filter((journal) => journal.id !== id));
        return;
      }
      if (dataMode !== 'demo') throw new Error('Your personal data is still initializing.');
      setJournals((prev) => {
        const next = prev.filter((j) => j.id !== id);
        lunaraStorage.setJournals(next);
        return next;
      });
    },
    [dataMode]
  );

  const updateProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      if (dataMode === 'authenticated') {
        setProfile((prev) => ({ ...prev, ...patch }));
        const result = await profileService.upsertOwnProfile(patch);
        if (!result.ok) throw new Error(result.error.message);
        setProfile({
          displayName: result.data.displayName,
          preferredCheckInTime: result.data.preferredCheckInTime,
          dailyReminderEnabled: result.data.dailyReminderEnabled,
          reminderTime: result.data.reminderTime,
          showGreetingPrompts: result.data.showGreetingPrompts,
        });
        return;
      }
      if (dataMode !== 'demo') throw new Error('Your personal data is still initializing.');
      setProfile((prev) => {
        const next = { ...prev, ...patch };
        lunaraStorage.setProfile(next);
        return next;
      });
    },
    [dataMode]
  );

  const updateParameters = useCallback(
    (next: CheckInParameterConfig[]) => {
      if (!guardDemoOnlyMutation()) return;
      setParameters(next);
      lunaraStorage.setParameters(next);
      appendAuditLog('Updated Parameters', `Updated check-in parameter configuration (${next.filter((p) => p.enabled).length} active).`);
    },
    [guardDemoOnlyMutation, appendAuditLog]
  );

  const updateAdminConfig = useCallback(
    (patch: Partial<AdminSystemConfig>) => {
      if (!guardDemoOnlyMutation()) return;
      setAdminConfig((prev) => {
        const next = { ...prev, ...patch };
        lunaraStorage.setAdminConfig(next);
        return next;
      });
      appendAuditLog('Updated Workspace Config', 'Modified workspace configuration settings.');
    },
    [guardDemoOnlyMutation, appendAuditLog]
  );

  // Affirmations
  const publishedAffirmations = useMemo(
    () =>
      affirmations
        .filter((a) => a.status === 'published')
        .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999)),
    [affirmations]
  );

  const toggleFavoriteAffirmation = useCallback(
    (id: string) => {
      if (dataMode === 'authenticated') {
        const nextIds = favoriteAffirmationIds.includes(id)
          ? favoriteAffirmationIds.filter((x) => x !== id)
          : [...favoriteAffirmationIds, id];
        setFavoriteAffirmationIds(nextIds);
        void preferencesService.upsertOwnPreferences({ favoriteAffirmationIds: nextIds }).then((result) => {
          if (!result.ok) showToastRef.current(result.error.message, 'amber');
        });
        return;
      }
      if (dataMode !== 'demo') return;
      setFavoriteAffirmationIds((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        lunaraStorage.setFavoriteAffirmationIds(next);
        return next;
      });
    },
    [dataMode, favoriteAffirmationIds]
  );

  const addAffirmation = useCallback(
    (item: Omit<AffirmationItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
      const now = new Date().toISOString();
      const created: AffirmationItem = {
        ...item,
        id: `aff-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        createdAt: now,
        updatedAt: now,
        createdBy: user?.name || 'Admin',
      };
      setAffirmations((prev) => {
        const next = [created, ...prev];
        lunaraStorage.setAffirmations(next);
        return next;
      });
      appendAuditLog('Created Affirmation', `Added "${item.category}" affirmation (${item.status}).`);
      return created;
    },
    [user, appendAuditLog, dataMode, adminUsers]
  );

  const updateAffirmation = useCallback(
    (id: string, patch: Partial<AffirmationItem>) => {
      const now = new Date().toISOString();
      setAffirmations((prev) => {
        const next = prev.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: now } : a));
        lunaraStorage.setAffirmations(next);
        return next;
      });
      appendAuditLog('Updated Affirmation', `Updated affirmation ${id}.`);
    },
    [appendAuditLog, dataMode]
  );

  const deleteAffirmation = useCallback(
    (id: string) => {
      setAffirmations((prev) => {
        const next = prev.filter((a) => a.id !== id);
        lunaraStorage.setAffirmations(next);
        return next;
      });
      appendAuditLog('Removed Affirmation', `Deleted affirmation ${id}.`);
    },
    [appendAuditLog]
  );

  // Wisdom (Bhagavad Gita)
  const refreshWisdom = useCallback(async () => {
    if (dataMode !== 'authenticated') return;

    const version = contextVersionRef.current;
    setWisdomLoading(true);
    setWisdomError(null);
    try {
      const result = await sharedWisdomService.listWisdom();
      if (!mountedRef.current || version !== contextVersionRef.current) return;
      if (result.ok) {
        setWisdomEntries(result.data);
      } else {
        setWisdomError(result.error.message);
      }
    } catch {
      if (mountedRef.current && version === contextVersionRef.current) {
        setWisdomError('Shared wisdom could not be loaded. Please retry.');
      }
    } finally {
      if (mountedRef.current && version === contextVersionRef.current) {
        setWisdomLoading(false);
      }
    }
  }, [dataMode]);

  const publishedWisdom = useMemo(
    () => wisdomEntries.filter((w) => w.status === 'published'),
    [wisdomEntries]
  );

  const dailyWisdom = useMemo(() => {
    if (publishedWisdom.length === 0) return null;
    const assigned = publishedWisdom.find((w) => w.isDaily);
    if (assigned) return assigned;
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    return publishedWisdom[dayOfYear % publishedWisdom.length];
  }, [publishedWisdom]);

  const addWisdom = useCallback(
    async (item: Omit<WisdomEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (dataMode === 'authenticated') {
        const version = contextVersionRef.current;
        const result = await sharedWisdomService.addWisdom(item);
        if (!result.ok) throw new Error(result.error.message);

        if (mountedRef.current && version === contextVersionRef.current) {
          setWisdomEntries((prev) => {
            const existing = result.data.isDaily
              ? prev.map((entry) => ({ ...entry, isDaily: false }))
              : prev;
            return [result.data, ...existing.filter((entry) => entry.id !== result.data.id)];
          });
        }
        appendAuditLog(
          'Added Wisdom Passage',
          `Added Bhagavad Gita ${item.chapter}:${item.verse} (${item.status}).`
        );
        return result.data;
      }
      if (dataMode !== 'demo') throw new Error('Your shared wisdom library is still initializing.');

      const now = new Date().toISOString();
      const created: WisdomEntry = {
        ...item,
        id: `gita-${item.chapter}-${item.verse}-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      setWisdomEntries((prev) => {
        const cleaned = item.isDaily ? prev.map((w) => ({ ...w, isDaily: false })) : prev;
        const next = [created, ...cleaned];
        lunaraStorage.setWisdomEntries(next);
        return next;
      });
      appendAuditLog(
        'Added Wisdom Passage',
        `Added Bhagavad Gita ${item.chapter}:${item.verse} (${item.status}).`
      );
      return created;
    },
    [appendAuditLog, dataMode]
  );

  const updateWisdom = useCallback(
    async (id: string, patch: Partial<WisdomEntry>) => {
      if (dataMode === 'authenticated') {
        const version = contextVersionRef.current;
        const result = await sharedWisdomService.updateWisdom(id, patch);
        if (!result.ok) throw new Error(result.error.message);

        if (mountedRef.current && version === contextVersionRef.current) {
          setWisdomEntries((prev) =>
            prev.map((entry) => {
              if (entry.id === result.data.id) return result.data;
              if (result.data.isDaily) return { ...entry, isDaily: false };
              return entry;
            })
          );
        }
        appendAuditLog('Updated Wisdom Passage', `Modified wisdom entry ${id}.`);
        return;
      }
      if (dataMode !== 'demo') throw new Error('Your shared wisdom library is still initializing.');

      const now = new Date().toISOString();
      setWisdomEntries((prev) => {
        const next = prev.map((w) => {
          if (w.id === id) return { ...w, ...patch, updatedAt: now };
          if (patch.isDaily) return { ...w, isDaily: false };
          return w;
        });
        lunaraStorage.setWisdomEntries(next);
        return next;
      });
      appendAuditLog('Updated Wisdom Passage', `Modified wisdom entry ${id}.`);
    },
    [appendAuditLog, dataMode]
  );

  const deleteWisdom = useCallback(
    async (id: string) => {
      if (dataMode === 'authenticated') {
        const version = contextVersionRef.current;
        const result = await sharedWisdomService.deleteWisdom(id);
        if (!result.ok) throw new Error(result.error.message);
        if (mountedRef.current && version === contextVersionRef.current) {
          setWisdomEntries((prev) => prev.filter((entry) => entry.id !== id));
        }
        appendAuditLog('Deleted Wisdom Passage', `Removed wisdom entry ${id}.`);
        return;
      }
      if (dataMode !== 'demo') throw new Error('Your shared wisdom library is still initializing.');

      setWisdomEntries((prev) => {
        const next = prev.filter((w) => w.id !== id);
        lunaraStorage.setWisdomEntries(next);
        return next;
      });
      appendAuditLog('Deleted Wisdom Passage', `Removed wisdom entry ${id}.`);
    },
    [appendAuditLog, dataMode]
  );

  const setDailyWisdom = useCallback(
    async (id: string) => {
      if (dataMode === 'authenticated') {
        const version = contextVersionRef.current;
        const result = await sharedWisdomService.updateWisdom(id, {
          isDaily: true,
          isFeatured: true,
        });
        if (!result.ok) throw new Error(result.error.message);
        if (mountedRef.current && version === contextVersionRef.current) {
          setWisdomEntries((prev) =>
            prev.map((entry) =>
              entry.id === result.data.id
                ? result.data
                : { ...entry, isDaily: false }
            )
          );
        }
        appendAuditLog('Assigned Daily Wisdom', `Assigned wisdom passage ${id} as featured daily verse.`);
        return;
      }
      if (dataMode !== 'demo') throw new Error('Your shared wisdom library is still initializing.');

      const now = new Date().toISOString();
      setWisdomEntries((prev) => {
        const next = prev.map((w) => ({
          ...w,
          isDaily: w.id === id,
          isFeatured: w.id === id ? true : w.isFeatured,
          updatedAt: w.id === id ? now : w.updatedAt,
        }));
        lunaraStorage.setWisdomEntries(next);
        return next;
      });
      appendAuditLog('Assigned Daily Wisdom', `Assigned wisdom passage ${id} as featured daily verse.`);
    },
    [appendAuditLog, dataMode]
  );

  const toggleBookmarkWisdom = useCallback(
    async (id: string) => {
      if (dataMode === 'authenticated') {
        const willSave = !savedWisdomIds.includes(id);
        setSavedWisdomIds((prev) =>
          willSave ? [...prev, id] : prev.filter((savedId) => savedId !== id)
        );
        const result = willSave
          ? await wisdomService.saveWisdom(id)
          : await wisdomService.unsaveWisdom(id);
        if (!result.ok) {
          setSavedWisdomIds((prev) =>
            willSave ? prev.filter((savedId) => savedId !== id) : [...prev, id]
          );
          throw new Error(result.error.message);
        }
        return;
      }
      if (dataMode !== 'demo') throw new Error('Your personal data is still initializing.');
      setSavedWisdomIds((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        lunaraStorage.setSavedWisdomIds(next);
        return next;
      });
    },
    [dataMode, savedWisdomIds]
  );

  // Reflection Prompts
  const savePrompt = useCallback(
    (prompt: Omit<ReflectionPromptItem, 'id' | 'updatedAt'> & { id?: string }) => {
      const now = new Date().toISOString();
      setReflectionPrompts((prev) => {
        const exists = prompt.id ? prev.find((p) => p.id === prompt.id) : undefined;
        const record: ReflectionPromptItem = {
          ...prompt,
          id: exists?.id || prompt.id || `prm-${Date.now()}`,
          updatedAt: now,
        };
        const next = exists
          ? prev.map((p) => (p.id === exists.id ? record : p))
          : [record, ...prev];
        lunaraStorage.setReflectionPrompts(next);
        return next;
      });
      appendAuditLog('Saved Reflection Prompt', `Updated reflection prompt (${prompt.placement}).`);
    },
    [appendAuditLog]
  );

  const deletePrompt = useCallback(
    (id: string) => {
      setReflectionPrompts((prev) => {
        const next = prev.filter((p) => p.id !== id);
        lunaraStorage.setReflectionPrompts(next);
        return next;
      });
      appendAuditLog('Removed Reflection Prompt', `Deleted prompt ${id}.`);
    },
    [appendAuditLog]
  );

  // Notifications & Announcements
  const sendNotification = useCallback(
    async (payload: {
      title: string;
      message: string;
      category: NotificationCategory;
      targetUserId?: string;
      targetUserLabel?: string;
      targetUserName?: string;
    }) => {
      if (dataMode === 'authenticated') {
        if (payload.targetUserId) {
          const result = await notificationService.createNotification({
            targetUserId: payload.targetUserId,
            title: payload.title,
            message: payload.message,
            category: payload.category,
            sender: user?.name || 'Lunara Admin',
          });
          if (!result.ok) throw new Error(result.error.message);
        } else {
          const recipients = adminUsers;
          for (const recipient of recipients) {
            if (!recipient.id.startsWith('usr-')) {
              const result = await notificationService.createNotification({
                targetUserId: recipient.id,
                title: payload.title,
                message: payload.message,
                category: payload.category,
                sender: user?.name || 'Lunara Admin',
              });
              if (!result.ok) throw new Error(result.error.message);
            }
          }
        }
        appendAuditLog(
          'Sent Notification',
          `Sent "${payload.category}" message ("${payload.title.trim()}") to ${payload.targetUserLabel || 'selected users'}.`,
          payload.targetUserName
        );
        return;
      }
      if (dataMode !== 'demo') throw new Error('Your personal data is still initializing.');
      const item: UserNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        title: payload.title.trim(),
        message: payload.message.trim(),
        category: payload.category,
        createdAt: new Date().toISOString(),
        read: false,
        sender: user?.name || 'Lunara Admin',
        targetUserLabel: payload.targetUserLabel,
        isPrototype: true,
      };
      setNotifications((prev) => {
        const next = [item, ...prev];
        lunaraStorage.setNotifications(next);
        return next;
      });
      appendAuditLog(
        'Sent Notification',
        `Sent "${payload.category}" message ("${payload.title.trim()}") to ${payload.targetUserLabel || 'all users'}.`,
        payload.targetUserName
      );
    },
    [user, appendAuditLog]
  );

  const publishAnnouncement = useCallback(
    (item: { title: string; message: string; category?: NotificationCategory }) => {
      const now = new Date().toISOString();
      const created: AnnouncementItem = {
        id: `ann-${Date.now()}`,
        title: item.title.trim(),
        message: item.message.trim(),
        category: item.category || 'announcement',
        status: 'published',
        createdAt: now,
        createdBy: user?.name || 'Admin',
      };
      setAnnouncements((prev) => {
        const next = [created, ...prev];
        lunaraStorage.setAnnouncements(next);
        return next;
      });
      sendNotification({
        title: created.title,
        message: created.message,
        category: created.category,
        targetUserLabel: 'All prototype users',
      });
    },
    [user, sendNotification]
  );

  const deleteAnnouncement = useCallback(
    (id: string) => {
      setAnnouncements((prev) => {
        const next = prev.filter((a) => a.id !== id);
        lunaraStorage.setAnnouncements(next);
        return next;
      });
      appendAuditLog('Deleted Announcement', `Removed announcement ${id}.`);
    },
    [appendAuditLog]
  );

  const markNotificationRead = useCallback(
    async (id: string, read = true) => {
      if (dataMode === 'authenticated') {
        const result = await notificationService.markRead(id, read);
        if (!result.ok) throw new Error(result.error.message);
        setNotifications((prev) => prev.map((notification) =>
          notification.id === id ? result.data : notification
        ));
        return;
      }
      if (dataMode !== 'demo') throw new Error('Your personal data is still initializing.');
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, read } : n));
        lunaraStorage.setNotifications(next);
        return next;
      });
    },
    [dataMode]
  );

  const markAllNotificationsRead = useCallback(async () => {
    if (dataMode === 'authenticated') {
      const result = await notificationService.markAllRead();
      if (!result.ok) throw new Error(result.error.message);
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
      return;
    }
    if (dataMode !== 'demo') throw new Error('Your personal data is still initializing.');
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      lunaraStorage.setNotifications(next);
      return next;
    });
  }, [dataMode]);

  const deleteNotification = useCallback(
    async (id: string) => {
      if (dataMode === 'authenticated') {
        const result = await notificationService.remove(id);
        if (!result.ok) throw new Error(result.error.message);
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
        return;
      }
      if (dataMode !== 'demo') throw new Error('Your personal data is still initializing.');
      setNotifications((prev) => {
        const next = prev.filter((n) => n.id !== id);
        lunaraStorage.setNotifications(next);
        return next;
      });
    },
    [dataMode]
  );

  const updateNotificationPrefs = useCallback(
    async (patch: Partial<NotificationPreferences>) => {
      if (dataMode === 'authenticated') {
        const next = { ...notificationPrefs, ...patch };
        setNotificationPrefs(next);
        const result = await preferencesService.upsertOwnPreferences({ notificationPrefs: patch });
        if (!result.ok) throw new Error(result.error.message);
        setNotificationPrefs(result.data.notificationPrefs);
        return;
      }
      if (dataMode !== 'demo') throw new Error('Your personal data is still initializing.');
      setNotificationPrefs((prev) => {
        const next = { ...prev, ...patch };
        lunaraStorage.setNotificationPrefs(next);
        return next;
      });
    },
    [dataMode, notificationPrefs]
  );

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Prototype User Directory
  const addAdminUser = useCallback(
    (newUser: Omit<AdminUserPrototype, 'id' | 'joinedDate' | 'lastActive'>) => {
      if (dataMode === 'authenticated') {
        throw new Error('Use Supabase Auth to create real accounts; Lunara does not invite users from the client.');
      }
      const created: AdminUserPrototype = {
        ...newUser,
        id: `usr-${Date.now()}`,
        joinedDate: new Date().toISOString().slice(0, 10),
        lastActive: 'Pending invite',
        checkIns: newUser.checkIns || [],
        journals: newUser.journals || [],
      };
      setAdminUsers((prev) => {
        const next = [created, ...prev];
        lunaraStorage.setAdminUsers(next);
        return next;
      });
      appendAuditLog('Added Prototype User', `Added ${created.name} (${created.role}) to prototype directory.`, created.name);
      return created;
    },
    [appendAuditLog, dataMode, showToast]
  );

  const updateAdminUser = useCallback(
    (id: string, patch: Partial<AdminUserPrototype>) => {
      if (dataMode === 'authenticated' && patch.role) {
        const backendRole = patch.role === 'Admin' ? 'admin' : 'user';
        void roleService.setUserRole(id, backendRole).then((result) => {
          if (!result.ok) {
            showToastRef.current(result.error.message, 'amber');
            return;
          }
          if (dataMode === 'authenticated') return;
          setAdminUsers((prev) => prev.map((user) =>
            user.id === id ? { ...user, role: patch.role as AdminUserPrototype['role'] } : user
          ));
        });
        return;
      }
      setAdminUsers((prev) => {
        const target = prev.find((u) => u.id === id);
        const next = prev.map((u) => (u.id === id ? { ...u, ...patch } : u));
        lunaraStorage.setAdminUsers(next);
        if (target) {
          appendAuditLog(
            'Updated User Account',
            `Modified prototype account settings (${Object.keys(patch).join(', ')}).`,
            target.name
          );
        }
        return next;
      });
    },
    [appendAuditLog, dataMode]
  );

  const hasSampleData = useMemo(
    () => checkIns.some((c) => c.isSample) || journals.some((j) => j.isSample),
    [checkIns, journals]
  );

  const loadSampleJourney = useCallback(() => {
    if (!guardDemoOnlyMutation()) return;
    const sample = buildSampleJourney();
    setCheckIns((prev) => {
      const nonSample = prev.filter((c) => !c.isSample);
      const existingDates = new Set(nonSample.map((c) => c.date));
      const merged = [
        ...nonSample,
        ...sample.checkIns.filter((s) => !existingDates.has(s.date)),
      ].sort((a, b) => b.date.localeCompare(a.date));
      lunaraStorage.setCheckIns(merged);
      return merged;
    });
    setJournals((prev) => {
      const nonSample = prev.filter((j) => !j.isSample);
      const existingIds = new Set(nonSample.map((j) => j.id));
      const merged = [
        ...nonSample,
        ...sample.journals.filter((s) => !existingIds.has(s.id)),
      ].sort((a, b) => b.date.localeCompare(a.date));
      lunaraStorage.setJournals(merged);
      return merged;
    });
    showToast('Sample week added so you can explore Lunara.', 'blue');
  }, [guardDemoOnlyMutation, showToast]);

  const clearSampleJourney = useCallback(() => {
    if (!guardDemoOnlyMutation()) return;
    setCheckIns((prev) => {
      const next = prev.filter((c) => !c.isSample);
      lunaraStorage.setCheckIns(next);
      return next;
    });
    setJournals((prev) => {
      const next = prev.filter((j) => !j.isSample);
      lunaraStorage.setJournals(next);
      return next;
    });
    showToast('Sample entries removed.', 'lavender');
  }, [guardDemoOnlyMutation, showToast]);

  const clearAllData = useCallback(() => {
    if (!guardDemoOnlyMutation()) return;
    lunaraStorage.clearAll();
    setCheckIns([]);
    setJournals([]);
    setProfile(EMPTY_PROFILE);
    setParameters(DEFAULT_CHECKIN_PARAMETERS);
    setAdminConfig(DEFAULT_ADMIN_CONFIG);
    setSavedWisdomIds([]);
    setFavoriteAffirmationIds([]);
    setNotificationPrefs(DEFAULT_NOTIFICATION_PREFS);
    showToast('Local reflections cleared.', 'lavender');
  }, [guardDemoOnlyMutation, showToast]);

  const value = useMemo<LunaraContextValue>(
    () => ({
      dataMode,
      isDataReady,
      themeMode,
      resolvedTheme,
      setThemeMode,
      toggleTheme,
      checkIns,
      saveCheckIn,
      deleteCheckIn,
      getCheckInByDate,
      journals,
      saveJournal,
      deleteJournal,
      profile,
      updateProfile,
      parameters,
      updateParameters,
      adminConfig,
      updateAdminConfig,
      affirmations,
      publishedAffirmations,
      favoriteAffirmationIds,
      toggleFavoriteAffirmation,
      addAffirmation,
      updateAffirmation,
      deleteAffirmation,
      wisdomEntries,
      publishedWisdom,
      dailyWisdom,
      wisdomLoading,
      wisdomError,
      refreshWisdom,
      savedWisdomIds,
      addWisdom,
      updateWisdom,
      deleteWisdom,
      setDailyWisdom,
      toggleBookmarkWisdom,
      reflectionPrompts,
      savePrompt,
      deletePrompt,
      announcements,
      publishAnnouncement,
      deleteAnnouncement,
      notifications,
      unreadNotificationCount,
      notificationPrefs,
      updateNotificationPrefs,
      sendNotification,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      adminUsers,
      addAdminUser,
      updateAdminUser,
      auditLogs,
      appendAuditLog,
      hasSampleData,
      loadSampleJourney,
      clearSampleJourney,
      clearAllData,
      toasts,
      showToast,
      dismissToast,
    }),
    [
      dataMode,
      isDataReady,
      themeMode,
      resolvedTheme,
      setThemeMode,
      toggleTheme,
      checkIns,
      saveCheckIn,
      deleteCheckIn,
      getCheckInByDate,
      journals,
      saveJournal,
      deleteJournal,
      profile,
      updateProfile,
      parameters,
      updateParameters,
      adminConfig,
      updateAdminConfig,
      affirmations,
      publishedAffirmations,
      favoriteAffirmationIds,
      toggleFavoriteAffirmation,
      addAffirmation,
      updateAffirmation,
      deleteAffirmation,
      wisdomEntries,
      publishedWisdom,
      dailyWisdom,
      wisdomLoading,
      wisdomError,
      refreshWisdom,
      savedWisdomIds,
      addWisdom,
      updateWisdom,
      deleteWisdom,
      setDailyWisdom,
      toggleBookmarkWisdom,
      reflectionPrompts,
      savePrompt,
      deletePrompt,
      announcements,
      publishAnnouncement,
      deleteAnnouncement,
      notifications,
      unreadNotificationCount,
      notificationPrefs,
      updateNotificationPrefs,
      sendNotification,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      adminUsers,
      addAdminUser,
      updateAdminUser,
      auditLogs,
      appendAuditLog,
      hasSampleData,
      loadSampleJourney,
      clearSampleJourney,
      clearAllData,
      toasts,
      showToast,
      dismissToast,
    ]
  );

  return <LunaraContext.Provider value={value}>{children}</LunaraContext.Provider>;
};

export function useLunara() {
  const ctx = useContext(LunaraContext);
  if (!ctx) throw new Error('useLunara must be used within LunaraProvider');
  return ctx;
}
