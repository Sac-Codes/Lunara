export type ThemeMode = 'light' | 'dark' | 'system';

export type UserRole = 'user' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  authMode: 'simulated-credentials' | 'simulated-preview';
}

export type MoodId = 'great' | 'good' | 'okay' | 'low' | 'difficult' | 'unsure';

export interface CheckInEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mood: MoodId | null;
  happiness: number | null; // 1-5
  energy: number | null; // 1-5
  stress: number | null; // 1-5
  likes: string[];
  dislikes: string[];
  notes: string;
  customValues?: Record<string, string | number>;
  // Phase 1 additions
  activities?: string[];         // Selected activity tags ("What shaped your day?")
  customActivities?: string[];   // User-added custom activities
  proudOf?: string;              // Something I'm proud of today
  needs?: string[];              // What I needed today
  tomorrowIntention?: string;    // Tomorrow's intention
  updatedAt: string; // ISO
  isSample?: boolean;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isSample?: boolean;
}

export interface UserProfile {
  displayName: string;
  preferredCheckInTime: 'morning' | 'evening' | 'anytime';
  dailyReminderEnabled: boolean;
  reminderTime: string;
  showGreetingPrompts: boolean;
}

export type ParameterType = 'scale' | 'text' | 'tags';

export interface CheckInParameterConfig {
  id: string;
  name: string;
  description: string;
  type: ParameterType;
  enabled: boolean;
  required: boolean;
  order: number;
  scaleLabels?: [string, string];
  isCore?: boolean;
}

export interface AdminUserPrototype {
  id: string;
  name: string;
  email: string;
  role: 'Member' | 'Facilitator' | 'Admin';
  status: 'active' | 'inactive';
  joinedDate: string;
  lastActive: string;
  preferredWindow?: 'morning' | 'evening' | 'anytime';
  checkIns?: CheckInEntry[];
  journals?: JournalEntry[];
}

export interface AdminSystemConfig {
  workspaceName: string;
  allowCustomTags: boolean;
  defaultTheme: ThemeMode;
  maintenanceNotice: string;
}

export type AffirmationCategory =
  | 'Calm'
  | 'Encouragement'
  | 'Self-acceptance'
  | 'Patience'
  | 'Courage'
  | 'Reflection'
  | 'Gratitude'
  | 'Hope'
  | 'Rest'
  | 'Beginning again';

export interface AffirmationItem {
  id: string;
  text: string;
  category: AffirmationCategory;
  status: 'published' | 'draft' | 'inactive';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  scheduledDate?: string;
  priority?: number;
}

export type WisdomTopic =
  | 'Duty & Action'
  | 'Inner Balance'
  | 'Patience'
  | 'Self-Understanding'
  | 'Courage'
  | 'Detachment'
  | 'Compassion'
  | 'Knowledge'
  | 'Gratitude'
  | 'Inner Peace'
  | 'Focus'
  | 'Equanimity'
  | 'Purpose';

export interface WisdomEntry {
  id: string;
  title: string;
  scripture: 'Bhagavad Gita';
  chapter: number;
  verse: string;
  sanskrit: string;
  transliteration: string;
  meaning: string;
  learning: string;
  reflectionPrompt: string;
  takeaway: string;
  topic: WisdomTopic;
  sourceNote: string;
  status: 'published' | 'draft';
  isFeatured: boolean;
  isDaily: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReflectionPromptItem {
  id: string;
  text: string;
  placement: 'check-in' | 'journal' | 'both';
  topic?: string;
  active: boolean;
  updatedAt: string;
}

export type NotificationCategory =
  | 'general'
  | 'announcement'
  | 'reminder'
  | 'update'
  | 'affirmation'
  | 'encouragement';

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  createdAt: string;
  read: boolean;
  sender: string;
  targetUserLabel?: string;
  isPrototype?: boolean;
}

export interface NotificationPreferences {
  affirmations: boolean;
  dailyWisdom: boolean;
  gentleReminders: boolean;
  adminMessages: boolean;
  announcements: boolean;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  status: 'published' | 'draft';
  createdAt: string;
  createdBy: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorEmail: string;
  action: string;
  targetUserName?: string;
  details: string;
}
