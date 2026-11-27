import React, { useMemo, useState } from 'react';
import { Check, CheckCheck, Info, MailOpen, Sparkles, Trash2 } from 'lucide-react';
import { CalmHorizonOrb } from '../components/graphics/LunarArtwork';
import { AffirmationCard } from '../components/shared/AffirmationCard';
import { PageHeader } from '../components/shared/PageHeader';
import { Button, IconButton } from '../components/ui/Button';
import { LUNARA_ARTWORK } from '../lib/atmosphere';
import { useLunara } from '../providers/LunaraProvider';
import type { NotificationCategory, NotificationPreferences } from '../types/lunara';

const CATEGORY_META: Record<
  NotificationCategory,
  { label: string; surface: string; accent: string }
> = {
  general: {
    label: 'Workspace note',
    surface: 'bg-[var(--surface-main)]',
    accent: 'text-[var(--text-secondary)]',
  },
  announcement: {
    label: 'Announcement',
    surface: 'bg-[var(--surface-blue)]/70',
    accent: 'text-[var(--blue-strong)]',
  },
  reminder: {
    label: 'Gentle reminder',
    surface: 'bg-[var(--surface-teal)]/70',
    accent: 'text-[var(--teal-strong)]',
  },
  update: {
    label: 'Product update',
    surface: 'bg-[var(--surface-lavender)]/70',
    accent: 'text-[var(--lavender-strong)]',
  },
  affirmation: {
    label: 'Affirmation',
    surface: 'bg-[var(--surface-rose)]/70',
    accent: 'text-[var(--rose-strong)]',
  },
  encouragement: {
    label: 'Encouragement',
    surface: 'bg-[var(--surface-amber)]/70',
    accent: 'text-[var(--amber-strong)]',
  },
};

function formatTimeAgo(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    notificationPrefs,
    updateNotificationPrefs,
    showToast,
  } = useLunara();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const visibleList = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    return notifications;
  }, [notifications, filter]);

  const prefItems: Array<{
    key: keyof NotificationPreferences;
    label: string;
    desc: string;
  }> = [
    {
      key: 'affirmations',
      label: 'Daily affirmations',
      desc: 'Show gentle, non-judgmental grounding thoughts.',
    },
    {
      key: 'dailyWisdom',
      label: 'Daily Gita wisdom',
      desc: 'Surface a quiet passage and modern takeaway on Home.',
    },
    {
      key: 'gentleReminders',
      label: 'Gentle reflection nudges',
      desc: 'Quiet, zero-pressure invitation to check in when open.',
    },
    {
      key: 'adminMessages',
      label: 'Workspace facilitator notes',
      desc: 'Receive direct messages sent from your workspace console.',
    },
    {
      key: 'announcements',
      label: 'Workspace announcements',
      desc: 'Updates about new Lunara features and spaces.',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inbox"
        title="Notifications & gentle notes"
        description="Quiet updates, workspace notes, and thoughtful reminders—never urgent, never noisy."
        artwork={LUNARA_ARTWORK.lotusAffirmation}
        action={
          unreadNotificationCount > 0 ? (
            <button
              type="button"
              onClick={() => {
                markAllNotificationsRead();
                showToast('All notifications marked as read.', 'blue');
              }}
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-[12px] bg-white/16 hover:bg-white/25 border border-white/20 text-xs font-medium text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all read ({unreadNotificationCount})</span>
            </button>
          ) : undefined
        }
      />

      <div className="rounded-[18px] bg-[var(--surface-blue)]/70 border border-[var(--border-subtle)] px-4 py-3 flex items-start gap-2.5 text-xs text-[var(--blue-strong)]">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Prototype inbox: messages sent from the Admin Console appear here on this browser. Cross-device push delivery will be added with backend integration.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Notifications Stream */}
        <section className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1 p-1 rounded-[12px] bg-[var(--surface-main)] border border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`min-h-[34px] px-3 rounded-[9px] text-xs font-medium cursor-pointer transition-colors ${
                  filter === 'all'
                    ? 'bg-[var(--surface-lavender)] text-[var(--lavender-strong)]'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`min-h-[34px] px-3 rounded-[9px] text-xs font-medium cursor-pointer transition-colors ${
                  filter === 'unread'
                    ? 'bg-[var(--surface-lavender)] text-[var(--lavender-strong)]'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                Unread ({unreadNotificationCount})
              </button>
            </div>
          </div>

          {visibleList.length === 0 ? (
            <div className="space-y-4">
              <div className="rounded-[26px] bg-[var(--surface-lavender)]/55 border border-[var(--border-subtle)] p-8 sm:p-10 text-center shadow-[var(--shadow-card)]">
                <div className="w-32 mx-auto">
                  <CalmHorizonOrb className="w-full h-auto" />
                </div>
                <h2 className="mt-3 font-display text-2xl font-medium text-[var(--text-primary)]">
                  All caught up!
                </h2>
                <p className="mt-1.5 text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
                  {filter === 'unread'
                    ? "You've read your notifications."
                    : 'Your quiet inbox has no notes right now. Gentle updates will appear here when shared.'}
                </p>
              </div>
              <AffirmationCard compact label="While things are quiet" />
            </div>
          ) : (
            <div className="space-y-3">
              {visibleList.map((notif) => {
                const meta = CATEGORY_META[notif.category] || CATEGORY_META.general;
                return (
                  <article
                    key={notif.id}
                    className={`rounded-[20px] ${meta.surface} border ${
                      notif.read
                        ? 'border-[var(--border-subtle)] opacity-85'
                        : 'border-[#B18ACD]/45 shadow-[var(--shadow-card)]'
                    } p-5 transition-all`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {!notif.read && (
                            <span
                              className="w-2 h-2 rounded-full bg-[#B18ACD] shrink-0"
                              aria-label="Unread"
                            />
                          )}
                          <span className={`font-medium ${meta.accent}`}>{meta.label}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-[var(--text-muted)]">From {notif.sender}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-[var(--text-muted)]">
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>

                        <h3 className="mt-1.5 font-display text-lg font-medium text-[var(--text-primary)]">
                          {notif.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-line">
                          {notif.message}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <IconButton
                          label={notif.read ? 'Mark as unread' : 'Mark as read'}
                          size="sm"
                          onClick={() => markNotificationRead(notif.id, !notif.read)}
                        >
                          {notif.read ? (
                            <MailOpen className="w-4 h-4 text-[var(--text-muted)]" />
                          ) : (
                            <Check className="w-4 h-4 text-[var(--teal-strong)]" />
                          )}
                        </IconButton>
                        <IconButton
                          label="Dismiss notification"
                          size="sm"
                          onClick={() => deleteNotification(notif.id)}
                        >
                          <Trash2 className="w-4 h-4 text-[var(--coral-strong)]" />
                        </IconButton>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: Notification Preferences + Soft Affirmation */}
        <aside className="lg:col-span-4 space-y-5">
          <div className="rounded-[24px] bg-[var(--surface-main)] p-5 sm:p-6 shadow-[var(--shadow-card)] space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--lavender-strong)]" />
              <h2 className="font-display text-lg font-medium text-[var(--text-primary)]">
                Inbox preferences
              </h2>
            </div>

            <div className="divide-y divide-[var(--border-subtle)]">
              {prefItems.map((item) => {
                const enabled = notificationPrefs[item.key];
                return (
                  <div key={item.key} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium text-[var(--text-primary)]">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">{item.desc}</div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      onClick={() => updateNotificationPrefs({ [item.key]: !enabled })}
                      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                        enabled
                          ? 'bg-[#795D96] dark:bg-[#B18ACD]'
                          : 'bg-[var(--surface-secondary)] border border-[var(--border-medium)]'
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                          enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {notificationPrefs.affirmations && (
            <AffirmationCard tone="lavender" compact label="A quiet note" />
          )}
        </aside>
      </div>
    </div>
  );
};
