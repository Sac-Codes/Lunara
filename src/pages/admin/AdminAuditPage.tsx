import React, { useMemo, useState } from 'react';
import { ClipboardList, Search, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { useLunara } from '../../providers/LunaraProvider';

export const AdminAuditPage: React.FC = () => {
  const { auditLogs } = useLunara();
  const [search, setSearch] = useState('');

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return auditLogs.filter(
      (log) =>
        !q ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.actorName.toLowerCase().includes(q) ||
        (log.targetUserName && log.targetUserName.toLowerCase().includes(q))
    );
  }, [auditLogs, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration · Audit Logs"
        title="Workspace audit trail"
        description="Chronological record of data exports, notifications, content updates, and parameter edits."
      />

      <div className="rounded-[16px] bg-[var(--surface-teal)]/75 px-4 py-3 flex items-start gap-2.5 text-xs text-[var(--teal-strong)]">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Privacy guarantee: Audit entries log action types, timestamps, and categories only—private journal prose is never stored in audit logs.
        </span>
      </div>

      <section className="rounded-[20px] bg-[var(--surface-main)] border border-[var(--border-subtle)] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
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
          <span className="text-xs text-[var(--text-muted)] tabular-nums">
            {filteredLogs.length} {filteredLogs.length === 1 ? 'event' : 'events'}
          </span>
        </div>

        <div className="divide-y divide-[var(--border-subtle)]">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--text-secondary)]">
              <ClipboardList className="w-7 h-7 text-[var(--text-muted)] mx-auto mb-2" />
              No matching audit log events.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-[var(--blue-strong)]">{log.action}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[var(--text-primary)]">{log.actorName}</span>
                    {log.targetUserName && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[var(--lavender-strong)]">
                          Target: {log.targetUserName}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{log.details}</p>
                </div>

                <span className="text-xs text-[var(--text-muted)] tabular-nums shrink-0">
                  {new Date(log.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
