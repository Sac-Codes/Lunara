import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Download,
  Info,
  KeyRound,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Shield,
  Sliders,
  Sparkles,
  Sun,
  Trash2,
  User,
} from 'lucide-react';
import { PWAInstallButton } from '../components/pwa/PWAInstallButton';
import { PageHeader } from '../components/shared/PageHeader';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { LunaraMark } from '../components/ui/LunaraMark';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { LUNARA_ARTWORK } from '../lib/atmosphere';
import { lunaraStorage } from '../lib/storage';
import { useAuth } from '../providers/AuthProvider';
import { useLunara } from '../providers/LunaraProvider';
import type { ThemeMode } from '../types/lunara';

type SettingsSection = 'account' | 'appearance' | 'preferences' | 'privacy' | 'about';

const SECTIONS: Array<{ id: SettingsSection; label: string; icon: typeof User }> = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'preferences', label: 'Preferences', icon: Sliders },
  { id: 'privacy', label: 'Data & Privacy', icon: Shield },
  { id: 'about', label: 'About Lunara', icon: Info },
];

export const SettingsPage: React.FC = () => {
  const {
    dataMode,
    themeMode,
    setThemeMode,
    profile,
    updateProfile,
    checkIns,
    journals,
    hasSampleData,
    loadSampleJourney,
    clearSampleJourney,
    clearAllData,
    notificationPrefs,
    updateNotificationPrefs,
    showToast,
  } = useLunara();
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const { isInstalled } = usePWAInstall();
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const handleExport = () => {
    if (dataMode !== 'demo') {
      showToast('Export is disabled until cloud reflection sync is enabled.', 'amber');
      return;
    }
    const json = lunaraStorage.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lunara-reflections-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Reflections exported as JSON.', 'blue');
  };

  const handleLogout = () => {
    logout();
    showToast('Signed out of Lunara.', 'lavender');
    navigate('/login', { replace: true });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Settings"
        title="Your Lunara space"
        description="Manage your account session, lighting theme, check-in preferences, and local data."
        artwork={LUNARA_ARTWORK.afternoon}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Grouped Section Navigation */}
        <nav
          aria-label="Settings sections"
          className="md:col-span-4 lg:col-span-3 flex md:flex-col gap-1.5 overflow-x-auto pb-1 md:pb-0"
        >
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const active = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-3 min-h-[44px] px-4 py-2.5 rounded-[14px] text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${active
                    ? 'bg-[var(--surface-lavender)] text-[var(--lavender-strong)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-main)]/70'
                  }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active Settings Group */}
        <div className="md:col-span-8 lg:col-span-9 space-y-6">
          {activeSection === 'account' && (
            <section className="rounded-[24px] bg-[var(--surface-main)] p-6 sm:p-7 shadow-[var(--shadow-card)] space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-[15px] bg-[var(--surface-lavender)] text-[var(--lavender-strong)] flex items-center justify-center font-display text-xl font-medium">
                    {(profile.displayName || user?.name || 'L').slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
                      {profile.displayName || user?.name || 'Personal Space'}
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                      {user?.email} · {isAdmin ? 'Admin role' : 'Member account'}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  leftIcon={<LogOut className="w-4 h-4" />}
                >
                  Sign out
                </Button>
              </div>

              <div>
                <label
                  htmlFor="settings-display-name"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Preferred greeting name
                </label>
                <input
                  id="settings-display-name"
                  type="text"
                  value={profile.displayName}
                  onChange={(e) => updateProfile({ displayName: e.target.value })}
                  placeholder="How Lunara greets you on Home"
                  className="w-full max-w-md min-h-[44px] rounded-[12px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-3.5 text-sm text-[var(--text-primary)] focus:outline-2 focus:outline-[#B18ACD]"
                />
              </div>

              <div className="rounded-[18px] bg-[var(--surface-blue)]/70 p-4 sm:p-5 flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-[var(--blue-strong)] shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    Password &amp; account security
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    You are currently using Lunara&apos;s frontend preview session. Password updates and account recovery will be enabled when Supabase Auth is connected.
                  </p>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'appearance' && (
            <section className="rounded-[24px] bg-[var(--surface-main)] p-6 sm:p-7 shadow-[var(--shadow-card)] space-y-5">
              <div>
                <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
                  Theme &amp; lighting
                </h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Applies across all pages including Login and Calendar.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    {
                      id: 'light',
                      label: 'Light',
                      desc: 'Warm paper & soft lavender',
                      icon: Sun,
                    },
                    {
                      id: 'dark',
                      label: 'Dark',
                      desc: 'Deep plum & twilight blue',
                      icon: Moon,
                    },
                    {
                      id: 'system',
                      label: 'System',
                      desc: 'Match your device setting',
                      icon: Monitor,
                    },
                  ] as Array<{ id: ThemeMode; label: string; desc: string; icon: typeof Sun }>
                ).map((opt) => {
                  const Icon = opt.icon;
                  const active = themeMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setThemeMode(opt.id)}
                      aria-pressed={active}
                      className={`text-left rounded-[18px] p-4 transition-all cursor-pointer ${active
                          ? 'bg-[var(--surface-lavender)] text-[var(--lavender-strong)] ring-1 ring-[#B18ACD]/50'
                          : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <div className="mt-3 text-sm font-medium text-[var(--text-primary)]">
                        {opt.label}
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--text-muted)]">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {activeSection === 'preferences' && (
            <section className="rounded-[24px] bg-[var(--surface-main)] p-6 sm:p-7 shadow-[var(--shadow-card)] space-y-6">
              <div>
                <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
                  Reflection preferences
                </h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Adjust gentle prompts and check-in rhythm without pressure.
                </p>
              </div>

              <div>
                <div className="text-xs font-medium text-[var(--text-secondary)] mb-2">
                  Preferred reflection window
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['morning', 'evening', 'anytime'] as const).map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => updateProfile({ preferredCheckInTime: slot })}
                      className={`min-h-[40px] px-4 rounded-[12px] text-xs sm:text-sm font-medium capitalize transition-colors cursor-pointer ${profile.preferredCheckInTime === slot
                          ? 'bg-[#304A70] text-white dark:bg-[#78A6E7] dark:text-[#152031]'
                          : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                      {slot === 'anytime' ? 'Any time' : `${slot} reflection`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-3 border-t border-[var(--border-subtle)]">
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    Thoughtful daily line on Home
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Display a gentle non-judgmental note beneath your greeting
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={profile.showGreetingPrompts}
                  onClick={() =>
                    updateProfile({ showGreetingPrompts: !profile.showGreetingPrompts })
                  }
                  className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer shrink-0 ${profile.showGreetingPrompts
                      ? 'bg-[#795D96] dark:bg-[#B18ACD]'
                      : 'bg-[var(--surface-secondary)] border border-[var(--border-medium)]'
                    }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${profile.showGreetingPrompts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              <div className="rounded-[18px] bg-[var(--surface-secondary)] p-4 sm:p-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Bell className="w-4 h-4 text-[var(--blue-strong)] shrink-0 mt-1" />
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                      Reminder preference
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      Save your ideal check-in time locally (push reminders require future backend scheduling).
                    </p>
                  </div>
                </div>
                <input
                  type="time"
                  aria-label="Preferred reminder time"
                  value={profile.reminderTime}
                  onChange={(e) => updateProfile({ reminderTime: e.target.value })}
                  className="min-h-[38px] rounded-[10px] bg-[var(--surface-main)] border border-[var(--border-subtle)] px-2.5 text-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] space-y-3">
                <div className="text-xs font-medium text-[var(--text-secondary)]">
                  Affirmations, Wisdom &amp; Notification visibility
                </div>
                {(
                  [
                    { key: 'affirmations', label: 'Daily gentle affirmations on Home & Check-in' },
                    { key: 'dailyWisdom', label: 'Daily Bhagavad Gita wisdom snippet on Home' },
                    { key: 'adminMessages', label: 'Workspace facilitator notes in Inbox' },
                    { key: 'announcements', label: 'Workspace updates & announcements' },
                  ] as const
                ).map((item) => {
                  const enabled = notificationPrefs[item.key];
                  return (
                    <div key={item.key} className="flex items-center justify-between gap-4">
                      <span className="text-sm text-[var(--text-primary)]">{item.label}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        onClick={() => updateNotificationPrefs({ [item.key]: !enabled })}
                        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${enabled
                            ? 'bg-[#795D96] dark:bg-[#B18ACD]'
                            : 'bg-[var(--surface-secondary)] border border-[var(--border-medium)]'
                          }`}
                      >
                        <span
                          className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {activeSection === 'privacy' && (
            <section className="rounded-[24px] bg-[var(--surface-main)] p-6 sm:p-7 shadow-[var(--shadow-card)] space-y-6">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-[12px] bg-[var(--surface-teal)] text-[var(--teal-strong)] flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
                    Data &amp; privacy
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)] leading-relaxed">
                    Your {checkIns.length} check-ins and {journals.length} journal entries live exclusively in browser local storage on this device. Nothing is sent to external servers.
                  </p>
                  <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">
                    Workspace privacy note: In this frontend preview, Admin Console tools inspect only simulated prototype directory entries—never your private local reflections. When backend storage is connected later, admin support access will be strictly role-gated and audited.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExport}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Export JSON backup
                </Button>

                {dataMode === 'demo' &&
                  (hasSampleData ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSampleJourney}
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                      Remove sample week
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadSampleJourney}
                      leftIcon={<Sparkles className="w-4 h-4" />}
                    >
                      Load sample week
                    </Button>
                  ))}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmClearOpen(true)}
                  leftIcon={<Trash2 className="w-4 h-4 text-[var(--coral-strong)]" />}
                >
                  Clear all local data
                </Button>
              </div>
            </section>
          )}

          {activeSection === 'about' && (
            <section className="space-y-5">
              <div className="rounded-[24px] bg-[var(--surface-rose)] p-6 sm:p-7 flex items-center gap-4">
                <LunaraMark className="w-12 h-12 shrink-0" />
                <div>
                  <h2 className="font-display text-2xl font-medium text-[var(--text-primary)]">
                    Lunara
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)]">
                    A little more thoughtful, every day.
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] bg-[var(--surface-blue)] p-6 space-y-3">
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  Installable Progressive Web App
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  {isInstalled
                    ? 'Lunara is currently running as an installed standalone application.'
                    : 'Install Lunara on your phone or desktop for a calm standalone window and offline access.'}
                </p>
                {!isInstalled && (
                  <div className="max-w-xs pt-1">
                    <PWAInstallButton />
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmClearOpen}
        title="Clear all local reflections?"
        description="This removes all check-ins, journal entries, and preferences saved in this browser. Export a JSON backup first if you want to keep a copy."
        confirmLabel="Clear everything"
        destructive
        onConfirm={() => {
          clearAllData();
          setConfirmClearOpen(false);
        }}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </div>
  );
};
