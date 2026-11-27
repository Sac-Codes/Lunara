import { DEFAULT_ADMIN_CONFIG, DEFAULT_CHECKIN_PARAMETERS } from '../data/sampleJourney';
import {
  buildPrototypeUserDirectory,
  DEFAULT_AFFIRMATIONS,
  DEFAULT_ANNOUNCEMENTS,
  DEFAULT_AUDIT_LOGS,
  DEFAULT_NOTIFICATION_PREFS,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_REFLECTION_PROMPTS,
  DEFAULT_WISDOM_ENTRIES,
} from '../data/wisdomAndAffirmations';
import type {
  AdminSystemConfig,
  AdminUserPrototype,
  AffirmationItem,
  AnnouncementItem,
  AuditLogEntry,
  CheckInEntry,
  CheckInParameterConfig,
  JournalEntry,
  NotificationPreferences,
  ReflectionPromptItem,
  ThemeMode,
  UserNotification,
  UserProfile,
  WisdomEntry,
} from '../types/lunara';

const KEYS = {
  THEME: 'lunara_theme_mode',
  CHECKINS: 'lunara_checkins_v1',
  JOURNALS: 'lunara_journals_v1',
  PROFILE: 'lunara_profile_v1',
  PARAMETERS: 'lunara_parameters_v1',
  ADMIN_CONFIG: 'lunara_admin_config_v1',
  AFFIRMATIONS: 'lunara_affirmations_v1',
  WISDOM: 'lunara_wisdom_v1',
  SAVED_WISDOM: 'lunara_saved_wisdom_v1',
  PROMPTS: 'lunara_prompts_v1',
  ANNOUNCEMENTS: 'lunara_announcements_v1',
  NOTIFICATIONS: 'lunara_notifications_v1',
  NOTIFICATION_PREFS: 'lunara_notification_prefs_v1',
  ADMIN_USERS: 'lunara_admin_users_v1',
  AUDIT_LOGS: 'lunara_audit_logs_v1',
  FAVORITE_AFFIRMATIONS: 'lunara_favorite_affirmations_v1',
} as const;

const DEFAULT_PROFILE: UserProfile = {
  displayName: '',
  preferredCheckInTime: 'evening',
  dailyReminderEnabled: false,
  reminderTime: '20:30',
  showGreetingPrompts: true,
};

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota or private-mode errors gracefully
  }
}

export const lunaraStorage = {
  getTheme(): ThemeMode {
    const saved = safeRead<ThemeMode | null>(KEYS.THEME, null);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'dark';
  },
  setTheme(mode: ThemeMode): void {
    safeWrite(KEYS.THEME, mode);
  },

  getCheckIns(): CheckInEntry[] {
    return safeRead<CheckInEntry[]>(KEYS.CHECKINS, []);
  },
  setCheckIns(entries: CheckInEntry[]): void {
    safeWrite(KEYS.CHECKINS, entries);
  },

  getJournals(): JournalEntry[] {
    return safeRead<JournalEntry[]>(KEYS.JOURNALS, []);
  },
  setJournals(entries: JournalEntry[]): void {
    safeWrite(KEYS.JOURNALS, entries);
  },

  getProfile(): UserProfile {
    return { ...DEFAULT_PROFILE, ...safeRead<Partial<UserProfile>>(KEYS.PROFILE, {}) };
  },
  setProfile(profile: UserProfile): void {
    safeWrite(KEYS.PROFILE, profile);
  },

  getParameters(): CheckInParameterConfig[] {
    const saved = safeRead<CheckInParameterConfig[] | null>(KEYS.PARAMETERS, null);
    if (saved && Array.isArray(saved) && saved.length > 0) return saved;
    return DEFAULT_CHECKIN_PARAMETERS;
  },
  setParameters(params: CheckInParameterConfig[]): void {
    safeWrite(KEYS.PARAMETERS, params);
  },

  getAdminConfig(): AdminSystemConfig {
    return { ...DEFAULT_ADMIN_CONFIG, ...safeRead<Partial<AdminSystemConfig>>(KEYS.ADMIN_CONFIG, {}) };
  },
  setAdminConfig(config: AdminSystemConfig): void {
    safeWrite(KEYS.ADMIN_CONFIG, config);
  },

  getAffirmations(): AffirmationItem[] {
    const saved = safeRead<AffirmationItem[] | null>(KEYS.AFFIRMATIONS, null);
    if (saved && Array.isArray(saved) && saved.length > 0) return saved;
    return DEFAULT_AFFIRMATIONS;
  },
  setAffirmations(items: AffirmationItem[]): void {
    safeWrite(KEYS.AFFIRMATIONS, items);
  },

  getFavoriteAffirmationIds(): string[] {
    return safeRead<string[]>(KEYS.FAVORITE_AFFIRMATIONS, []);
  },
  setFavoriteAffirmationIds(ids: string[]): void {
    safeWrite(KEYS.FAVORITE_AFFIRMATIONS, ids);
  },

  getWisdomEntries(): WisdomEntry[] {
    const saved = safeRead<WisdomEntry[] | null>(KEYS.WISDOM, null);
    if (saved && Array.isArray(saved) && saved.length > 0) return saved;
    return DEFAULT_WISDOM_ENTRIES;
  },
  setWisdomEntries(items: WisdomEntry[]): void {
    safeWrite(KEYS.WISDOM, items);
  },

  getSavedWisdomIds(): string[] {
    return safeRead<string[]>(KEYS.SAVED_WISDOM, ['gita-2-47']);
  },
  setSavedWisdomIds(ids: string[]): void {
    safeWrite(KEYS.SAVED_WISDOM, ids);
  },

  getReflectionPrompts(): ReflectionPromptItem[] {
    const saved = safeRead<ReflectionPromptItem[] | null>(KEYS.PROMPTS, null);
    if (saved && Array.isArray(saved) && saved.length > 0) return saved;
    return DEFAULT_REFLECTION_PROMPTS;
  },
  setReflectionPrompts(items: ReflectionPromptItem[]): void {
    safeWrite(KEYS.PROMPTS, items);
  },

  getAnnouncements(): AnnouncementItem[] {
    const saved = safeRead<AnnouncementItem[] | null>(KEYS.ANNOUNCEMENTS, null);
    if (saved && Array.isArray(saved)) return saved;
    return DEFAULT_ANNOUNCEMENTS;
  },
  setAnnouncements(items: AnnouncementItem[]): void {
    safeWrite(KEYS.ANNOUNCEMENTS, items);
  },

  getNotifications(): UserNotification[] {
    const saved = safeRead<UserNotification[] | null>(KEYS.NOTIFICATIONS, null);
    if (saved && Array.isArray(saved)) return saved;
    return DEFAULT_NOTIFICATIONS;
  },
  setNotifications(items: UserNotification[]): void {
    safeWrite(KEYS.NOTIFICATIONS, items);
  },

  getNotificationPrefs(): NotificationPreferences {
    return {
      ...DEFAULT_NOTIFICATION_PREFS,
      ...safeRead<Partial<NotificationPreferences>>(KEYS.NOTIFICATION_PREFS, {}),
    };
  },
  setNotificationPrefs(prefs: NotificationPreferences): void {
    safeWrite(KEYS.NOTIFICATION_PREFS, prefs);
  },

  getAdminUsers(): AdminUserPrototype[] {
    const saved = safeRead<AdminUserPrototype[] | null>(KEYS.ADMIN_USERS, null);
    if (saved && Array.isArray(saved) && saved.length > 0) return saved;
    return buildPrototypeUserDirectory();
  },
  setAdminUsers(users: AdminUserPrototype[]): void {
    safeWrite(KEYS.ADMIN_USERS, users);
  },

  getAuditLogs(): AuditLogEntry[] {
    const saved = safeRead<AuditLogEntry[] | null>(KEYS.AUDIT_LOGS, null);
    if (saved && Array.isArray(saved)) return saved;
    return DEFAULT_AUDIT_LOGS;
  },
  setAuditLogs(logs: AuditLogEntry[]): void {
    safeWrite(KEYS.AUDIT_LOGS, logs);
  },

  clearAll(): void {
    try {
      window.localStorage.removeItem(KEYS.CHECKINS);
      window.localStorage.removeItem(KEYS.JOURNALS);
      window.localStorage.removeItem(KEYS.PROFILE);
      window.localStorage.removeItem(KEYS.PARAMETERS);
      window.localStorage.removeItem(KEYS.ADMIN_CONFIG);
      window.localStorage.removeItem(KEYS.SAVED_WISDOM);
      window.localStorage.removeItem(KEYS.NOTIFICATIONS);
      window.localStorage.removeItem(KEYS.NOTIFICATION_PREFS);
      window.localStorage.removeItem(KEYS.FAVORITE_AFFIRMATIONS);
    } catch {
      // Ignore
    }
  },

  exportJSON(): string {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'Lunara',
      profile: this.getProfile(),
      checkIns: this.getCheckIns(),
      journals: this.getJournals(),
      savedWisdomIds: this.getSavedWisdomIds(),
    };
    return JSON.stringify(payload, null, 2);
  },
};
