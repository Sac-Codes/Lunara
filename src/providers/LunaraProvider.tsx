import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  buildSampleJourney,
  DEFAULT_ADMIN_CONFIG,
  DEFAULT_CHECKIN_PARAMETERS,
} from '../data/sampleJourney';
import { DEFAULT_NOTIFICATION_PREFS } from '../data/wisdomAndAffirmations';
import { lunaraStorage } from '../lib/storage';
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

interface LunaraContextValue {
  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;

  checkIns: CheckInEntry[];
  saveCheckIn: (entry: Omit<CheckInEntry, 'id' | 'updatedAt'> & { id?: string }) => CheckInEntry;
  deleteCheckIn: (dateKey: string) => void;
  getCheckInByDate: (dateKey: string) => CheckInEntry | undefined;

  journals: JournalEntry[];
  saveJournal: (
    entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => JournalEntry;
  deleteJournal: (id: string) => void;

  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;

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
  savedWisdomIds: string[];
  addWisdom: (item: Omit<WisdomEntry, 'id' | 'createdAt' | 'updatedAt'>) => WisdomEntry;
  updateWisdom: (id: string, patch: Partial<WisdomEntry>) => void;
  deleteWisdom: (id: string) => void;
  setDailyWisdom: (id: string) => void;
  toggleBookmarkWisdom: (id: string) => void;

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
  updateNotificationPrefs: (patch: Partial<NotificationPreferences>) => void;
  sendNotification: (payload: {
    title: string;
    message: string;
    category: NotificationCategory;
    targetUserLabel?: string;
    targetUserName?: string;
  }) => void;
  markNotificationRead: (id: string, read?: boolean) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;

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
  const { user } = useAuth();

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => lunaraStorage.getTheme());
  const [systemDark, setSystemDark] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : true
  );

  const [checkIns, setCheckIns] = useState<CheckInEntry[]>(() => lunaraStorage.getCheckIns());
  const [journals, setJournals] = useState<JournalEntry[]>(() => lunaraStorage.getJournals());
  const [profile, setProfile] = useState<UserProfile>(() => lunaraStorage.getProfile());
  const [parameters, setParameters] = useState<CheckInParameterConfig[]>(() =>
    lunaraStorage.getParameters()
  );
  const [adminConfig, setAdminConfig] = useState<AdminSystemConfig>(() =>
    lunaraStorage.getAdminConfig()
  );

  const [affirmations, setAffirmations] = useState<AffirmationItem[]>(() =>
    lunaraStorage.getAffirmations()
  );
  const [favoriteAffirmationIds, setFavoriteAffirmationIds] = useState<string[]>(() =>
    lunaraStorage.getFavoriteAffirmationIds()
  );
  const [wisdomEntries, setWisdomEntries] = useState<WisdomEntry[]>(() =>
    lunaraStorage.getWisdomEntries()
  );
  const [savedWisdomIds, setSavedWisdomIds] = useState<string[]>(() =>
    lunaraStorage.getSavedWisdomIds()
  );
  const [reflectionPrompts, setReflectionPrompts] = useState<ReflectionPromptItem[]>(() =>
    lunaraStorage.getReflectionPrompts()
  );
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() =>
    lunaraStorage.getAnnouncements()
  );
  const [notifications, setNotifications] = useState<UserNotification[]>(() =>
    lunaraStorage.getNotifications()
  );
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(() =>
    lunaraStorage.getNotificationPrefs()
  );
  const [adminUsers, setAdminUsers] = useState<AdminUserPrototype[]>(() =>
    lunaraStorage.getAdminUsers()
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() =>
    lunaraStorage.getAuditLogs()
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

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
    lunaraStorage.setTheme(mode);
  }, []);

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

  const appendAuditLog = useCallback(
    (action: string, details: string, targetUserName?: string) => {
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
    [user]
  );

  const saveCheckIn = useCallback(
    (entry: Omit<CheckInEntry, 'id' | 'updatedAt'> & { id?: string }) => {
      const now = new Date().toISOString();
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
    []
  );

  const deleteCheckIn = useCallback((dateKey: string) => {
    setCheckIns((prev) => {
      const next = prev.filter((c) => c.date !== dateKey);
      lunaraStorage.setCheckIns(next);
      return next;
    });
  }, []);

  const getCheckInByDate = useCallback(
    (dateKey: string) => checkIns.find((c) => c.date === dateKey),
    [checkIns]
  );

  const saveJournal = useCallback(
    (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const now = new Date().toISOString();
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
    []
  );

  const deleteJournal = useCallback((id: string) => {
    setJournals((prev) => {
      const next = prev.filter((j) => j.id !== id);
      lunaraStorage.setJournals(next);
      return next;
    });
  }, []);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      lunaraStorage.setProfile(next);
      return next;
    });
  }, []);

  const updateParameters = useCallback(
    (next: CheckInParameterConfig[]) => {
      setParameters(next);
      lunaraStorage.setParameters(next);
      appendAuditLog('Updated Parameters', `Updated check-in parameter configuration (${next.filter((p) => p.enabled).length} active).`);
    },
    [appendAuditLog]
  );

  const updateAdminConfig = useCallback(
    (patch: Partial<AdminSystemConfig>) => {
      setAdminConfig((prev) => {
        const next = { ...prev, ...patch };
        lunaraStorage.setAdminConfig(next);
        return next;
      });
      appendAuditLog('Updated Workspace Config', 'Modified workspace configuration settings.');
    },
    [appendAuditLog]
  );

  // Affirmations
  const publishedAffirmations = useMemo(
    () =>
      affirmations
        .filter((a) => a.status === 'published')
        .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999)),
    [affirmations]
  );

  const toggleFavoriteAffirmation = useCallback((id: string) => {
    setFavoriteAffirmationIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      lunaraStorage.setFavoriteAffirmationIds(next);
      return next;
    });
  }, []);

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
    [user, appendAuditLog]
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
    [appendAuditLog]
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
    (item: Omit<WisdomEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
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
    [appendAuditLog]
  );

  const updateWisdom = useCallback(
    (id: string, patch: Partial<WisdomEntry>) => {
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
    [appendAuditLog]
  );

  const deleteWisdom = useCallback(
    (id: string) => {
      setWisdomEntries((prev) => {
        const next = prev.filter((w) => w.id !== id);
        lunaraStorage.setWisdomEntries(next);
        return next;
      });
      appendAuditLog('Deleted Wisdom Passage', `Removed wisdom entry ${id}.`);
    },
    [appendAuditLog]
  );

  const setDailyWisdom = useCallback(
    (id: string) => {
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
    [appendAuditLog]
  );

  const toggleBookmarkWisdom = useCallback((id: string) => {
    setSavedWisdomIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      lunaraStorage.setSavedWisdomIds(next);
      return next;
    });
  }, []);

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
    (payload: {
      title: string;
      message: string;
      category: NotificationCategory;
      targetUserLabel?: string;
      targetUserName?: string;
    }) => {
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

  const markNotificationRead = useCallback((id: string, read = true) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read } : n));
      lunaraStorage.setNotifications(next);
      return next;
    });
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      lunaraStorage.setNotifications(next);
      return next;
    });
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id);
      lunaraStorage.setNotifications(next);
      return next;
    });
  }, []);

  const updateNotificationPrefs = useCallback((patch: Partial<NotificationPreferences>) => {
    setNotificationPrefs((prev) => {
      const next = { ...prev, ...patch };
      lunaraStorage.setNotificationPrefs(next);
      return next;
    });
  }, []);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Prototype User Directory
  const addAdminUser = useCallback(
    (newUser: Omit<AdminUserPrototype, 'id' | 'joinedDate' | 'lastActive'>) => {
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
    [appendAuditLog]
  );

  const updateAdminUser = useCallback(
    (id: string, patch: Partial<AdminUserPrototype>) => {
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
    [appendAuditLog]
  );

  const hasSampleData = useMemo(
    () => checkIns.some((c) => c.isSample) || journals.some((j) => j.isSample),
    [checkIns, journals]
  );

  const loadSampleJourney = useCallback(() => {
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
  }, [showToast]);

  const clearSampleJourney = useCallback(() => {
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
  }, [showToast]);

  const clearAllData = useCallback(() => {
    lunaraStorage.clearAll();
    setCheckIns([]);
    setJournals([]);
    setProfile({
      displayName: '',
      preferredCheckInTime: 'evening',
      dailyReminderEnabled: false,
      reminderTime: '20:30',
      showGreetingPrompts: true,
    });
    setParameters(DEFAULT_CHECKIN_PARAMETERS);
    setAdminConfig(DEFAULT_ADMIN_CONFIG);
    setSavedWisdomIds([]);
    setFavoriteAffirmationIds([]);
    setNotificationPrefs(DEFAULT_NOTIFICATION_PREFS);
    showToast('Local reflections cleared.', 'lavender');
  }, [showToast]);

  const value = useMemo<LunaraContextValue>(
    () => ({
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
