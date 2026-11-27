import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpDown,
  Bell,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Search,
  UserPlus,
} from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useLunara } from '../../providers/LunaraProvider';
import type { AdminUserPrototype } from '../../types/lunara';

type SortKey = 'name' | 'joined' | 'entries';
const PAGE_SIZE = 5;

export const AdminUsersPage: React.FC = () => {
  const {
    dataMode,
    adminUsers,
    adminUserCount,
    adminUsersLoading,
    adminUsersError,
    refreshAdminUsers,
    addAdminUser,
    updateAdminUser,
    showToast,
  } = useLunara();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | AdminUserPrototype['role']>('all');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [page, setPage] = useState(1);

  // Invite form
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AdminUserPrototype['role']>('Member');

  // Confirmation dialog for activate/deactivate
  const [statusToggleTarget, setStatusToggleTarget] = useState<AdminUserPrototype | null>(null);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = adminUsers.filter((u) => {
      const matchesStatus =
        dataMode === 'authenticated' || statusFilter === 'all' || u.status === statusFilter;
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        (u.email?.toLowerCase().includes(q) ?? false) ||
        u.role.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q);
      return matchesStatus && matchesRole && matchesQuery;
    });

    return [...list].sort((a, b) => {
      if (dataMode === 'authenticated') return a.name.localeCompare(b.name);
      if (sortBy === 'joined') return b.joinedDate.localeCompare(a.joinedDate);
      if (sortBy === 'entries') {
        const aCount = (a.checkIns?.length || 0) + (a.journals?.length || 0);
        const bCount = (b.checkIns?.length || 0) + (b.journals?.length || 0);
        return bCount - aCount;
      }
      return a.name.localeCompare(b.name);
    });
  }, [adminUsers, search, statusFilter, roleFilter, sortBy, dataMode]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleConfirmStatusToggle = () => {
    if (!statusToggleTarget) return;
    const nextStatus = statusToggleTarget.status === 'active' ? 'inactive' : 'active';
    updateAdminUser(statusToggleTarget.id, { status: nextStatus });
    showToast(`Prototype preview: ${statusToggleTarget.name} marked ${nextStatus}.`, 'blue');
    setStatusToggleTarget(null);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    addAdminUser({
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      status: 'active',
      preferredWindow: 'anytime',
    });
    setInviteName('');
    setInviteEmail('');
    showToast('Added user to prototype directory (no email sent).', 'amber');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration · Users"
        title="User management"
        description={dataMode === 'authenticated'
          ? 'Search registered accounts and inspect their authorized reflection histories.'
          : 'Preview the directory, account controls, and simulated member records.'}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Directory Table + Filters */}
        <section className="xl:col-span-8 rounded-[20px] bg-[var(--surface-main)] border border-[var(--border-subtle)] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder={dataMode === 'authenticated' ? 'Search name, ID, or role...' : 'Search name, email, or role...'}
                  aria-label="Search users"
                  className="w-full min-h-[40px] rounded-[11px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] pl-9 pr-3 text-sm text-[var(--text-primary)]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value as typeof roleFilter);
                    setPage(1);
                  }}
                  aria-label="Filter by role"
                  className="min-h-[38px] rounded-[10px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-2.5 text-xs text-[var(--text-primary)]"
                >
                  <option value="all">All roles</option>
                  <option value="Member">Member</option>
                  {dataMode !== 'authenticated' && <option value="Facilitator">Facilitator</option>}
                  <option value="Admin">Admin</option>
                </select>

                <div className="inline-flex items-center gap-1.5 min-h-[38px] rounded-[10px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-2.5 text-xs text-[var(--text-primary)]">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortKey)}
                    aria-label="Sort users"
                    className="bg-transparent focus:outline-none"
                  >
                    <option value="name">Sort: Name</option>
                    <option value="joined">Sort: Joined date</option>
                    {dataMode !== 'authenticated' && <option value="entries">Sort: Most entries</option>}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              {dataMode !== 'authenticated' ? (
                <div className="flex items-center gap-1 p-1 rounded-[11px] bg-[var(--surface-secondary)]">
                  {(['all', 'active', 'inactive'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setStatusFilter(status);
                        setPage(1);
                      }}
                      className={`min-h-[32px] px-3 rounded-[8px] text-xs font-medium capitalize cursor-pointer transition-colors ${
                        statusFilter === status
                          ? 'bg-[var(--surface-main)] text-[var(--text-primary)] shadow-xs'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-[var(--text-muted)]">
                  {adminUsers.length < adminUserCount
                    ? `Showing the latest ${adminUsers.length} of ${adminUserCount} accounts.`
                    : `${adminUserCount} registered accounts.`}
                </span>
              )}
              <span className="text-xs text-[var(--text-muted)] tabular-nums">
                {dataMode === 'authenticated' && adminUsersLoading
                  ? 'Loading accounts…'
                  : dataMode === 'authenticated' && adminUsersError
                    ? 'Accounts unavailable'
                    : `${filteredUsers.length} ${filteredUsers.length === 1 ? 'user' : 'users'}`}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                  <th className="py-3 px-4 sm:px-5 font-medium">User</th>
                  <th className="py-3 px-3 font-medium">Role</th>
                  <th className="py-3 px-3 font-medium">Summary</th>
                  <th className="py-3 px-3 font-medium">Status</th>
                  <th className="py-3 px-4 sm:px-5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-sm">
                {pagedUsers.map((u) => {
                  const ciCount = u.checkIns?.length || 0;
                  const jrCount = u.journals?.length || 0;
                  return (
                    <tr key={u.id} className="hover:bg-[var(--surface-secondary)]/45 transition-colors">
                      <td className="py-3.5 px-4 sm:px-5">
                        <Link
                          to={`/admin/users/${u.id}`}
                          className="font-medium text-[var(--text-primary)] hover:text-[var(--blue-strong)] transition-colors inline-flex items-center gap-1.5"
                        >
                          <span>{u.name}</span>
                          <ExternalLink className="w-3 h-3 opacity-50" />
                        </Link>
                        <div className="text-xs text-[var(--text-muted)]">{u.email || 'Email unavailable'}</div>
                      </td>
                      <td className="py-3.5 px-3 text-xs text-[var(--text-secondary)]">{u.role}</td>
                      <td className="py-3.5 px-3 text-xs text-[var(--text-secondary)] tabular-nums">
                        {dataMode === 'authenticated'
                          ? 'View actual activity'
                          : `${ciCount} check-ins · ${jrCount} journals`}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`text-xs font-medium ${
                            u.status === 'active'
                              ? 'text-[var(--teal-strong)]'
                              : u.status === 'inactive'
                                ? 'text-[var(--coral-strong)]'
                                : 'text-[var(--text-muted)]'
                          }`}
                        >
                          {u.status === 'unavailable'
                            ? 'Unavailable'
                            : u.status === 'active'
                              ? 'Active'
                              : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            to={`/admin/users/${u.id}`}
                            className="inline-flex items-center min-h-[32px] px-2.5 rounded-[9px] bg-[var(--surface-blue)]/70 hover:bg-[var(--surface-blue)] text-xs font-medium text-[var(--blue-strong)]"
                          >
                            View
                          </Link>
                          {dataMode !== 'authenticated' && (
                            <Link
                              to={`/admin/notifications?userId=${u.id}`}
                              aria-label={`Ping ${u.name}`}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-[9px] bg-[var(--surface-secondary)] hover:bg-[var(--surface-lavender)] text-[var(--text-secondary)] hover:text-[var(--lavender-strong)]"
                            >
                              <Bell className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          <Link
                            to={`/admin/export?userId=${u.id}`}
                            aria-label={`Export ${u.name}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-[9px] bg-[var(--surface-secondary)] hover:bg-[var(--surface-teal)] text-[var(--text-secondary)] hover:text-[var(--teal-strong)]"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Link>
                          {dataMode !== 'authenticated' && (
                            <button
                              type="button"
                              onClick={() => setStatusToggleTarget(u)}
                              className="min-h-[32px] px-2.5 rounded-[9px] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] cursor-pointer"
                            >
                              {u.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {pagedUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-[var(--text-muted)]">
                      {adminUsersLoading
                        ? 'Loading accounts…'
                        : adminUsersError
                          ? 'Accounts could not be loaded.'
                          : dataMode === 'authenticated'
                            ? 'No matching registered accounts.'
                            : 'No matching users in the preview directory.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {adminUsersError && dataMode === 'authenticated' && (
            <div role="alert" className="flex items-center justify-between gap-3 p-4 border-t border-[var(--border-subtle)]">
              <p className="text-sm text-[var(--text-primary)]">{adminUsersError}</p>
              <Button
                variant="secondary"
                size="sm"
                loading={adminUsersLoading}
                onClick={() => void refreshAdminUsers()}
              >
                Retry
              </Button>
            </div>
          )}

          {totalPages > 1 && (
            <div className="px-4 sm:px-5 py-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span className="tabular-nums">
                Page {safePage} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-[9px] bg-[var(--surface-secondary)] disabled:opacity-40 cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-[9px] bg-[var(--surface-secondary)] disabled:opacity-40 cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Preview-only prototype controls */}
        <aside className="xl:col-span-4 space-y-5">
          {dataMode === 'authenticated' ? (
            <div className="rounded-[20px] bg-[var(--surface-blue)]/65 border border-[var(--border-subtle)] p-5 space-y-2">
              <h3 className="font-display text-lg font-medium text-[var(--text-primary)]">Account controls</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Invitations, suspension, role changes, email, and last sign-in are unavailable in this client.
                Account status is not inferred.
              </p>
            </div>
          ) : (
          <form
            onSubmit={handleInviteSubmit}
            className="rounded-[20px] bg-[var(--surface-blue)]/65 border border-[var(--border-subtle)] p-5 space-y-3.5"
          >
            <h3 className="font-display text-lg font-medium text-[var(--text-primary)]">
              Add / invite user (prototype)
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Creates a simulated member record for previewing user management and exports.
            </p>
            <input
              type="text"
              required
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Full name"
              aria-label="Invited user name"
              className="w-full min-h-[42px] rounded-[11px] bg-[var(--surface-main)] border border-[var(--border-subtle)] px-3 text-sm text-[var(--text-primary)]"
            />
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email address"
              aria-label="Invited user email"
              className="w-full min-h-[42px] rounded-[11px] bg-[var(--surface-main)] border border-[var(--border-subtle)] px-3 text-sm text-[var(--text-primary)]"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as AdminUserPrototype['role'])}
              aria-label="Invited user role"
              className="w-full min-h-[42px] rounded-[11px] bg-[var(--surface-main)] border border-[var(--border-subtle)] px-3 text-sm text-[var(--text-primary)]"
            >
              <option value="Member">Member</option>
              <option value="Facilitator">Facilitator</option>
              <option value="Admin">Admin</option>
            </select>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              className="w-full"
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Add to preview directory
            </Button>
          </form>
          )}
        </aside>
      </div>

      {dataMode !== 'authenticated' && <ConfirmDialog
        open={statusToggleTarget !== null}
        title={
          statusToggleTarget?.status === 'active'
            ? `Deactivate ${statusToggleTarget?.name}?`
            : `Activate ${statusToggleTarget?.name}?`
        }
        description="This updates the prototype directory preview only. Real account suspension requires backend authentication."
        confirmLabel={statusToggleTarget?.status === 'active' ? 'Deactivate' : 'Activate'}
        destructive={statusToggleTarget?.status === 'active'}
        onConfirm={handleConfirmStatusToggle}
        onCancel={() => setStatusToggleTarget(null)}
      />}
    </div>
  );
};
