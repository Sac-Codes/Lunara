import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bell, Info, Send } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/Button';
import { useLunara } from '../../providers/LunaraProvider';
import type { NotificationCategory } from '../../types/lunara';

const CATEGORIES: Array<{ id: NotificationCategory; label: string }> = [
  { id: 'general', label: 'General message' },
  { id: 'encouragement', label: 'Gentle encouragement' },
  { id: 'affirmation', label: 'Affirmation' },
  { id: 'reminder', label: 'Gentle check-in note' },
  { id: 'announcement', label: 'Workspace announcement' },
  { id: 'update', label: 'Feature update' },
];

const STARTER_TEMPLATES = [
  {
    label: 'Warm check-in',
    category: 'encouragement' as NotificationCategory,
    title: 'Checking in gently',
    message:
      'No pressure at all—whenever you have a quiet minute this week, Lunara is here whenever you feel like checking in.',
  },
  {
    label: 'New Gita passage',
    category: 'update' as NotificationCategory,
    title: 'A new reflection in Wisdom',
    message:
      'A new Bhagavad Gita passage and everyday reflection has been added to your Wisdom space.',
  },
];

export const AdminNotificationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { adminUsers, notifications, sendNotification, showToast } = useLunara();

  const initialUserId = searchParams.get('userId') || 'all';
  const [targetUserId, setTargetUserId] = useState<string>(initialUserId);
  const [category, setCategory] = useState<NotificationCategory>('encouragement');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const targetUser = useMemo(
    () => (targetUserId === 'all' ? null : adminUsers.find((u) => u.id === targetUserId) || null),
    [adminUsers, targetUserId]
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    sendNotification({
      title: title.trim(),
      message: message.trim(),
      category,
      targetUserLabel: targetUser ? `${targetUser.name} (${targetUser.email})` : 'All prototype users',
      targetUserName: targetUser?.name,
    });

    showToast(
      targetUser
        ? `Prototype notification delivered for ${targetUser.name} (visible in local Inbox).`
        : 'Notification delivered to local prototype Inbox.',
      'lavender'
    );
    setTitle('');
    setMessage('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration · Communication"
        title="Ping user & send notifications"
        description="Send calm, non-judgmental notes, affirmations, or workspace updates without pressure or guilt."
      />

      <div className="rounded-[16px] bg-[var(--surface-amber)]/75 px-4 py-3 flex items-start gap-2.5 text-xs text-[var(--amber-strong)]">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Prototype communication note: messages sent here appear immediately inside the local user Notification Center (`/notifications`) on this device. Multi-user push delivery requires a backend.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSend}
          className="lg:col-span-7 rounded-[20px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
              Compose message
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {STARTER_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => {
                    setCategory(tpl.category);
                    setTitle(tpl.title);
                    setMessage(tpl.message);
                  }}
                  className="min-h-[30px] px-2.5 rounded-[9px] bg-[var(--surface-lavender)] text-xs font-medium text-[var(--lavender-strong)] cursor-pointer hover:opacity-85"
                >
                  Use: {tpl.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="notif-target"
                className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
              >
                Recipient
              </label>
              <select
                id="notif-target"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full min-h-[42px] rounded-[11px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-3 text-sm text-[var(--text-primary)]"
              >
                <option value="all">All prototype users</option>
                {adminUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="notif-category"
                className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
              >
                Category
              </label>
              <select
                id="notif-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as NotificationCategory)}
                className="w-full min-h-[42px] rounded-[11px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-3 text-sm text-[var(--text-primary)]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="notif-title"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Title
            </label>
            <input
              id="notif-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., A quiet note for your week"
              className="w-full min-h-[42px] rounded-[11px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-3.5 text-sm text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label
              htmlFor="notif-message"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Message body (keep tone gentle and non-demanding)
            </label>
            <textarea
              id="notif-message"
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a warm, respectful note..."
              className="w-full rounded-[13px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] p-3.5 text-sm text-[var(--text-primary)] leading-relaxed"
            />
          </div>

          <Button type="submit" variant="primary" size="md" leftIcon={<Send className="w-4 h-4" />}>
            {targetUser ? `Send note to ${targetUser.name}` : 'Send workspace notification'}
          </Button>
        </form>

        {/* Live Preview + Recent Sent */}
        <aside className="lg:col-span-5 space-y-5">
          <div className="rounded-[20px] bg-[var(--surface-lavender)] p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--lavender-strong)]">
              <Bell className="w-3.5 h-3.5" />
              <span>User inbox preview</span>
            </div>
            <div className="rounded-[16px] bg-[var(--surface-main)] p-4 shadow-xs space-y-1.5">
              <div className="text-[11px] text-[var(--text-muted)]">
                {CATEGORIES.find((c) => c.id === category)?.label} · Target:{' '}
                {targetUser ? targetUser.name : 'All users'}
              </div>
              <div className="font-display text-lg font-medium text-[var(--text-primary)]">
                {title.trim() || 'Notification title preview'}
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {message.trim() || 'Your calm message will appear here cleanly without urgency.'}
              </p>
            </div>
          </div>

          <div className="rounded-[20px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-5 space-y-3">
            <h3 className="font-display text-lg font-medium text-[var(--text-primary)]">
              Recent sent history ({notifications.length})
            </h3>
            <div className="divide-y divide-[var(--border-subtle)] max-h-[280px] overflow-y-auto">
              {notifications.slice(0, 6).map((n) => (
                <div key={n.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-[var(--text-primary)] truncate">{n.title}</span>
                    <span className="text-[11px] text-[var(--text-muted)] capitalize shrink-0">
                      {n.category}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-0.5">
                    {n.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
