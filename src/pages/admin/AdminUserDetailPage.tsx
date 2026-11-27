import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowLeft,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  PenLine,
  Search,
  User,
} from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button, IconButton } from '../../components/ui/Button';
import { MOOD_MAP } from '../../data/sampleJourney';
import {
  countWords,
  formatAxisDate,
  formatLongDate,
  formatMediumDate,
  getMonthDays,
  parseDateKey,
  toDateKey,
} from '../../lib/date';
import { useLunara } from '../../providers/LunaraProvider';
import type { AdminUserPrototype } from '../../types/lunara';

type DetailTab = 'profile' | 'checkins' | 'journals' | 'activity' | 'calendar';

export const AdminUserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { adminUsers, updateAdminUser, showToast } = useLunara();

  const targetUser = adminUsers.find((u) => u.id === userId);
  const [activeTab, setActiveTab] = useState<DetailTab>('profile');
  const [entrySearch, setEntrySearch] = useState('');

  // Calendar view state
  const todayKey = toDateKey();
  const [selectedCalDate, setSelectedCalDate] = useState(todayKey);
  const [viewYear, setViewYear] = useState(() => parseDateKey(todayKey).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parseDateKey(todayKey).getMonth());

  const checkIns = useMemo(() => targetUser?.checkIns || [], [targetUser]);
  const journals = useMemo(() => targetUser?.journals || [], [targetUser]);

  const filteredCheckIns = useMemo(() => {
    const q = entrySearch.trim().toLowerCase();
    return checkIns.filter(
      (c) =>
        !q ||
        c.date.includes(q) ||
        c.notes.toLowerCase().includes(q) ||
        (c.mood && MOOD_MAP[c.mood].label.toLowerCase().includes(q))
    );
  }, [checkIns, entrySearch]);

  const filteredJournals = useMemo(() => {
    const q = entrySearch.trim().toLowerCase();
    return journals.filter(
      (j) =>
        !q ||
        j.date.includes(q) ||
        j.title.toLowerCase().includes(q) ||
        j.content.toLowerCase().includes(q)
    );
  }, [journals, entrySearch]);

  const chartData = useMemo(
    () =>
      [...checkIns]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((c) => ({
          label: formatAxisDate(c.date),
          happiness: c.happiness,
          energy: c.energy,
          stress: c.stress,
        })),
    [checkIns]
  );

  const monthCells = useMemo(() => getMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthLabel = useMemo(
    () =>
      new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    [viewYear, viewMonth]
  );

  if (!targetUser) {
    return (
      <div className="rounded-[24px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-8 text-center space-y-4">
        <h1 className="font-display text-2xl font-medium text-[var(--text-primary)]">
          User not found
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          This account could not be found in the prototype directory.
        </p>
        <Link to="/admin/users">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to directory
          </Button>
        </Link>
      </div>
    );
  }

  const checkInMap = new Map(checkIns.map((c) => [c.date, c]));
  const journalMap = new Map<string, typeof journals>();
  journals.forEach((j) => {
    const list = journalMap.get(j.date) || [];
    list.push(j);
    journalMap.set(j.date, list);
  });

  const tabs: Array<{ id: DetailTab; label: string; icon: typeof User }> = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'checkins', label: `Check-ins (${checkIns.length})`, icon: PenLine },
    { id: 'journals', label: `Journals (${journals.length})`, icon: BookOpen },
    { id: 'activity', label: 'Activity Overview', icon: BarChart3 },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  ];

  const avgMetric = (vals: Array<number | null>) => {
    const clean = vals.filter((v): v is number => v !== null);
    if (!clean.length) return '—';
    return (clean.reduce((a, b) => a + b, 0) / clean.length).toFixed(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration · User Detail"
        title={targetUser.name}
        description={`${targetUser.email} · ${targetUser.role} · Prototype record`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/users">
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Directory
              </Button>
            </Link>
            <Link to={`/admin/notifications?userId=${targetUser.id}`}>
              <Button variant="outline" size="sm" leftIcon={<Bell className="w-4 h-4" />}>
                Ping user
              </Button>
            </Link>
            <Link to={`/admin/export?userId=${targetUser.id}`}>
              <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                Export data
              </Button>
            </Link>
          </div>
        }
      />

      {/* Detail Section Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 min-h-[42px] px-4 rounded-[12px] text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active
                  ? 'bg-[var(--surface-blue)] text-[var(--blue-strong)]'
                  : 'bg-[var(--surface-main)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-[20px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-6 space-y-5">
            <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
              Account overview
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-xs text-[var(--text-muted)]">Joined</div>
                <div className="mt-1 font-medium text-[var(--text-primary)] tabular-nums">
                  {targetUser.joinedDate}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)]">Last active</div>
                <div className="mt-1 font-medium text-[var(--text-primary)]">
                  {targetUser.lastActive}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)]">Preferred time</div>
                <div className="mt-1 font-medium capitalize text-[var(--text-primary)]">
                  {targetUser.preferredWindow || 'anytime'}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)]">Status</div>
                <div
                  className={`mt-1 font-medium capitalize ${
                    targetUser.status === 'active'
                      ? 'text-[var(--teal-strong)]'
                      : 'text-[var(--coral-strong)]'
                  }`}
                >
                  {targetUser.status}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="detail-role"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Assigned role (prototype)
                </label>
                <select
                  id="detail-role"
                  value={targetUser.role}
                  onChange={(e) => {
                    updateAdminUser(targetUser.id, {
                      role: e.target.value as AdminUserPrototype['role'],
                    });
                    showToast('Updated prototype role.', 'blue');
                  }}
                  className="w-full min-h-[40px] rounded-[11px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-3 text-sm text-[var(--text-primary)]"
                >
                  <option value="Member">Member</option>
                  <option value="Facilitator">Facilitator</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="detail-status"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Account status (prototype)
                </label>
                <select
                  id="detail-status"
                  value={targetUser.status}
                  onChange={(e) => {
                    updateAdminUser(targetUser.id, {
                      status: e.target.value as AdminUserPrototype['status'],
                    });
                    showToast('Updated prototype status.', 'blue');
                  }}
                  className="w-full min-h-[40px] rounded-[11px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-3 text-sm text-[var(--text-primary)]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-[20px] bg-[var(--surface-blue)]/65 border border-[var(--border-subtle)] p-6 space-y-4">
            <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
              Recorded reflection summary
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[14px] bg-[var(--surface-main)] p-4">
                <div className="text-xs text-[var(--text-muted)]">Check-ins</div>
                <div className="mt-1 font-display text-2xl font-medium tabular-nums text-[var(--text-primary)]">
                  {checkIns.length}
                </div>
              </div>
              <div className="rounded-[14px] bg-[var(--surface-main)] p-4">
                <div className="text-xs text-[var(--text-muted)]">Journal entries</div>
                <div className="mt-1 font-display text-2xl font-medium tabular-nums text-[var(--text-primary)]">
                  {journals.length}
                </div>
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Lunara presents only descriptive self-reported entries. No automated risk labels or psychological assessments are generated.
            </p>
          </div>
        </section>
      )}

      {(activeTab === 'checkins' || activeTab === 'journals') && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={entrySearch}
              onChange={(e) => setEntrySearch(e.target.value)}
              placeholder="Filter by date or text..."
              aria-label="Filter user entries"
              className="w-full min-h-[40px] rounded-[11px] bg-[var(--surface-main)] border border-[var(--border-subtle)] pl-9 pr-3 text-sm text-[var(--text-primary)]"
            />
          </div>

          {activeTab === 'checkins' ? (
            filteredCheckIns.length === 0 ? (
              <div className="rounded-[20px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-8 text-center text-sm text-[var(--text-secondary)]">
                No prototype check-in entries recorded for this account.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCheckIns.map((c) => {
                  const moodDef = c.mood ? MOOD_MAP[c.mood] : null;
                  return (
                    <article
                      key={c.id}
                      className="rounded-[20px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-5 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-display text-lg font-medium text-[var(--text-primary)]">
                          {formatLongDate(c.date)}
                        </span>
                        {moodDef && (
                          <span className="text-xs font-medium text-[var(--blue-strong)]">
                            {moodDef.emoji} {moodDef.label}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-[12px] bg-[var(--surface-teal)] p-3">
                          <span className="text-[var(--text-secondary)]">Happiness</span>
                          <div className="mt-0.5 font-display text-lg font-medium text-[var(--teal-strong)] tabular-nums">
                            {c.happiness ?? '—'} / 5
                          </div>
                        </div>
                        <div className="rounded-[12px] bg-[var(--surface-amber)] p-3">
                          <span className="text-[var(--text-secondary)]">Energy</span>
                          <div className="mt-0.5 font-display text-lg font-medium text-[var(--amber-strong)] tabular-nums">
                            {c.energy ?? '—'} / 5
                          </div>
                        </div>
                        <div className="rounded-[12px] bg-[var(--surface-coral)] p-3">
                          <span className="text-[var(--text-secondary)]">Stress</span>
                          <div className="mt-0.5 font-display text-lg font-medium text-[var(--coral-strong)] tabular-nums">
                            {c.stress ?? '—'} / 5
                          </div>
                        </div>
                      </div>

                      {(c.likes.length > 0 || c.dislikes.length > 0) && (
                        <div className="text-xs text-[var(--text-secondary)] space-y-1">
                          {c.likes.length > 0 && <div>Enjoyed: {c.likes.join(' · ')}</div>}
                          {c.dislikes.length > 0 && <div>Felt heavy: {c.dislikes.join(' · ')}</div>}
                        </div>
                      )}

                      {c.notes && (
                        <p className="text-sm text-[var(--text-primary)] bg-[var(--surface-secondary)] rounded-[12px] p-3.5">
                          {c.notes}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )
          ) : filteredJournals.length === 0 ? (
            <div className="rounded-[20px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-8 text-center text-sm text-[var(--text-secondary)]">
              No prototype journal entries recorded for this account.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJournals.map((j) => (
                <article
                  key={j.id}
                  className="rounded-[22px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-6 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                    <span>{formatMediumDate(j.date)}</span>
                    <span className="tabular-nums">{countWords(j.content)} words</span>
                  </div>
                  <h3 className="font-display text-xl font-medium text-[var(--text-primary)]">
                    {j.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-line">
                    {j.content}
                  </p>
                  {j.tags.length > 0 && (
                    <div className="text-xs text-[var(--rose-strong)] pt-1">
                      {j.tags.join(' · ')}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <section className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-[18px] bg-[var(--surface-teal)] p-5">
              <div className="text-xs text-[var(--text-secondary)]">Avg. happiness</div>
              <div className="mt-1 font-display text-3xl font-medium tabular-nums text-[var(--teal-strong)]">
                {avgMetric(checkIns.map((c) => c.happiness))}
              </div>
            </div>
            <div className="rounded-[18px] bg-[var(--surface-amber)] p-5">
              <div className="text-xs text-[var(--text-secondary)]">Avg. energy</div>
              <div className="mt-1 font-display text-3xl font-medium tabular-nums text-[var(--amber-strong)]">
                {avgMetric(checkIns.map((c) => c.energy))}
              </div>
            </div>
            <div className="rounded-[18px] bg-[var(--surface-coral)] p-5">
              <div className="text-xs text-[var(--text-secondary)]">Avg. stress</div>
              <div className="mt-1 font-display text-3xl font-medium tabular-nums text-[var(--coral-strong)]">
                {avgMetric(checkIns.map((c) => c.stress))}
              </div>
            </div>
          </div>

          <div className="rounded-[20px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-6">
            <h3 className="font-display text-lg font-medium text-[var(--text-primary)] mb-4">
              Recorded metric trend
            </h3>
            {chartData.length >= 2 ? (
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -24, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="happiness" name="Happiness" stroke="#76BBAA" fill="#76BBAA" fillOpacity={0.18} />
                    <Area type="monotone" dataKey="energy" name="Energy" stroke="#E5B26F" fillOpacity={0} />
                    <Area type="monotone" dataKey="stress" name="Stress" stroke="#DF9189" fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">
                At least two recorded check-ins are needed to draw a trend line.
              </p>
            )}
          </div>
        </section>
      )}

      {activeTab === 'calendar' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 rounded-[22px] bg-[var(--surface-blue)] p-5">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="font-display text-xl font-medium text-[var(--text-primary)]">
                {monthLabel}
              </h3>
              <div className="flex items-center gap-1.5">
                <IconButton
                  label="Previous month"
                  variant="surface"
                  size="sm"
                  onClick={() => {
                    const d = new Date(viewYear, viewMonth - 1, 1);
                    setViewYear(d.getFullYear());
                    setViewMonth(d.getMonth());
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </IconButton>
                <IconButton
                  label="Next month"
                  variant="surface"
                  size="sm"
                  onClick={() => {
                    const d = new Date(viewYear, viewMonth + 1, 1);
                    setViewYear(d.getFullYear());
                    setViewMonth(d.getMonth());
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </IconButton>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {monthCells.map((cell) => {
                const ci = checkInMap.get(cell.dateKey);
                const jr = journalMap.get(cell.dateKey);
                const isSelected = selectedCalDate === cell.dateKey;
                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    onClick={() => setSelectedCalDate(cell.dateKey)}
                    className={`min-h-[46px] rounded-[11px] flex flex-col items-center justify-center gap-1 text-xs font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#304A70] text-white dark:bg-[#78A6E7] dark:text-[#152031]'
                        : cell.inCurrentMonth
                          ? 'bg-[var(--surface-main)]/80 text-[var(--text-primary)]'
                          : 'bg-[var(--surface-main)]/30 text-[var(--text-muted)] opacity-60'
                    }`}
                  >
                    <span className="tabular-nums">{cell.dayNumber}</span>
                    <span className="flex gap-1 h-1.5">
                      {ci && <span className="w-1.5 h-1.5 rounded-full bg-[#76BBAA]" />}
                      {jr && jr.length > 0 && <span className="w-1.5 h-1.5 rounded-xs bg-[#D99EBB]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-[22px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-5 space-y-3">
            <div className="text-xs font-medium text-[var(--blue-strong)]">
              {formatLongDate(selectedCalDate)}
            </div>
            {checkInMap.get(selectedCalDate) ? (
              <div className="text-sm space-y-2">
                <p className="font-medium text-[var(--text-primary)]">
                  Mood:{' '}
                  {checkInMap.get(selectedCalDate)?.mood
                    ? MOOD_MAP[checkInMap.get(selectedCalDate)!.mood!].label
                    : 'Not set'}
                </p>
                {checkInMap.get(selectedCalDate)?.notes && (
                  <p className="text-xs text-[var(--text-secondary)]">
                    {checkInMap.get(selectedCalDate)?.notes}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">No check-in on this date.</p>
            )}

            {(journalMap.get(selectedCalDate) || []).map((j) => (
              <div key={j.id} className="rounded-[14px] bg-[var(--surface-rose)] p-3.5 text-xs">
                <div className="font-medium text-[var(--text-primary)]">{j.title}</div>
                <p className="mt-1 text-[var(--text-secondary)] line-clamp-3">{j.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
