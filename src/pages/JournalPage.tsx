import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Check,
  Edit3,
  PenLine,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { AffirmationCard } from '../components/shared/AffirmationCard';
import { PageHeader } from '../components/shared/PageHeader';
import { Button, IconButton } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { LUNARA_ARTWORK } from '../lib/atmosphere';
import { countWords, formatLongDate, formatMediumDate, parseDateKey, toDateKey } from '../lib/date';
import { useLunara } from '../providers/LunaraProvider';

const JOURNAL_IMAGE = LUNARA_ARTWORK.journalBotanical;

const GENTLE_PROMPTS = [
  'What lingered with you today, even briefly?',
  'Something you noticed when you slowed down.',
  'A conversation, scene, or small detail worth keeping.',
  'What feels lighter or clearer right now?',
];

type ViewMode = 'browse' | 'read' | 'edit';

export const JournalPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { journals, saveJournal, deleteJournal, reflectionPrompts, dailyWisdom, showToast } =
    useLunara();

  const [mode, setMode] = useState<ViewMode>('browse');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string>('all');
  const [imgError, setImgError] = useState(false);

  // Editor state
  const [draftId, setDraftId] = useState<string | undefined>(undefined);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDate, setDraftDate] = useState(toDateKey());
  const [draftContent, setDraftContent] = useState('');
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [editorError, setEditorError] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [promptIndex, setPromptIndex] = useState(0);
  const [customPromptOverride, setCustomPromptOverride] = useState<string | null>(null);

  const availablePrompts = useMemo(() => {
    const managed = reflectionPrompts
      .filter((p) => p.active && (p.placement === 'journal' || p.placement === 'both'))
      .map((p) => p.text);
    const wisdomQ = dailyWisdom?.reflectionPrompt ? [dailyWisdom.reflectionPrompt] : [];
    const merged = Array.from(new Set([...wisdomQ, ...managed, ...GENTLE_PROMPTS]));
    return merged;
  }, [reflectionPrompts, dailyWisdom]);

  const activePrompt =
    customPromptOverride || availablePrompts[promptIndex % availablePrompts.length];

  const startNewEntry = (dateOverride?: string) => {
    setDraftId(undefined);
    setDraftTitle('');
    setDraftDate(dateOverride || toDateKey());
    setDraftContent('');
    setDraftTags([]);
    setTagInput('');
    setEditorError('');
    setMode('edit');
  };

  const startEditEntry = (entryId: string) => {
    const found = journals.find((j) => j.id === entryId);
    if (!found) return;
    setDraftId(found.id);
    setDraftTitle(found.title);
    setDraftDate(found.date);
    setDraftContent(found.content);
    setDraftTags(found.tags);
    setTagInput('');
    setEditorError('');
    setSelectedId(found.id);
    setMode('edit');
  };

  useEffect(() => {
    const entryParam = searchParams.get('entry');
    const isNew = searchParams.get('new');
    const dateParam = searchParams.get('date');
    const promptParam = searchParams.get('prompt');

    if (isNew === '1') {
      setCustomPromptOverride(promptParam || null);
      startNewEntry(dateParam || undefined);
      setSearchParams({}, { replace: true });
      return;
    }

    if (entryParam) {
      const exists = journals.find((j) => j.id === entryParam);
      if (exists) {
        setSelectedId(exists.id);
        setMode('read');
      }
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    journals.forEach((j) => j.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [journals]);

  const filteredJournals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return journals.filter((entry) => {
      const matchesTag = activeTag === 'all' || entry.tags.includes(activeTag);
      const matchesQuery =
        !q ||
        entry.title.toLowerCase().includes(q) ||
        entry.content.toLowerCase().includes(q) ||
        entry.tags.some((t) => t.toLowerCase().includes(q));
      return matchesTag && matchesQuery;
    });
  }, [journals, searchQuery, activeTag]);

  const groupedJournals = useMemo(() => {
    const groups: Array<{ monthLabel: string; entries: typeof filteredJournals }> = [];
    filteredJournals.forEach((entry) => {
      const monthLabel = parseDateKey(entry.date).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
      const existingGroup = groups.find((g) => g.monthLabel === monthLabel);
      if (existingGroup) {
        existingGroup.entries.push(entry);
      } else {
        groups.push({ monthLabel, entries: [entry] });
      }
    });
    return groups;
  }, [filteredJournals]);

  const selectedEntry = useMemo(
    () => journals.find((j) => j.id === selectedId) || filteredJournals[0] || null,
    [journals, selectedId, filteredJournals]
  );

  const handleAddDraftTag = () => {
    const clean = tagInput.trim();
    if (!clean) return;
    if (!draftTags.includes(clean)) {
      setDraftTags((prev) => [...prev, clean]);
    }
    setTagInput('');
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle.trim() && !draftContent.trim()) {
      setEditorError('Write a few words or add a title before saving your entry.');
      return;
    }
    try {
      const saved = await saveJournal({
        id: draftId,
        date: draftDate,
        title: draftTitle.trim() || 'Untitled reflection',
        content: draftContent.trim(),
        tags: draftTags,
      });
      setSelectedId(saved.id);
      setMode('read');
      showToast(draftId ? 'Journal entry updated.' : 'Journal entry saved.', 'rose');
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : 'Could not save your journal entry.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteJournal(deleteTargetId);
      if (selectedId === deleteTargetId) {
        setSelectedId(null);
        setMode('browse');
      }
      setDeleteTargetId(null);
      showToast('Journal entry deleted.', 'lavender');
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : 'Could not delete your journal entry.');
      setDeleteTargetId(null);
    }
  };

  if (journals.length === 0 && mode !== 'edit') {
    return (
      <div>
        <PageHeader
          eyebrow="Journal"
          title="Your personal pages"
          description="A quiet, unhurried writing space for thoughts you want to hold onto."
          artwork={LUNARA_ARTWORK.journalBotanical}
        />

        <section className="rounded-[28px] bg-[var(--surface-rose)] p-6 sm:p-10 shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <span className="text-xs font-medium text-[var(--rose-strong)]">
                Begin when ready
              </span>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-medium text-[var(--text-primary)] leading-snug">
                Write for yourself, with no audience and no rules.
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-[var(--text-secondary)] max-w-xl">
                Some days call for a single sentence; others ask for a whole page. Everything you write stays private on this device.
              </p>
              <div className="mt-6">
                <Button
                  variant="rose"
                  size="lg"
                  onClick={() => startNewEntry()}
                  leftIcon={<PenLine className="w-4 h-4" />}
                >
                  Create your first entry
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5 aspect-[4/3] rounded-[22px] overflow-hidden bg-[var(--surface-main)]/60 shadow-sm">
              {!imgError ? (
                <img
                  src={JOURNAL_IMAGE}
                  alt="Open linen journal with pressed flowers"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                  <BookOpen className="w-10 h-10 text-[var(--rose-strong)]" />
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="mt-6">
          <AffirmationCard tone="lavender" compact label="Before you begin" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Journal"
        title="Personal pages"
        description="Quiet reflections, observations, and longer notes."
        artwork={LUNARA_ARTWORK.journalBotanical}
        action={
          mode !== 'edit' ? (
            <Button
              variant="rose"
              size="md"
              onClick={() => startNewEntry()}
              leftIcon={<PenLine className="w-4 h-4" />}
            >
              New entry
            </Button>
          ) : undefined
        }
      />

      {mode === 'edit' ? (
        <form
          onSubmit={handleSaveDraft}
          className="max-w-3xl mx-auto rounded-[28px] bg-[var(--surface-main)] p-6 sm:p-9 shadow-[var(--shadow-soft)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[var(--border-subtle)]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMode(selectedId ? 'read' : 'browse')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Cancel
            </Button>
            <div className="flex items-center gap-2.5">
              <input
                type="date"
                max={toDateKey()}
                value={draftDate}
                onChange={(e) => e.target.value && setDraftDate(e.target.value)}
                aria-label="Entry date"
                className="min-h-[40px] rounded-[12px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-3 text-xs font-medium text-[var(--text-primary)]"
              />
              <Button
                type="submit"
                variant="rose"
                size="sm"
                leftIcon={<Check className="w-4 h-4" />}
              >
                Save entry
              </Button>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {!draftId && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] bg-[var(--surface-rose)]/65 px-4 py-2.5 text-xs sm:text-sm text-[var(--rose-strong)]">
                <span>✍️ Prompt idea: {activePrompt}</span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomPromptOverride(null);
                    setPromptIndex((prev) => prev + 1);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Another prompt</span>
                </button>
              </div>
            )}

            <input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Give this reflection a title..."
              aria-label="Journal entry title"
              className="w-full bg-transparent font-display text-2xl sm:text-3xl font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
            />

            <textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              rows={12}
              placeholder="Start wherever your thoughts are right now..."
              aria-label="Journal entry writing area"
              className="w-full min-h-[260px] rounded-[18px] bg-[var(--surface-rose)]/45 border border-[var(--border-subtle)] p-4 sm:p-5 text-base leading-[1.7] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-2 focus:outline-[#D99EBB]"
            />

            {/* Optional tags */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                Optional themes or tags
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {draftTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setDraftTags((prev) => prev.filter((t) => t !== tag))}
                    className="inline-flex items-center gap-1.5 min-h-[34px] px-3 rounded-[10px] bg-[var(--surface-rose)] text-xs font-medium text-[var(--rose-strong)] cursor-pointer hover:opacity-85"
                  >
                    <span>{tag}</span>
                    <X className="w-3 h-3" />
                  </button>
                ))}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDraftTag();
                      }
                    }}
                    placeholder="Add tag..."
                    aria-label="Add journal tag"
                    className="min-h-[38px] w-36 rounded-[10px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-3 text-xs text-[var(--text-primary)] focus:outline-2 focus:outline-[#D99EBB]"
                  />
                  <IconButton label="Add tag" variant="surface" size="sm" onClick={handleAddDraftTag}>
                    <Plus className="w-3.5 h-3.5" />
                  </IconButton>
                </div>
              </div>
            </div>

            {editorError && (
              <p role="alert" className="text-sm text-[var(--coral-strong)]">
                {editorError}
              </p>
            )}

            <div className="flex items-center justify-between pt-2 text-xs text-[var(--text-muted)] tabular-nums">
              <span>{countWords(draftContent)} words</span>
              <span>Saved locally on this device</span>
            </div>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Editorial Entry Index grouped by Month */}
          <aside
            className={`lg:col-span-5 space-y-5 ${
              mode === 'read' ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* Search & Filters */}
            <div className="rounded-[22px] bg-[var(--surface-rose)] p-4 sm:p-5 space-y-3">
              <div className="relative">
                <Search
                  className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search entries..."
                  aria-label="Search journal entries"
                  className="w-full min-h-[44px] rounded-[13px] bg-[var(--surface-main)] border border-[var(--border-subtle)] pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-2 focus:outline-[#D99EBB]"
                />
              </div>

              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveTag('all')}
                    className={`min-h-[34px] px-3 rounded-[10px] text-xs font-medium transition-colors cursor-pointer ${
                      activeTag === 'all'
                        ? 'bg-[#9E6686] text-white dark:bg-[#D99EBB] dark:text-[#23151D]'
                        : 'bg-[var(--surface-main)]/75 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    All ({journals.length})
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setActiveTag(activeTag === tag ? 'all' : tag)}
                      className={`min-h-[34px] px-3 rounded-[10px] text-xs font-medium transition-colors cursor-pointer ${
                        activeTag === tag
                          ? 'bg-[#9E6686] text-white dark:bg-[#D99EBB] dark:text-[#23151D]'
                          : 'bg-[var(--surface-main)]/75 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grouped Editorial List */}
            {groupedJournals.length === 0 ? (
              <div className="rounded-[22px] bg-[var(--surface-main)] p-6 text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  No entries match that search or filter.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveTag('all');
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                {groupedJournals.map((group, gIdx) => (
                  <div key={group.monthLabel}>
                    <h3 className="px-2 mb-2 text-xs font-medium text-[var(--text-muted)]">
                      {group.monthLabel}
                    </h3>
                    <div className="rounded-[22px] bg-[var(--surface-main)] divide-y divide-[var(--border-subtle)] shadow-[var(--shadow-card)] overflow-hidden">
                      {group.entries.map((entry, idx) => {
                        const isActive = selectedEntry?.id === entry.id;
                        return (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => {
                              setSelectedId(entry.id);
                              setMode('read');
                            }}
                            className={`w-full text-left p-5 transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-[var(--surface-rose)]/70'
                                : 'hover:bg-[var(--surface-secondary)]/60'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                              <span>{formatMediumDate(entry.date)}</span>
                              <span className="tabular-nums">{countWords(entry.content)} words</span>
                            </div>
                            <div
                              className={`mt-1.5 font-display font-medium text-[var(--text-primary)] leading-snug ${
                                gIdx === 0 && idx === 0 ? 'text-xl' : 'text-lg'
                              }`}
                            >
                              {entry.title}
                            </div>
                            <p className="mt-1.5 text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                              {entry.content}
                            </p>
                            {entry.tags.length > 0 && (
                              <p className="mt-2.5 text-xs text-[var(--rose-strong)]">
                                {entry.tags.join(' · ')}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>

          {/* Editorial Reading Pane */}
          <article
            className={`lg:col-span-7 rounded-[28px] bg-[var(--surface-main)] p-6 sm:p-9 shadow-[var(--shadow-card)] ${
              mode === 'browse' ? 'hidden lg:block' : 'block'
            }`}
          >
            {selectedEntry ? (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden"
                      onClick={() => setMode('browse')}
                      leftIcon={<ArrowLeft className="w-4 h-4" />}
                    >
                      All entries
                    </Button>
                    <span className="text-xs sm:text-sm text-[var(--text-muted)]">
                      {formatLongDate(selectedEntry.date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditEntry(selectedEntry.id)}
                      leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                    >
                      Edit
                    </Button>
                    <IconButton
                      label="Delete entry"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTargetId(selectedEntry.id)}
                    >
                      <Trash2 className="w-4 h-4 text-[var(--coral-strong)]" />
                    </IconButton>
                  </div>
                </div>

                <h2 className="mt-6 font-display text-2xl sm:text-3xl font-medium text-[var(--text-primary)] leading-tight">
                  {selectedEntry.title}
                </h2>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                  <span className="tabular-nums">{countWords(selectedEntry.content)} words</span>
                  {selectedEntry.tags.length > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-[var(--rose-strong)]">
                        {selectedEntry.tags.join(' · ')}
                      </span>
                    </>
                  )}
                </div>

                <div className="mt-7 max-w-[65ch] text-base sm:text-[17px] leading-[1.75] text-[var(--text-primary)] whitespace-pre-line">
                  {selectedEntry.content}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-[var(--text-secondary)]">
                Select a journal entry to read, or start a new page.
              </div>
            )}
          </article>
        </div>
      )}

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="Delete this journal entry?"
        description="This will permanently remove the entry from this device."
        confirmLabel="Delete entry"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
