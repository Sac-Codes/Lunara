import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ClipboardList, Search, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/Button';
import { useLunara } from '../../providers/LunaraProvider';
import { auditService, type AdminAuditAction, type AdminAuditLog } from '../../services/auditService';
import type { AuditLogEntry } from '../../types/lunara';

type AuditFilter = AdminAuditAction | 'all';
type AuditState =
  | { status: 'loading'; page: number; filter: AuditFilter }
  | { status: 'error'; page: number; filter: AuditFilter; message: string }
  | { status: 'loaded'; page: number; filter: AuditFilter; entries: AdminAuditLog[]; total: number };

const PAGE_SIZE = 50;

const ACTION_LABELS: Record<AdminAuditAction, string> = {
  user_records_viewed: 'Viewed user records',
  user_data_exported: 'Exported user data',
  affirmation_created: 'Created affirmation',
  affirmation_updated: 'Updated affirmation',
  affirmation_deleted: 'Deleted affirmation',
  wisdom_created: 'Created wisdom entry',
  wisdom_updated: 'Updated wisdom entry',
  wisdom_deleted: 'Deleted wisdom entry',
};

function getAuditDetails(log: AdminAuditLog): string {
  if (log.resourceType === 'preview' && typeof log.metadata === 'object' && log.metadata !== null && !Array.isArray(log.metadata)) {
    return typeof log.metadata.details === 'string' ? log.metadata.details : '';
  }
  if (log.action === 'user_data_exported' && typeof log.metadata === 'object' && log.metadata !== null && !Array.isArray(log.metadata)) {
    const format = log.metadata.format;
    const categories = log.metadata.categories;
    const details = [
      typeof format === 'string' ? `${format.toUpperCase()} export` : 'Data export',
      Array.isArray(categories) ? `categories: ${categories.filter((value): value is string => typeof value === 'string').join(', ')}` : '',
    ].filter(Boolean);
    return details.join(' · ');
  }
  if (log.action === 'user_records_viewed') return 'Viewed the selected account’s reflection records.';
  return `Shared ${log.resourceType} content event${log.resourceId ? ` (${log.resourceId})` : ''}.`;
}

function getActionLabel(log: AdminAuditLog): string {
  if (log.resourceType === 'preview' && typeof log.metadata === 'object' && log.metadata !== null && !Array.isArray(log.metadata)) {
    return typeof log.metadata.action === 'string' ? log.metadata.action : 'Preview event';
  }
  return ACTION_LABELS[log.action];
}

function toPreviewLog(log: AuditLogEntry): AdminAuditLog {
  return {
    id: log.id,
    actorUserId: '',
    actorName: log.actorName,
    action: 'user_records_viewed',
    targetUserId: null,
    targetName: log.targetUserName ?? null,
    resourceType: 'preview',
    resourceId: null,
    metadata: { action: log.action, details: log.details },
    timestamp: log.timestamp,
  };
}

export const AdminAuditPage: React.FC = () => {
  const { dataMode, auditLogs } = useLunara();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditFilter>('all');
  const [page, setPage] = useState(1);
  const [request, setRequest] = useState(0);
  const [state, setState] = useState<AuditState>({
    status: 'loading',
    page: 1,
    filter: 'all',
  });

  useEffect(() => {
    if (dataMode !== 'authenticated') return;
    let active = true;
    setState({ status: 'loading', page, filter: actionFilter });
    void auditService.listAdminAuditLogs({
      offset: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
      action: actionFilter,
    }).then((result) => {
      if (!active) return;
      if (result.ok) {
        setState({
          status: 'loaded',
          page,
          filter: actionFilter,
          entries: result.data.entries,
          total: result.data.total,
        });
      } else {
        setState({ status: 'error', page, filter: actionFilter, message: result.error.message });
      }
    }).catch(() => {
      if (active) {
        setState({
          status: 'error',
          page,
          filter: actionFilter,
          message: 'Audit events could not be loaded. Please retry.',
        });
      }
    });
    return () => {
      active = false;
    };
  }, [dataMode, page, actionFilter, request]);

  const loadedForSelection =
    state.status === 'loaded' && state.page === page && state.filter === actionFilter;
  const loadingForSelection =
    dataMode === 'authenticated' &&
    (state.status === 'loading' || state.page !== page || state.filter !== actionFilter);
  const entries = dataMode === 'authenticated'
    ? loadedForSelection ? state.entries : []
    : auditLogs.map(toPreviewLog);
  const total = dataMode === 'authenticated'
    ? loadedForSelection ? state.total : 0
    : auditLogs.length;

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((log) => {
      const details = getAuditDetails(log);
      return (
        !q ||
        getActionLabel(log).toLowerCase().includes(q) ||
        details.toLowerCase().includes(q) ||
        log.actorName.toLowerCase().includes(q) ||
        (log.targetName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [entries, search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration · Audit Logs"
        title="Workspace audit trail"
        description={dataMode === 'authenticated'
          ? 'Persistent, database-backed history of authorized record views, exports, and shared-content changes.'
          : 'Preview-only local audit events; they are not a persistent cloud audit trail.'}
      />

      <div className="rounded-[16px] bg-[var(--surface-teal)]/75 px-4 py-3 flex items-start gap-2.5 text-xs text-[var(--teal-strong)]">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Audit metadata records action types and resource identifiers only. Check-in notes and journal prose are never copied into audit events.
        </span>
      </div>

      <section className="rounded-[20px] bg-[var(--surface-main)] border border-[var(--border-subtle)] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search action, actor, or target..."
                aria-label="Search audit logs"
                className="w-full min-h-[40px] rounded-[11px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] pl-9 pr-3 text-sm text-[var(--text-primary)]"
              />
            </div>
            {dataMode === 'authenticated' && <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value as AuditFilter);
                setPage(1);
              }}
              aria-label="Filter audit events by action"
              className="min-h-[40px] rounded-[11px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-3 text-xs text-[var(--text-primary)]"
            >
              <option value="all">All events</option>
              {Object.entries(ACTION_LABELS).map(([action, label]) => (
                <option key={action} value={action}>{label}</option>
              ))}
            </select>}
            <span className="text-xs text-[var(--text-muted)] tabular-nums">
              {loadingForSelection || (dataMode === 'authenticated' && state.status === 'error')
                ? '— events'
                : `${total} ${total === 1 ? 'event' : 'events'}`}
            </span>
          </div>
          {dataMode === 'authenticated' && search && (
            <p className="text-xs text-[var(--text-muted)]">
              Search applies to the currently loaded page of up to {PAGE_SIZE} events.
            </p>
          )}
        </div>

        {loadingForSelection && (
          <p role="status" aria-live="polite" className="p-6 text-sm text-[var(--text-secondary)]">
            Loading audit events…
          </p>
        )}
        {dataMode === 'authenticated' && state.status === 'error' &&
          state.page === page && state.filter === actionFilter && (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 p-5">
              <p className="text-sm text-[var(--text-primary)]">{state.message}</p>
              <Button variant="secondary" size="sm" onClick={() => setRequest((value) => value + 1)}>
                Retry
              </Button>
            </div>
          )}

        {!loadingForSelection && !(dataMode === 'authenticated' && state.status === 'error') && (
          <div className="divide-y divide-[var(--border-subtle)]">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--text-secondary)]">
                <ClipboardList className="w-7 h-7 text-[var(--text-muted)] mx-auto mb-2" />
                {search ? 'No matching audit events on this page.' : 'No audit events have been recorded.'}
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-[var(--blue-strong)]">{getActionLabel(log)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[var(--text-primary)]">{log.actorName}</span>
                      {log.targetName && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[var(--lavender-strong)]">Target: {log.targetName}</span>
                        </>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{getAuditDetails(log)}</p>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] tabular-nums shrink-0">
                    {new Date(log.timestamp).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {dataMode === 'authenticated' && totalPages > 1 && (
          <div className="px-4 sm:px-5 py-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1 || loadingForSelection}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                aria-label="Previous audit page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages || loadingForSelection}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                aria-label="Next audit page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
