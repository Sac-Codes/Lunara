import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Download, FileCode, FileSpreadsheet, FileText, ShieldAlert } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/Button';
import { useLunara } from '../../providers/LunaraProvider';

type ExportFormat = 'json' | 'csv' | 'html';

function escapeCsvCell(value: unknown): string {
  const raw = String(value ?? '');
  // Guard spreadsheets against formula injection
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const AdminExportPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { adminUsers, appendAuditLog, showToast } = useLunara();

  const initialUserId = searchParams.get('userId') || adminUsers[0]?.id || '';
  const [selectedUserId, setSelectedUserId] = useState<string>(initialUserId);
  const [format, setFormat] = useState<ExportFormat>('json');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [cats, setCats] = useState({
    profile: true,
    checkIns: true,
    metrics: true,
    likesDislikes: true,
    journals: false,
    activitySummary: true,
    calendarSummary: false,
  });

  const [journalConfirmed, setJournalConfirmed] = useState(false);

  const selectedUser = useMemo(
    () => adminUsers.find((u) => u.id === selectedUserId) || adminUsers[0],
    [adminUsers, selectedUserId]
  );

  const filteredData = useMemo(() => {
    if (!selectedUser) return { checkIns: [], journals: [] };
    const inRange = (date: string) => {
      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;
      return true;
    };
    return {
      checkIns: (selectedUser.checkIns || []).filter((c) => inRange(c.date)),
      journals: (selectedUser.journals || []).filter((j) => inRange(j.date)),
    };
  }, [selectedUser, startDate, endDate]);

  const anyCategorySelected = Object.values(cats).some(Boolean);
  const blockedByJournalConfirm = cats.journals && !journalConfirmed;

  const toggleCat = (key: keyof typeof cats) => {
    setCats((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (key === 'journals' && !next.journals) setJournalConfirmed(false);
      return next;
    });
  };

  const handleDownload = () => {
    if (!selectedUser || !anyCategorySelected || blockedByJournalConfirm) return;

    const stamp = new Date().toISOString().slice(0, 10);
    const filenameBase = `lunara_user_export_${stamp}`;
    const includedCategories = Object.entries(cats)
      .filter(([, v]) => v)
      .map(([k]) => k);

    const checkInPayload = filteredData.checkIns.map((c) => ({
      date: c.date,
      ...(cats.checkIns ? { mood: c.mood, notes: c.notes } : {}),
      ...(cats.metrics ? { happiness: c.happiness, energy: c.energy, stress: c.stress } : {}),
      ...(cats.likesDislikes ? { likes: c.likes, dislikes: c.dislikes } : {}),
    }));

    const payload: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      prototypeNotice: 'Simulated prototype user export generated from Lunara Admin.',
      dateRange: { startDate: startDate || 'all', endDate: endDate || 'all' },
      ...(cats.profile
        ? {
            profile: {
              id: selectedUser.id,
              name: selectedUser.name,
              email: selectedUser.email,
              role: selectedUser.role,
              status: selectedUser.status,
              joinedDate: selectedUser.joinedDate,
              preferredWindow: selectedUser.preferredWindow || 'anytime',
            },
          }
        : {}),
      ...(cats.activitySummary
        ? {
            activitySummary: {
              totalCheckIns: filteredData.checkIns.length,
              totalJournals: filteredData.journals.length,
            },
          }
        : {}),
      ...(cats.calendarSummary
        ? {
            calendarDates: {
              checkInDates: filteredData.checkIns.map((c) => c.date),
              journalDates: filteredData.journals.map((j) => j.date),
            },
          }
        : {}),
      ...(cats.checkIns || cats.metrics || cats.likesDislikes ? { checkIns: checkInPayload } : {}),
      ...(cats.journals ? { journals: filteredData.journals } : {}),
    };

    let content = '';
    let mime = 'application/json';
    let ext = 'json';

    if (format === 'json') {
      content = JSON.stringify(payload, null, 2);
    } else if (format === 'csv') {
      mime = 'text/csv;charset=utf-8';
      ext = 'csv';
      const rows: string[] = [
        ['RecordType', 'Date', 'TitleOrMood', 'Happiness', 'Energy', 'Stress', 'DetailsOrNotes']
          .map(escapeCsvCell)
          .join(','),
      ];
      if (cats.profile) {
        rows.push(
          [
            'Profile',
            selectedUser.joinedDate,
            selectedUser.name,
            '',
            '',
            '',
            `${selectedUser.email} (${selectedUser.role}, ${selectedUser.status})`,
          ]
            .map(escapeCsvCell)
            .join(',')
        );
      }
      if (cats.checkIns || cats.metrics || cats.likesDislikes) {
        filteredData.checkIns.forEach((c) => {
          rows.push(
            [
              'Check-in',
              c.date,
              cats.checkIns ? c.mood || '' : '',
              cats.metrics ? c.happiness ?? '' : '',
              cats.metrics ? c.energy ?? '' : '',
              cats.metrics ? c.stress ?? '' : '',
              [
                cats.checkIns ? c.notes : '',
                cats.likesDislikes && c.likes.length ? `Likes: ${c.likes.join('; ')}` : '',
                cats.likesDislikes && c.dislikes.length ? `Dislikes: ${c.dislikes.join('; ')}` : '',
              ]
                .filter(Boolean)
                .join(' | '),
            ]
              .map(escapeCsvCell)
              .join(',')
          );
        });
      }
      if (cats.journals) {
        filteredData.journals.forEach((j) => {
          rows.push(
            ['Journal', j.date, j.title, '', '', '', j.content].map(escapeCsvCell).join(',')
          );
        });
      }
      content = rows.join('\n');
    } else {
      mime = 'text/html;charset=utf-8';
      ext = 'html';
      content = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><title>Lunara Export - ${escapeHtml(selectedUser.name)}</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;max-width:780px;margin:40px auto;padding:0 20px;color:#1d1924;line-height:1.6}h1,h2{font-weight:600}section{margin:24px 0;padding:16px;border:1px solid #e5dfeb;border-radius:12px}.meta{color:#665f70;font-size:13px}</style>
</head>
<body>
<h1>Lunara Reflection Export</h1>
<p class="meta">Account: ${escapeHtml(selectedUser.name)} (${escapeHtml(selectedUser.email)}) · Exported ${stamp}</p>
${
  cats.checkIns || cats.metrics || cats.likesDislikes
    ? `<section><h2>Check-ins (${filteredData.checkIns.length})</h2>${filteredData.checkIns
        .map(
          (c) =>
            `<p><strong>${escapeHtml(c.date)}</strong>${cats.checkIns && c.mood ? ` · Mood: ${escapeHtml(c.mood)}` : ''}${
              cats.metrics
                ? ` · Happiness ${c.happiness ?? '-'} / Energy ${c.energy ?? '-'} / Stress ${c.stress ?? '-'}`
                : ''
            }${cats.checkIns && c.notes ? `<br/>${escapeHtml(c.notes)}` : ''}</p>`
        )
        .join('')}</section>`
    : ''
}
${
  cats.journals
    ? `<section><h2>Journal Entries (${filteredData.journals.length})</h2>${filteredData.journals
        .map(
          (j) =>
            `<article><h3>${escapeHtml(j.title)} (${escapeHtml(j.date)})</h3><p>${escapeHtml(j.content)}</p></article>`
        )
        .join('')}</section>`
    : ''
}
</body></html>`;
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenameBase}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);

    // Log audit event WITHOUT any journal prose
    appendAuditLog(
      'Exported User Data',
      `Exported ${format.toUpperCase()} (${includedCategories.join(', ')}) for prototype user.`,
      selectedUser.name
    );
    showToast(`Downloaded ${filenameBase}.${ext}.`, 'teal');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration · Export"
        title="Safeguarded data export"
        description="Select a prototype user, choose specific data categories and dates, and export responsibly with audit logging."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 rounded-[20px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-6 space-y-6">
          {/* User & Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label
                htmlFor="export-user"
                className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
              >
                Select prototype user
              </label>
              <select
                id="export-user"
                value={selectedUser?.id || ''}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full min-h-[42px] rounded-[11px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-3 text-sm text-[var(--text-primary)]"
              >
                {adminUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email}) — {u.checkIns?.length || 0} check-ins,{' '}
                    {u.journals?.length || 0} journals
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="export-start"
                className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
              >
                From date (optional)
              </label>
              <input
                id="export-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full min-h-[40px] rounded-[11px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-3 text-xs text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label
                htmlFor="export-end"
                className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
              >
                To date (optional)
              </label>
              <input
                id="export-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full min-h-[40px] rounded-[11px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-3 text-xs text-[var(--text-primary)]"
              />
            </div>

            <div className="flex items-end">
              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                >
                  Clear dates
                </Button>
              )}
            </div>
          </div>

          {/* Data Categories */}
          <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
            <div className="text-xs font-medium text-[var(--text-secondary)]">
              Data categories to include
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(
                [
                  { key: 'profile', label: 'User profile & role metadata' },
                  { key: 'checkIns', label: 'Daily check-ins (mood & notes)' },
                  { key: 'metrics', label: 'Happiness, energy & stress ratings' },
                  { key: 'likesDislikes', label: 'Likes & dislikes tags' },
                  { key: 'journals', label: 'Private journal entries (sensitive)' },
                  { key: 'activitySummary', label: 'Activity summary counts' },
                  { key: 'calendarSummary', label: 'Calendar activity dates' },
                ] as const
              ).map((item) => (
                <label
                  key={item.key}
                  className={`flex items-center gap-2.5 rounded-[12px] p-3 border text-xs sm:text-sm cursor-pointer transition-colors ${
                    cats[item.key]
                      ? 'bg-[var(--surface-blue)]/55 border-[#78A6E7]/45 text-[var(--text-primary)]'
                      : 'bg-[var(--surface-secondary)]/55 border-transparent text-[var(--text-secondary)]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={cats[item.key]}
                    onChange={() => toggleCat(item.key)}
                    className="rounded accent-[#78A6E7]"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Privacy Confirmation Safeguard when Journals included */}
          {cats.journals && (
            <div className="rounded-[16px] bg-[var(--surface-amber)] p-4 space-y-3">
              <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[var(--amber-strong)]">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Journal entries contain deeply personal reflections. Confirm you have an authorized support or user-requested reason to include them.
                </span>
              </div>
              <label className="flex items-start gap-2.5 text-xs text-[var(--text-primary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={journalConfirmed}
                  onChange={(e) => setJournalConfirmed(e.target.checked)}
                  className="mt-0.5 accent-[#9A692C]"
                />
                <span>
                  I confirm this export is authorized and will be handled confidentially (this action is recorded in Audit Logs without journal text).
                </span>
              </label>
            </div>
          )}

          {/* Format Selection */}
          <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
            <div className="text-xs font-medium text-[var(--text-secondary)]">Export format</div>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'json' as const, label: 'JSON', icon: FileCode },
                { id: 'csv' as const, label: 'CSV', icon: FileSpreadsheet },
                { id: 'html' as const, label: 'Printable HTML', icon: FileText },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = format === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormat(opt.id)}
                    className={`flex items-center justify-center gap-2 min-h-[44px] px-3 rounded-[12px] text-xs sm:text-sm font-medium border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[var(--surface-teal)] border-[#76BBAA]/50 text-[var(--teal-strong)]'
                        : 'bg-[var(--surface-secondary)] border-transparent text-[var(--text-secondary)]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[var(--text-muted)]">
              File: lunara_user_export_{new Date().toISOString().slice(0, 10)}.{format}
            </span>
            <Button
              variant="teal"
              size="md"
              disabled={!selectedUser || !anyCategorySelected || blockedByJournalConfirm}
              onClick={handleDownload}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Generate &amp; download export
            </Button>
          </div>
        </section>

        {/* Export Summary Preview */}
        <aside className="lg:col-span-5 rounded-[20px] bg-[var(--surface-blue)]/65 border border-[var(--border-subtle)] p-6 space-y-4">
          <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
            Export summary
          </h2>
          {selectedUser && (
            <div className="space-y-3 text-sm">
              <div className="rounded-[14px] bg-[var(--surface-main)] p-4">
                <div className="text-xs text-[var(--text-muted)]">Selected account</div>
                <div className="mt-1 font-medium text-[var(--text-primary)]">{selectedUser.name}</div>
                <div className="text-xs text-[var(--text-secondary)]">{selectedUser.email}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[14px] bg-[var(--surface-main)] p-4">
                  <div className="text-xs text-[var(--text-muted)]">Check-ins in range</div>
                  <div className="mt-1 font-display text-2xl font-medium tabular-nums text-[var(--text-primary)]">
                    {filteredData.checkIns.length}
                  </div>
                </div>
                <div className="rounded-[14px] bg-[var(--surface-main)] p-4">
                  <div className="text-xs text-[var(--text-muted)]">Journals in range</div>
                  <div className="mt-1 font-display text-2xl font-medium tabular-nums text-[var(--text-primary)]">
                    {cats.journals ? filteredData.journals.length : 'Excluded'}
                  </div>
                </div>
              </div>

              <div className="text-xs text-[var(--text-secondary)] space-y-1.5 pt-2">
                <div className="flex items-center gap-1.5 text-[var(--teal-strong)] font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span>Audit protection active</span>
                </div>
                <p>
                  Every export logs actor, timestamp, target account, and selected category names in Audit Logs—never private journal content.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
