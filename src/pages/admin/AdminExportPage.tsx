import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Download, FileCode, FileSpreadsheet, FileText, ShieldAlert } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/Button';
import { useLunara } from '../../providers/LunaraProvider';
import {
  adminService,
  type AdminExportCategory,
  type AdminUserRecords,
  type AdminPreparedExport,
} from '../../services/adminService';

type ExportFormat = 'json' | 'csv' | 'html';
type ExportRecordsState =
  | { userId: string; status: 'loading' }
  | { userId: string; status: 'error'; message: string }
  | { userId: string; status: 'loaded'; data: AdminUserRecords };

function escapeCsvCell(value: unknown): string {
  const raw = String(value ?? '');
  // Guard spreadsheets against formula injection
  const safe = /^[\t\r ]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
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
  const {
    dataMode,
    adminUsers,
    adminUserCount,
    adminUsersLoading,
    adminUsersError,
    appendAuditLog,
    showToast,
  } = useLunara();

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
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [recordsRequest, setRecordsRequest] = useState(0);
  const [recordsState, setRecordsState] = useState<ExportRecordsState>({
    userId: '',
    status: 'loading',
  });

  useEffect(() => {
    if (adminUsers.length === 0) return;
    const requestedUserId = searchParams.get('userId');
    if (requestedUserId && selectedUserId === requestedUserId) {
      return;
    }
    if (!requestedUserId && !adminUsers.some((user) => user.id === selectedUserId)) {
      setSelectedUserId(adminUsers[0].id);
    }
  }, [adminUsers, searchParams, selectedUserId]);

  const selectedUser = useMemo(
    () => adminUsers.find((u) => u.id === selectedUserId),
    [adminUsers, selectedUserId]
  );
  const targetUserId = selectedUser?.id;

  useEffect(() => {
    if (!targetUserId) return;

    let active = true;
    if (dataMode !== 'authenticated' && selectedUser) {
      setRecordsState({
        userId: targetUserId,
        status: 'loaded',
        data: {
          checkIns: (selectedUser.checkIns ?? []).map((entry) => ({
            ...entry,
            createdAt: entry.updatedAt,
          })),
          journals: selectedUser.journals ?? [],
          profile: null,
          role: null,
          preferences: null,
        },
      });
      return () => {
        active = false;
      };
    }

    setRecordsState({ userId: targetUserId, status: 'loading' });

    void adminService.getUserRecords(targetUserId).then((result) => {
      if (!active) return;
      if (result.ok) {
        setRecordsState({ userId: targetUserId, status: 'loaded', data: result.data });
      } else {
        setRecordsState({
          userId: targetUserId,
          status: 'error',
          message: result.error.message,
        });
      }
    }).catch(() => {
      if (!active) return;
      setRecordsState({
        userId: targetUserId,
        status: 'error',
        message: 'Records could not be loaded. Please try again.',
      });
    });

    return () => {
      active = false;
    };
  }, [dataMode, targetUserId, selectedUser, recordsRequest]);

  const currentRecordsState =
    !targetUserId
      ? { status: 'idle' as const }
      : recordsState.userId === targetUserId
        ? recordsState
        : { userId: targetUserId, status: 'loading' as const };
  const recordsLoaded = currentRecordsState.status === 'loaded';
  const userRecords = recordsLoaded ? currentRecordsState.data : { checkIns: [], journals: [] };

  const filteredData = useMemo(() => {
    if (!selectedUser) return { checkIns: [], journals: [] };
    const inRange = (date: string) => {
      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;
      return true;
    };
    return {
      checkIns: userRecords.checkIns.filter((c) => inRange(c.date)),
      journals: userRecords.journals.filter((j) => inRange(j.date)),
    };
  }, [selectedUser, startDate, endDate, userRecords]);

  const anyCategorySelected = Object.values(cats).some(Boolean);
  const blockedByJournalConfirm = cats.journals && !journalConfirmed;

  const toggleCat = (key: keyof typeof cats) => {
    setCats((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (key === 'journals' && !next.journals) setJournalConfirmed(false);
      return next;
    });
  };

  const handleDownload = async () => {
    if (!selectedUser || !recordsLoaded || !anyCategorySelected || blockedByJournalConfirm) return;
    setExporting(true);
    setExportError(null);

    try {
      const includedCategories = (Object.keys(cats) as AdminExportCategory[])
        .filter((category) => cats[category]);
      let preparedExport: AdminPreparedExport | null = null;
      if (dataMode === 'authenticated') {
        const result = await adminService.prepareUserExport({
          targetUserId: selectedUser.id,
          format,
          categories: includedCategories,
          startDate: startDate || null,
          endDate: endDate || null,
          confirmJournals: journalConfirmed,
        });
        if (!result.ok) throw new Error(result.error.message);
        preparedExport = result.data;
        if (
          (cats.profile && !preparedExport.profile) ||
          (cats.activitySummary && !preparedExport.activitySummary) ||
          (cats.calendarSummary && !preparedExport.calendarDates)
        ) {
          throw new Error('The secure export response was incomplete. No download was produced.');
        }
      }

      const preparedCheckIns = preparedExport
        ? preparedExport.checkIns.map((entry) => ({
            date: entry.date,
            mood: entry.mood,
            notes: entry.notes ?? '',
            activities: entry.activities ?? [],
            customActivities: entry.customActivities ?? [],
            proudOf: entry.proudOf ?? '',
            needs: entry.needs ?? [],
            tomorrowIntention: entry.tomorrowIntention ?? '',
            customValues: entry.customValues ?? {},
            happiness: entry.happiness,
            energy: entry.energy,
            stress: entry.stress,
            likes: entry.likes ?? [],
            dislikes: entry.dislikes ?? [],
          }))
        : filteredData.checkIns;
      const exportFilteredData = {
        checkIns: preparedCheckIns,
        journals: preparedExport ? preparedExport.journals : filteredData.journals,
      };
      const exportRecordsState = preparedExport
        ? {
            status: 'loaded' as const,
            data: {
              profile: preparedExport.profile
                ? {
                    display_name: preparedExport.profile.displayName,
                    created_at: preparedExport.profile.createdAt,
                    preferred_check_in_time: preparedExport.profile.preferredCheckInTime,
                  }
                : null,
              role: preparedExport.profile?.role ?? null,
              preferences: preparedExport.preferences,
            },
          }
        : currentRecordsState;
      const activitySummary = preparedExport?.activitySummary ?? {
        totalCheckIns: exportFilteredData.checkIns.length,
        totalJournals: exportFilteredData.journals.length,
      };
      const calendarDates = preparedExport?.calendarDates ?? {
        checkInDates: exportFilteredData.checkIns.map((entry) => entry.date),
        journalDates: exportFilteredData.journals.map((entry) => entry.date),
      };
      const stamp = new Date().toISOString().slice(0, 10);
      const filenameBase = `lunara_user_export_${stamp}`;

      const checkInPayload = exportFilteredData.checkIns.map((c) => ({
      date: c.date,
      ...(cats.checkIns
        ? {
            mood: c.mood,
            notes: c.notes,
            activities: c.activities ?? [],
            customActivities: c.customActivities ?? [],
            proudOf: c.proudOf ?? '',
            needs: c.needs ?? [],
            tomorrowIntention: c.tomorrowIntention ?? '',
            customValues: c.customValues ?? {},
          }
        : {}),
      ...(cats.metrics ? { happiness: c.happiness, energy: c.energy, stress: c.stress } : {}),
      ...(cats.likesDislikes ? { likes: c.likes, dislikes: c.dislikes } : {}),
    }));

      const payload: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      source: dataMode === 'authenticated' ? 'Lunara Supabase' : 'Lunara Preview Mode',
      dateRange: { startDate: startDate || 'all', endDate: endDate || 'all' },
      ...(cats.profile
        ? {
            profile: {
              id: selectedUser.id,
              displayName: exportRecordsState.status === 'loaded'
                ? exportRecordsState.data.profile?.display_name || selectedUser.name
                : selectedUser.name,
              role: exportRecordsState.status === 'loaded'
                ? exportRecordsState.data.role ?? selectedUser.role
                : selectedUser.role,
              createdAt: exportRecordsState.status === 'loaded'
                ? exportRecordsState.data.profile?.created_at ?? null
                : selectedUser.joinedDate,
              preferredCheckInTime: exportRecordsState.status === 'loaded'
                ? (exportRecordsState.data.profile?.preferred_check_in_time ?? selectedUser.preferredWindow ?? null)
                : selectedUser.preferredWindow || 'anytime',
            },
          }
        : {}),
      ...(cats.profile
        ? {
            preferences: exportRecordsState.status === 'loaded'
              ? exportRecordsState.data.preferences
              : null,
          }
        : {}),
      ...(cats.activitySummary
        ? {
            activitySummary: {
              totalCheckIns: activitySummary.totalCheckIns,
              totalJournals: activitySummary.totalJournals,
            },
          }
        : {}),
      ...(cats.calendarSummary
        ? {
            calendarDates: {
              checkInDates: calendarDates.checkInDates,
              journalDates: calendarDates.journalDates,
            },
          }
        : {}),
      ...(cats.checkIns || cats.metrics || cats.likesDislikes ? { checkIns: checkInPayload } : {}),
      ...(cats.journals ? { journals: exportFilteredData.journals } : {}),
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
        ['RecordType', 'Date', 'TitleOrMood', 'Happiness', 'Energy', 'Stress', 'DetailsOrNotes', 'AdditionalData']
          .map(escapeCsvCell)
          .join(','),
      ];
      if (cats.profile) {
        rows.push(
          [
            'Profile',
            exportRecordsState.status === 'loaded'
              ? exportRecordsState.data.profile?.created_at ?? ''
              : selectedUser.joinedDate,
            exportRecordsState.status === 'loaded'
              ? exportRecordsState.data.profile?.display_name || selectedUser.name
              : selectedUser.name,
            '',
            '',
            '',
            '',
            JSON.stringify({
              role: exportRecordsState.status === 'loaded'
                ? exportRecordsState.data.role ?? selectedUser.role
                : selectedUser.role,
              preferredCheckInTime: exportRecordsState.status === 'loaded'
                ? exportRecordsState.data.profile?.preferred_check_in_time ?? selectedUser.preferredWindow ?? null
                : selectedUser.preferredWindow ?? null,
              preferences: exportRecordsState.status === 'loaded'
                ? exportRecordsState.data.preferences
                : null,
            }),
          ]
            .map(escapeCsvCell)
            .join(',')
        );
      }
      if (cats.activitySummary) {
        rows.push([
          'Activity summary',
          '',
          '',
          '',
          '',
          '',
          `Check-ins: ${activitySummary.totalCheckIns}; journals: ${activitySummary.totalJournals}`,
          '',
        ].map(escapeCsvCell).join(','));
      }
      if (cats.calendarSummary) {
        rows.push([
          'Calendar dates',
          '',
          '',
          '',
          '',
          '',
          `Check-in dates: ${calendarDates.checkInDates.join('; ')}; Journal dates: ${calendarDates.journalDates.join('; ')}`,
          '',
        ].map(escapeCsvCell).join(','));
      }
      if (cats.checkIns || cats.metrics || cats.likesDislikes) {
        exportFilteredData.checkIns.forEach((c) => {
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
              cats.checkIns
              ? JSON.stringify({
                  activities: c.activities ?? [],
                  customActivities: c.customActivities ?? [],
                  proudOf: c.proudOf ?? '',
                  needs: c.needs ?? [],
                  tomorrowIntention: c.tomorrowIntention ?? '',
                  customValues: c.customValues ?? {},
                })
              : '',
            ]
              .map(escapeCsvCell)
              .join(',')
          );
        });
      }
      if (cats.journals) {
        exportFilteredData.journals.forEach((j) => {
          rows.push(
            ['Journal', j.date, j.title, '', '', '', j.content, ''].map(escapeCsvCell).join(',')
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
<p class="meta">Account: ${escapeHtml(selectedUser.name)} (${escapeHtml(selectedUser.role)}) · Date range: ${escapeHtml(startDate || 'all')} to ${escapeHtml(endDate || 'all')} · Exported ${stamp}</p>
${
  cats.profile
    ? `<section><h2>Account profile &amp; preferences</h2><p><strong>Name:</strong> ${escapeHtml(exportRecordsState.status === 'loaded' ? exportRecordsState.data.profile?.display_name || selectedUser.name : selectedUser.name)}</p><p><strong>Role:</strong> ${escapeHtml(String(exportRecordsState.status === 'loaded' ? exportRecordsState.data.role ?? selectedUser.role : selectedUser.role))}</p><p><strong>Joined:</strong> ${escapeHtml(exportRecordsState.status === 'loaded' ? exportRecordsState.data.profile?.created_at ?? '' : selectedUser.joinedDate)}</p><p><strong>Preferred check-in time:</strong> ${escapeHtml(String(exportRecordsState.status === 'loaded' ? exportRecordsState.data.profile?.preferred_check_in_time ?? selectedUser.preferredWindow ?? 'Unavailable' : selectedUser.preferredWindow || 'anytime'))}</p><p><strong>Preferences:</strong> ${escapeHtml(JSON.stringify(exportRecordsState.status === 'loaded' ? exportRecordsState.data.preferences : null))}</p></section>`
    : ''
}
${
  cats.activitySummary
    ? `<section><h2>Activity summary</h2><p>${activitySummary.totalCheckIns} check-ins · ${activitySummary.totalJournals} journal entries</p></section>`
    : ''
}
${
  cats.calendarSummary
    ? `<section><h2>Calendar dates</h2><p>Check-ins: ${escapeHtml(calendarDates.checkInDates.join(', ') || 'None')}</p><p>Journal entries: ${escapeHtml(calendarDates.journalDates.join(', ') || 'None')}</p></section>`
    : ''
}
${
  cats.checkIns || cats.metrics || cats.likesDislikes
    ? `<section><h2>Check-ins (${exportFilteredData.checkIns.length})</h2>${exportFilteredData.checkIns
      .map((c) => {
        const extraDetails = [
          cats.checkIns && c.activities?.length
            ? `Activities: ${escapeHtml(c.activities.join(', '))}`
            : '',
          cats.checkIns && c.customActivities?.length
            ? `Custom activities: ${escapeHtml(c.customActivities.join(', '))}`
            : '',
          cats.checkIns && c.proudOf ? `Proud of: ${escapeHtml(c.proudOf)}` : '',
          cats.checkIns && c.needs?.length ? `Needs: ${escapeHtml(c.needs.join(', '))}` : '',
          cats.checkIns && c.tomorrowIntention
            ? `Tomorrow’s intention: ${escapeHtml(c.tomorrowIntention)}`
            : '',
          cats.checkIns && c.customValues && Object.keys(c.customValues).length
            ? `Custom values: ${escapeHtml(JSON.stringify(c.customValues))}`
            : '',
          cats.likesDislikes && c.likes.length
            ? `Likes: ${escapeHtml(c.likes.join(', '))}`
            : '',
          cats.likesDislikes && c.dislikes.length
            ? `Dislikes: ${escapeHtml(c.dislikes.join(', '))}`
            : '',
        ].filter(Boolean);
        return `<p><strong>${escapeHtml(c.date)}</strong>${cats.checkIns && c.mood ? ` · Mood: ${escapeHtml(c.mood)}` : ''}${
          cats.metrics
            ? ` · Happiness ${c.happiness ?? '-'} / Energy ${c.energy ?? '-'} / Stress ${c.stress ?? '-'}`
            : ''
        }${cats.checkIns && c.notes ? `<br/>${escapeHtml(c.notes)}` : ''}${
          extraDetails.length ? `<br/>${extraDetails.join('<br/>')}` : ''
        }</p>`;
      })
        .join('')}</section>`
    : ''
}
${
  cats.journals
    ? `<section><h2>Journal Entries (${exportFilteredData.journals.length})</h2>${exportFilteredData.journals
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

    if (dataMode !== 'authenticated') {
      appendAuditLog(
        'Exported User Data',
        `Exported ${format.toUpperCase()} (${includedCategories.join(', ')}) for selected account.`,
        selectedUser.name
      );
    }
    showToast(`Downloaded ${filenameBase}.${ext}.`, 'teal');
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Export blocked because the secure audit/export operation failed. No download was produced.';
      setExportError(message);
      showToast('Export failed; no download was produced.', 'amber');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration · Export"
        title="Safeguarded data export"
        description="Select a user, choose specific data categories and dates, and export their records responsibly."
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
                Select user
              </label>
              <select
                id="export-user"
                value={selectedUser?.id || ''}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full min-h-[42px] rounded-[11px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-3 text-sm text-[var(--text-primary)]"
              >
                <option value="" disabled>
                  {adminUsersLoading ? 'Loading accounts…' : 'Select a user…'}
                </option>
                {adminUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
              {searchParams.get('userId') && !selectedUser && (
                <p role={adminUsersError ? 'alert' : 'status'} className="mt-2 text-xs text-[var(--text-secondary)]">
                  {adminUsersError
                    ? adminUsersError
                    : adminUsersLoading
                      ? 'Resolving the selected account…'
                      : adminUsers.length < adminUserCount
                        ? 'The selected account is outside the latest 500 directory entries. Export is disabled because this account is not loaded.'
                        : 'The selected account is not in the Admin directory.'}
                </p>
              )}
            </div>

            {currentRecordsState.status === 'loading' && (
              <p role="status" aria-live="polite" className="sm:col-span-3 text-sm text-[var(--text-secondary)]">
                Loading selected user’s records…
              </p>
            )}
            {currentRecordsState.status === 'error' && (
              <div role="alert" className="sm:col-span-3 flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-[var(--surface-amber)] p-3">
                <p className="text-sm text-[var(--text-primary)]">{currentRecordsState.message}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setRecordsRequest((request) => request + 1)}
                >
                  Retry
                </Button>
              </div>
            )}

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
                  { key: 'profile', label: 'User profile, role & preferences' },
                  { key: 'checkIns', label: 'Daily check-ins and reflection details' },
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
                  I confirm this export is authorized and will be handled confidentially.
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
              disabled={!selectedUser || !recordsLoaded || !anyCategorySelected || blockedByJournalConfirm || exporting}
              loading={exporting}
              onClick={() => void handleDownload()}
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
                <div className="text-xs text-[var(--text-secondary)]">{selectedUser.email || 'Email unavailable'}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[14px] bg-[var(--surface-main)] p-4">
                  <div className="text-xs text-[var(--text-muted)]">Check-ins in range</div>
                  <div className="mt-1 font-display text-2xl font-medium tabular-nums text-[var(--text-primary)]">
                    {recordsLoaded ? filteredData.checkIns.length : '—'}
                  </div>
                </div>
                <div className="rounded-[14px] bg-[var(--surface-main)] p-4">
                  <div className="text-xs text-[var(--text-muted)]">Journals in range</div>
                  <div className="mt-1 font-display text-2xl font-medium tabular-nums text-[var(--text-primary)]">
                    {cats.journals
                      ? recordsLoaded
                        ? filteredData.journals.length
                        : '—'
                      : 'Excluded'}
                  </div>
                </div>
              </div>

              <div className="text-xs text-[var(--text-secondary)] space-y-1.5 pt-2">
                <div className="flex items-center gap-1.5 text-[var(--teal-strong)] font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span>Export privacy safeguard</span>
                </div>
                <p>
                  {dataMode === 'authenticated'
                    ? 'Export data is released only after its request is recorded; audit metadata excludes check-in and journal text.'
                    : 'Preview export actions are recorded only in local preview history.'}
                </p>
              </div>
            </div>
          )}
          {exportError && <p role="alert" className="text-sm text-[var(--amber-strong)]">{exportError}</p>}
        </aside>
      </div>
    </div>
  );
};
