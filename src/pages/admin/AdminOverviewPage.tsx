import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  Bell,
  BookMarked,
  ClipboardList,
  Download,
  Sliders,
  Users,
} from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { useLunara } from '../../providers/LunaraProvider';

export const AdminOverviewPage: React.FC = () => {
  const {
    parameters,
    adminConfig,
    adminUsers,
    publishedAffirmations,
    publishedWisdom,
    dailyWisdom,
    notifications,
    auditLogs,
  } = useLunara();

  const activeUsers = adminUsers.filter((u) => u.status === 'active').length;
  const inactiveUsers = adminUsers.length - activeUsers;
  const totalProtoCheckIns = adminUsers.reduce((acc, u) => acc + (u.checkIns?.length || 0), 0);
  const totalProtoJournals = adminUsers.reduce((acc, u) => acc + (u.journals?.length || 0), 0);
  const enabledParams = parameters.filter((p) => p.enabled).length;
  const unreadNotifs = notifications.filter((n) => !n.read).length;

  const userActivityData = useMemo(
    () =>
      adminUsers.map((u) => ({
        name: u.name.split(' ')[0],
        checkIns: u.checkIns?.length || 0,
        journals: u.journals?.length || 0,
      })),
    [adminUsers]
  );

  const pendingTasks = [
    ...(dailyWisdom
      ? []
      : [{ label: 'Assign a featured daily Bhagavad Gita passage', to: '/admin/content' }]),
    ...(inactiveUsers > 0
      ? [
          {
            label: `${inactiveUsers} inactive prototype ${inactiveUsers === 1 ? 'account' : 'accounts'} in directory`,
            to: '/admin/users',
          },
        ]
      : []),
    {
      label: `${publishedAffirmations.length} affirmations active · review or schedule new reflections`,
      to: '/admin/content',
    },
    {
      label: `Audit log holds ${auditLogs.length} workspace events`,
      to: '/admin/audit',
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Administration · Overview"
        title="Workspace overview"
        description="Operational summary across prototype user activity, content curation, notifications, and system configuration."
      />

      {/* Executive Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-[18px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-5">
          <div className="text-xs font-medium text-[var(--text-muted)]">Prototype users</div>
          <div className="mt-2 font-display text-3xl font-medium tabular-nums text-[var(--text-primary)]">
            {adminUsers.length}
          </div>
          <div className="mt-1 text-xs text-[var(--teal-strong)] tabular-nums">
            {activeUsers} active · {inactiveUsers} inactive
          </div>
        </div>

        <div className="rounded-[18px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-5">
          <div className="text-xs font-medium text-[var(--text-muted)]">Prototype reflections</div>
          <div className="mt-2 font-display text-3xl font-medium tabular-nums text-[var(--text-primary)]">
            {totalProtoCheckIns + totalProtoJournals}
          </div>
          <div className="mt-1 text-xs text-[var(--blue-strong)] tabular-nums">
            {totalProtoCheckIns} check-ins · {totalProtoJournals} journals
          </div>
        </div>

        <div className="rounded-[18px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-5">
          <div className="text-xs font-medium text-[var(--text-muted)]">Curated content</div>
          <div className="mt-2 font-display text-3xl font-medium tabular-nums text-[var(--text-primary)]">
            {publishedAffirmations.length + publishedWisdom.length}
          </div>
          <div className="mt-1 text-xs text-[var(--lavender-strong)] tabular-nums">
            {publishedAffirmations.length} affirmations · {publishedWisdom.length} Gita passages
          </div>
        </div>

        <div className="rounded-[18px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-5">
          <div className="text-xs font-medium text-[var(--text-muted)]">System &amp; inbox</div>
          <div className="mt-2 font-display text-3xl font-medium tabular-nums text-[var(--text-primary)]">
            {enabledParams} <span className="text-sm font-sans text-[var(--text-muted)]">/ {parameters.length} fields</span>
          </div>
          <div className="mt-1 text-xs text-[var(--amber-strong)] tabular-nums">
            {unreadNotifs} unread prototype {unreadNotifs === 1 ? 'message' : 'messages'}
          </div>
        </div>
      </section>

      {/* Activity Chart & Pending Admin Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-7 rounded-[20px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
                  Prototype reflection activity by member
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Check-ins and journal entries available in the simulated directory.
                </p>
              </div>
              <Link
                to="/admin/users"
                className="text-xs font-medium text-[var(--blue-strong)] hover:underline"
              >
                Inspect users
              </Link>
            </div>

            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userActivityData} margin={{ top: 8, right: 12, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-[12px] bg-[var(--surface-main)] border border-[var(--border-medium)] px-3 py-2 text-xs shadow-md">
                          <div className="font-medium text-[var(--text-primary)] mb-1">{label}</div>
                          {payload.map((p) => (
                            <div key={String(p.dataKey)} className="flex justify-between gap-4">
                              <span className="text-[var(--text-secondary)]">{p.name}</span>
                              <span className="tabular-nums font-medium">{p.value}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="checkIns" name="Check-ins" fill="#78A6E7" radius={[6, 6, 0, 0]} barSize={22} />
                  <Bar dataKey="journals" name="Journals" fill="#B18ACD" radius={[6, 6, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="lg:col-span-5 rounded-[20px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-6 space-y-4">
          <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
            Operational checklist
          </h2>

          <div className="divide-y divide-[var(--border-subtle)]">
            {pendingTasks.map((task) => (
              <Link
                key={task.label}
                to={task.to}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group"
              >
                <span>{task.label}</span>
                <ArrowRight className="w-4 h-4 text-[var(--blue-strong)] shrink-0 opacity-60 group-hover:opacity-100" />
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
            Workspace: <strong className="text-[var(--text-primary)]">{adminConfig.workspaceName}</strong> · Daily Gita verse:{' '}
            {dailyWisdom ? `${dailyWisdom.chapter}:${dailyWisdom.verse}` : 'None assigned'}
          </div>
        </section>
      </div>

      {/* Quick Links Grid + Recent Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-6 rounded-[20px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-6 space-y-4">
          <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
            Quick management
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { to: '/admin/users', label: 'User directory', sub: 'Inspect profiles & entries', icon: Users, bg: 'bg-[var(--surface-blue)]/65', text: 'text-[var(--blue-strong)]' },
              { to: '/admin/export', label: 'Export user data', sub: 'CSV, JSON & print report', icon: Download, bg: 'bg-[var(--surface-teal)]/65', text: 'text-[var(--teal-strong)]' },
              { to: '/admin/notifications', label: 'Ping / Notify', sub: 'Send gentle updates', icon: Bell, bg: 'bg-[var(--surface-lavender)]/65', text: 'text-[var(--lavender-strong)]' },
              { to: '/admin/content', label: 'Content hub', sub: 'Affirmations & Gita wisdom', icon: BookMarked, bg: 'bg-[var(--surface-amber)]/65', text: 'text-[var(--amber-strong)]' },
              { to: '/admin/parameters', label: 'Check-in fields', sub: 'Scales & custom prompts', icon: Sliders, bg: 'bg-[var(--surface-secondary)]', text: 'text-[var(--text-primary)]' },
              { to: '/admin/audit', label: 'Audit logs', sub: 'Exports, pings & edits', icon: ClipboardList, bg: 'bg-[var(--surface-rose)]/65', text: 'text-[var(--rose-strong)]' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-[16px] ${item.bg} p-4 flex items-center justify-between gap-3 hover:opacity-90 transition-opacity`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${item.text}`} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {item.label}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] truncate">{item.sub}</div>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 shrink-0 ${item.text}`} />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-6 rounded-[20px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
              Recent admin activity
            </h2>
            <Link to="/admin/audit" className="text-xs font-medium text-[var(--blue-strong)] hover:underline">
              Full audit log
            </Link>
          </div>

          <div className="divide-y divide-[var(--border-subtle)]">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-[var(--text-primary)]">{log.action}</span>
                  <span className="text-[var(--text-muted)] tabular-nums">
                    {new Date(log.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{log.details}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
