import React, { useMemo, useRef, useState } from 'react';
import {
  BookMarked,
  Check,
  Edit3,
  Megaphone,
  MessageSquareHeart,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button, IconButton } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { AFFIRMATION_CATEGORIES, WISDOM_TOPICS } from '../../data/wisdomAndAffirmations';
import { useLunara } from '../../providers/LunaraProvider';
import type {
  AffirmationCategory,
  AffirmationItem,
  ReflectionPromptItem,
  WisdomEntry,
  WisdomTopic,
} from '../../types/lunara';

type ContentTab = 'affirmations' | 'wisdom' | 'prompts' | 'announcements';

export const AdminContentPage: React.FC = () => {
  const {
    affirmations,
    addAffirmation,
    updateAffirmation,
    deleteAffirmation,
    affirmationLoading,
    affirmationError,
    refreshAffirmations,
    wisdomEntries,
    addWisdom,
    updateWisdom,
    deleteWisdom,
    setDailyWisdom,
    wisdomLoading,
    wisdomError,
    refreshWisdom,
    reflectionPrompts,
    savePrompt,
    deletePrompt,
    announcements,
    publishAnnouncement,
    deleteAnnouncement,
    showToast,
  } = useLunara();

  const [tab, setTab] = useState<ContentTab>('affirmations');

  // Affirmations state
  const [affSearch, setAffSearch] = useState('');
  const [affStatusFilter, setAffStatusFilter] = useState<'all' | AffirmationItem['status']>('all');
  const [editAffId, setEditAffId] = useState<string | null>(null);
  const [affText, setAffText] = useState('');
  const [affCategory, setAffCategory] = useState<AffirmationCategory>('Calm');
  const [affStatus, setAffStatus] = useState<AffirmationItem['status']>('published');
  const [deleteAffId, setDeleteAffId] = useState<string | null>(null);
  const [affirmationMutationPending, setAffirmationMutationPending] = useState(false);
  const affirmationMutationLock = useRef(false);

  // Wisdom state
  const [wisSearch, setWisSearch] = useState('');
  const [editWisId, setEditWisId] = useState<string | null>(null);
  const [wisTitle, setWisTitle] = useState('');
  const [wisChapter, setWisChapter] = useState(2);
  const [wisVerse, setWisVerse] = useState('');
  const [wisSanskrit, setWisSanskrit] = useState('');
  const [wisTranslit, setWisTranslit] = useState('');
  const [wisMeaning, setWisMeaning] = useState('');
  const [wisLearning, setWisLearning] = useState('');
  const [wisPrompt, setWisPrompt] = useState('');
  const [wisTakeaway, setWisTakeaway] = useState('');
  const [wisTopic, setWisTopic] = useState<WisdomTopic>('Inner Balance');
  const [wisSourceNote, setWisSourceNote] = useState('');
  const [wisStatus, setWisStatus] = useState<WisdomEntry['status']>('published');
  const [wisDaily, setWisDaily] = useState(false);
  const [deleteWisId, setDeleteWisId] = useState<string | null>(null);
  const [wisdomMutationPending, setWisdomMutationPending] = useState(false);
  const wisdomMutationLock = useRef(false);

  // Prompt state
  const [promptText, setPromptText] = useState('');
  const [promptPlacement, setPromptPlacement] = useState<ReflectionPromptItem['placement']>('both');
  const [promptTopic, setPromptTopic] = useState('Clarity');

  // Announcement state
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');

  const filteredAffirmations = useMemo(() => {
    const q = affSearch.trim().toLowerCase();
    return affirmations.filter((a) => {
      if (affStatusFilter !== 'all' && a.status !== affStatusFilter) return false;
      if (!q) return true;
      return a.text.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
    });
  }, [affirmations, affSearch, affStatusFilter]);

  const filteredWisdom = useMemo(() => {
    const q = wisSearch.trim().toLowerCase();
    return wisdomEntries.filter((w) => {
      if (!q) return true;
      return (
        w.title.toLowerCase().includes(q) ||
        w.topic.toLowerCase().includes(q) ||
        `${w.chapter}:${w.verse}`.includes(q)
      );
    });
  }, [wisdomEntries, wisSearch]);

  const resetAffForm = () => {
    setEditAffId(null);
    setAffText('');
    setAffCategory('Calm');
    setAffStatus('published');
  };

  const handleSaveAffirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affText.trim() || affirmationMutationLock.current) return;
    affirmationMutationLock.current = true;
    setAffirmationMutationPending(true);
    try {
      if (editAffId) {
        await updateAffirmation(editAffId, {
          text: affText.trim(),
          category: affCategory,
          status: affStatus,
        });
        showToast('Affirmation updated.', 'lavender');
      } else {
        await addAffirmation({
          text: affText.trim(),
          category: affCategory,
          status: affStatus,
        });
        showToast('Affirmation added.', 'lavender');
      }
      resetAffForm();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Could not save the affirmation.',
        'amber'
      );
    } finally {
      affirmationMutationLock.current = false;
      setAffirmationMutationPending(false);
    }
  };

  const handleDeleteAffirmation = async () => {
    if (!deleteAffId || affirmationMutationLock.current) return;
    affirmationMutationLock.current = true;
    setAffirmationMutationPending(true);
    try {
      await deleteAffirmation(deleteAffId);
      showToast('Affirmation removed.', 'lavender');
      setDeleteAffId(null);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Could not delete the affirmation.',
        'amber'
      );
    } finally {
      affirmationMutationLock.current = false;
      setAffirmationMutationPending(false);
    }
  };

  const handleToggleAffirmationStatus = async (affirmation: AffirmationItem) => {
    if (affirmationMutationLock.current) return;
    affirmationMutationLock.current = true;
    setAffirmationMutationPending(true);
    try {
      await updateAffirmation(affirmation.id, {
        status: affirmation.status === 'published' ? 'inactive' : 'published',
      });
      showToast(
        affirmation.status === 'published' ? 'Affirmation paused.' : 'Affirmation published.',
        'lavender'
      );
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Could not update the affirmation.',
        'amber'
      );
    } finally {
      affirmationMutationLock.current = false;
      setAffirmationMutationPending(false);
    }
  };

  const resetWisForm = () => {
    setEditWisId(null);
    setWisTitle('');
    setWisChapter(2);
    setWisVerse('');
    setWisSanskrit('');
    setWisTranslit('');
    setWisMeaning('');
    setWisLearning('');
    setWisPrompt('');
    setWisTakeaway('');
    setWisTopic('Inner Balance');
    setWisSourceNote('');
    setWisStatus('published');
    setWisDaily(false);
  };

  const startEditWisdom = (w: WisdomEntry) => {
    setEditWisId(w.id);
    setWisTitle(w.title);
    setWisChapter(w.chapter);
    setWisVerse(w.verse);
    setWisSanskrit(w.sanskrit);
    setWisTranslit(w.transliteration);
    setWisMeaning(w.meaning);
    setWisLearning(w.learning);
    setWisPrompt(w.reflectionPrompt);
    setWisTakeaway(w.takeaway);
    setWisTopic(w.topic);
    setWisSourceNote(w.sourceNote);
    setWisStatus(w.status);
    setWisDaily(w.isDaily);
  };

  const handleSaveWisdom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      wisdomMutationPending ||
      wisdomMutationLock.current ||
      !wisTitle.trim() ||
      !wisVerse.trim() ||
      !wisSanskrit.trim() ||
      !wisMeaning.trim()
    ) return;

    const payload = {
      title: wisTitle.trim(),
      scripture: 'Bhagavad Gita' as const,
      chapter: Number(wisChapter) || 2,
      verse: wisVerse.trim(),
      sanskrit: wisSanskrit.trim(),
      transliteration: wisTranslit.trim(),
      meaning: wisMeaning.trim(),
      learning: wisLearning.trim() || wisMeaning.trim(),
      reflectionPrompt: wisPrompt.trim() || 'What feels worth carrying gently into today?',
      takeaway: wisTakeaway.trim() || wisTitle.trim(),
      topic: wisTopic,
      sourceNote: wisSourceNote.trim(),
      status: wisStatus,
      isFeatured: wisDaily,
      isDaily: wisDaily,
    };

    wisdomMutationLock.current = true;
    setWisdomMutationPending(true);
    try {
      if (editWisId) {
        await updateWisdom(editWisId, payload);
        showToast('Wisdom passage updated.', 'amber');
      } else {
        await addWisdom(payload);
        showToast('Wisdom passage added.', 'amber');
      }
      resetWisForm();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Could not save the wisdom passage.',
        'amber'
      );
    } finally {
      wisdomMutationLock.current = false;
      setWisdomMutationPending(false);
    }
  };

  const handleSetDailyWisdom = async (entry: WisdomEntry) => {
    if (wisdomMutationLock.current) return;
    wisdomMutationLock.current = true;
    setWisdomMutationPending(true);
    try {
      await setDailyWisdom(entry.id);
      showToast(`Set Gita ${entry.chapter}:${entry.verse} as today's featured wisdom.`, 'amber');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Could not update the featured wisdom passage.',
        'amber'
      );
    } finally {
      wisdomMutationLock.current = false;
      setWisdomMutationPending(false);
    }
  };

  const handleDeleteWisdom = async () => {
    if (!deleteWisId || wisdomMutationLock.current) return;
    wisdomMutationLock.current = true;
    setWisdomMutationPending(true);
    try {
      await deleteWisdom(deleteWisId);
      showToast('Wisdom passage deleted.', 'amber');
      setDeleteWisId(null);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Could not delete the wisdom passage.',
        'amber'
      );
    } finally {
      wisdomMutationLock.current = false;
      setWisdomMutationPending(false);
    }
  };

  const handleSavePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;
    savePrompt({
      text: promptText.trim(),
      placement: promptPlacement,
      topic: promptTopic.trim() || 'Reflection',
      active: true,
    });
    setPromptText('');
    showToast('Reflection prompt saved.', 'teal');
  };

  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;
    publishAnnouncement({
      title: annTitle.trim(),
      message: annMessage.trim(),
      category: 'announcement',
    });
    setAnnTitle('');
    setAnnMessage('');
    showToast('Announcement published and delivered to Inbox.', 'blue');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration · Content Hub"
        title="Content management"
        description="Curate Lunara's affirmations, Bhagavad Gita wisdom passages, reflection prompts, and workspace announcements."
      />

      {/* Content Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'affirmations' as const, label: `Affirmations (${affirmations.length})`, icon: Sparkles },
          { id: 'wisdom' as const, label: `Bhagavad Gita Wisdom (${wisdomEntries.length})`, icon: BookMarked },
          { id: 'prompts' as const, label: `Reflection Prompts (${reflectionPrompts.length})`, icon: MessageSquareHeart },
          { id: 'announcements' as const, label: `Announcements (${announcements.length})`, icon: Megaphone },
        ].map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 min-h-[42px] px-4 rounded-[12px] text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active
                  ? 'bg-[var(--surface-lavender)] text-[var(--lavender-strong)]'
                  : 'bg-[var(--surface-main)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: AFFIRMATIONS */}
      {tab === 'affirmations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-7 rounded-[20px] bg-[var(--surface-main)] border border-[var(--border-subtle)] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={affSearch}
                  onChange={(e) => setAffSearch(e.target.value)}
                  placeholder="Search affirmations..."
                  aria-label="Search affirmations"
                  className="w-full min-h-[38px] rounded-[10px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] pl-9 pr-3 text-xs sm:text-sm text-[var(--text-primary)]"
                />
              </div>

              <div className="flex items-center gap-1 p-1 rounded-[10px] bg-[var(--surface-secondary)]">
                {(['all', 'published', 'draft', 'inactive'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setAffStatusFilter(st)}
                    className={`min-h-[30px] px-2.5 rounded-[7px] text-xs capitalize cursor-pointer ${
                      affStatusFilter === st
                        ? 'bg-[var(--surface-main)] text-[var(--text-primary)]'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {affirmationLoading && (
              <p role="status" aria-live="polite" className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                Loading shared affirmations…
              </p>
            )}
            {affirmationError && (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[var(--surface-amber)]/45">
                <p className="text-sm text-[var(--text-primary)]">{affirmationError}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={affirmationLoading}
                  onClick={() => void refreshAffirmations()}
                >
                  Retry
                </Button>
              </div>
            )}
            {!affirmationLoading && !affirmationError && affirmations.length === 0 && (
              <p className="p-6 text-center text-sm text-[var(--text-secondary)]">
                The shared affirmations library is empty.
              </p>
            )}

            <div className="divide-y divide-[var(--border-subtle)]">
              {affirmations.length > 0 && filteredAffirmations.length === 0 && (
                <p className="p-6 text-center text-sm text-[var(--text-secondary)]">
                  No affirmations match these filters.
                </p>
              )}
              {filteredAffirmations.map((aff) => (
                <div key={aff.id} className="p-4 sm:p-5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-medium text-[var(--lavender-strong)]">
                        {aff.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          aff.status === 'published'
                            ? 'text-[var(--teal-strong)]'
                            : 'text-[var(--text-muted)]'
                        }
                      >
                        {aff.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--text-primary)] font-medium">
                      &ldquo;{aff.text}&rdquo;
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={affirmationMutationPending}
                      onClick={() => void handleToggleAffirmationStatus(aff)}
                      className="min-h-[30px] px-2.5 rounded-[8px] bg-[var(--surface-secondary)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      {aff.status === 'published' ? 'Pause' : 'Publish'}
                    </button>
                    <IconButton
                      label="Edit affirmation"
                      size="sm"
                      disabled={affirmationMutationPending}
                      onClick={() => {
                        setEditAffId(aff.id);
                        setAffText(aff.text);
                        setAffCategory(aff.category);
                        setAffStatus(aff.status);
                      }}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </IconButton>
                    <IconButton
                      label="Delete affirmation"
                      size="sm"
                      disabled={affirmationMutationPending}
                      onClick={() => setDeleteAffId(aff.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[var(--coral-strong)]" />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <form
            onSubmit={handleSaveAffirmation}
            className="lg:col-span-5 rounded-[20px] bg-[var(--surface-lavender)]/65 border border-[var(--border-subtle)] p-5 space-y-4"
          >
            <h3 className="font-display text-lg font-medium text-[var(--text-primary)]">
              {editAffId ? 'Edit affirmation' : 'Create affirmation'}
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Keep copy grounded, realistic, and free of forced positivity or guilt.
            </p>

            <div>
              <label
                htmlFor="aff-text"
                className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
              >
                Affirmation text
              </label>
              <textarea
                id="aff-text"
                required
                rows={3}
                value={affText}
                onChange={(e) => setAffText(e.target.value)}
                placeholder="e.g., You can meet today gently without fixing everything."
                className="w-full rounded-[12px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-3 text-sm text-[var(--text-primary)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="aff-cat"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
                >
                  Category
                </label>
                <select
                  id="aff-cat"
                  value={affCategory}
                  onChange={(e) => setAffCategory(e.target.value as AffirmationCategory)}
                  className="w-full min-h-[40px] rounded-[10px] bg-[var(--surface-main)] border border-[var(--border-subtle)] px-2.5 text-xs sm:text-sm text-[var(--text-primary)]"
                >
                  {AFFIRMATION_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="aff-status"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
                >
                  Status
                </label>
                <select
                  id="aff-status"
                  value={affStatus}
                  onChange={(e) => setAffStatus(e.target.value as AffirmationItem['status'])}
                  className="w-full min-h-[40px] rounded-[10px] bg-[var(--surface-main)] border border-[var(--border-subtle)] px-2.5 text-xs sm:text-sm text-[var(--text-primary)]"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {affText.trim() && (
              <div className="rounded-[14px] bg-[var(--surface-main)] p-3.5 text-xs">
                <div className="text-[var(--lavender-strong)] font-medium">{affCategory} preview</div>
                <div className="mt-1 font-display text-base text-[var(--text-primary)]">
                  &ldquo;{affText.trim()}&rdquo;
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={affirmationMutationPending}
                loading={affirmationMutationPending}
                leftIcon={<Check className="w-4 h-4" />}
              >
                {editAffId ? 'Save changes' : 'Add affirmation'}
              </Button>
              {editAffId && (
                <Button type="button" variant="ghost" size="sm" onClick={resetAffForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: BHAGAVAD GITA WISDOM */}
      {tab === 'wisdom' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-7 rounded-[20px] bg-[var(--surface-main)] border border-[var(--border-subtle)] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)]">
              <div className="relative max-w-sm">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={wisSearch}
                  onChange={(e) => setWisSearch(e.target.value)}
                  placeholder="Search Gita chapter, verse, or theme..."
                  aria-label="Search wisdom entries"
                  className="w-full min-h-[38px] rounded-[10px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] pl-9 pr-3 text-xs sm:text-sm text-[var(--text-primary)]"
                />
              </div>
            </div>

            {wisdomLoading && (
              <p role="status" aria-live="polite" className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                Loading shared wisdom…
              </p>
            )}
            {wisdomError && (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[var(--surface-amber)]/45">
                <p className="text-sm text-[var(--text-primary)]">{wisdomError}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={wisdomLoading}
                  onClick={() => void refreshWisdom()}
                >
                  Retry
                </Button>
              </div>
            )}
            {!wisdomLoading && !wisdomError && wisdomEntries.length === 0 && (
              <p className="p-6 text-center text-sm text-[var(--text-secondary)]">
                The shared wisdom library is empty.
              </p>
            )}

            <div className="divide-y divide-[var(--border-subtle)]">
              {wisdomEntries.length > 0 && filteredWisdom.length === 0 && (
                <p className="p-6 text-center text-sm text-[var(--text-secondary)]">
                  No wisdom passages match your search.
                </p>
              )}
              {filteredWisdom.map((w) => (
                <div key={w.id} className="p-4 sm:p-5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-medium text-[var(--amber-strong)]">
                        Gita {w.chapter}:{w.verse}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[var(--text-secondary)]">{w.topic}</span>
                      <span aria-hidden="true">·</span>
                      <span className={w.status === 'published' ? 'text-[var(--teal-strong)]' : 'text-[var(--text-muted)]'}>
                        {w.status}
                      </span>
                      {w.isDaily && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-[var(--lavender-strong)]">
                            Featured Daily
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={wisdomMutationPending || w.status !== 'published'}
                        onClick={() => void handleSetDailyWisdom(w)}
                        className="inline-flex items-center gap-1 min-h-[30px] px-2.5 rounded-[8px] bg-[var(--surface-amber)]/75 text-xs font-medium text-[var(--amber-strong)] cursor-pointer hover:opacity-85"
                      >
                        <Star className="w-3 h-3" />
                        <span>{w.isDaily ? 'Daily' : 'Set Daily'}</span>
                      </button>
                      <IconButton label="Edit wisdom" size="sm" disabled={wisdomMutationPending} onClick={() => startEditWisdom(w)}>
                        <Edit3 className="w-3.5 h-3.5" />
                      </IconButton>
                      <IconButton label="Delete wisdom" size="sm" disabled={wisdomMutationPending} onClick={() => setDeleteWisId(w.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-[var(--coral-strong)]" />
                      </IconButton>
                    </div>
                  </div>

                  <div className="font-display text-base font-medium text-[var(--text-primary)]">
                    {w.title}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{w.takeaway}</p>
                </div>
              ))}
            </div>
          </section>

          <form
            onSubmit={handleSaveWisdom}
            className="lg:col-span-5 rounded-[20px] bg-[var(--surface-amber)]/55 border border-[var(--border-subtle)] p-5 space-y-3"
          >
            <h3 className="font-display text-lg font-medium text-[var(--text-primary)]">
              {editWisId ? 'Edit Bhagavad Gita passage' : 'Add Bhagavad Gita passage'}
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Use only verified Sanskrit verses and accurate translations. Modern takeaways are presented as Lunara reflections.
            </p>

            <input
              type="text"
              required
              value={wisTitle}
              onChange={(e) => setWisTitle(e.target.value)}
              placeholder="Reflective title"
              className="w-full min-h-[40px] rounded-[10px] bg-[var(--surface-main)] border border-[var(--border-subtle)] px-3 text-sm text-[var(--text-primary)]"
            />

            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                min={1}
                max={18}
                required
                value={wisChapter}
                onChange={(e) => setWisChapter(Number(e.target.value))}
                placeholder="Chapter"
                aria-label="Chapter"
                className="min-h-[40px] rounded-[10px] bg-[var(--surface-main)] border border-[var(--border-subtle)] px-3 text-sm text-[var(--text-primary)]"
              />
              <input
                type="text"
                required
                value={wisVerse}
                onChange={(e) => setWisVerse(e.target.value)}
                placeholder="Verse (e.g. 47)"
                aria-label="Verse"
                className="min-h-[40px] rounded-[10px] bg-[var(--surface-main)] border border-[var(--border-subtle)] px-3 text-sm text-[var(--text-primary)]"
              />
              <select
                value={wisTopic}
                onChange={(e) => setWisTopic(e.target.value as WisdomTopic)}
                aria-label="Topic"
                className="min-h-[40px] rounded-[10px] bg-[var(--surface-main)] border border-[var(--border-subtle)] px-2 text-xs text-[var(--text-primary)]"
              >
                {WISDOM_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              required
              rows={2}
              value={wisSanskrit}
              onChange={(e) => setWisSanskrit(e.target.value)}
              placeholder="Verified Sanskrit verse (Devanagari)"
              className="w-full rounded-[10px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-2.5 text-sm text-[var(--text-primary)]"
            />
            <textarea
              rows={2}
              value={wisTranslit}
              onChange={(e) => setWisTranslit(e.target.value)}
              placeholder="Matching Roman transliteration"
              className="w-full rounded-[10px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-primary)]"
            />
            <textarea
              required
              rows={2}
              value={wisMeaning}
              onChange={(e) => setWisMeaning(e.target.value)}
              placeholder="Plain-English meaning"
              className="w-full rounded-[10px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-primary)]"
            />
            <textarea
              rows={2}
              value={wisLearning}
              onChange={(e) => setWisLearning(e.target.value)}
              placeholder="Everyday learning for reflection"
              className="w-full rounded-[10px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-primary)]"
            />
            <input
              type="text"
              value={wisPrompt}
              onChange={(e) => setWisPrompt(e.target.value)}
              placeholder="Reflection question"
              className="w-full min-h-[38px] rounded-[10px] bg-[var(--surface-main)] border border-[var(--border-subtle)] px-3 text-xs text-[var(--text-primary)]"
            />
            <input
              type="text"
              value={wisTakeaway}
              onChange={(e) => setWisTakeaway(e.target.value)}
              placeholder="Short takeaway line"
              className="w-full min-h-[38px] rounded-[10px] bg-[var(--surface-main)] border border-[var(--border-subtle)] px-3 text-xs text-[var(--text-primary)]"
            />

            <div className="flex items-center justify-between gap-3 text-xs">
              <select
                value={wisStatus}
                onChange={(e) => {
                  const status = e.target.value as WisdomEntry['status'];
                  setWisStatus(status);
                  if (status === 'draft') setWisDaily(false);
                }}
                className="min-h-[36px] rounded-[9px] bg-[var(--surface-main)] border border-[var(--border-subtle)] px-2.5 text-xs text-[var(--text-primary)]"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>

              <label className="inline-flex items-center gap-2 cursor-pointer text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={wisDaily}
                  disabled={wisStatus !== 'published'}
                  onChange={(e) => setWisDaily(e.target.checked)}
                />
                <span>Set as Daily featured</span>
              </label>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={wisdomMutationPending}
                disabled={wisdomLoading}
                leftIcon={<Check className="w-4 h-4" />}
              >
                {editWisId ? 'Save passage' : 'Add passage'}
              </Button>
              {editWisId && (
                <Button type="button" variant="ghost" size="sm" onClick={resetWisForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: REFLECTION PROMPTS */}
      {tab === 'prompts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-7 rounded-[20px] bg-[var(--surface-main)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
            {reflectionPrompts.map((p) => (
              <div key={p.id} className="p-4 sm:p-5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-[var(--teal-strong)] font-medium">
                    {p.placement} · {p.topic || 'Reflection'} · {p.active ? 'Active' : 'Paused'}
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-primary)]">{p.text}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => savePrompt({ ...p, active: !p.active })}
                    className="min-h-[30px] px-2.5 rounded-[8px] bg-[var(--surface-secondary)] text-xs text-[var(--text-secondary)] cursor-pointer"
                  >
                    {p.active ? 'Pause' : 'Enable'}
                  </button>
                  <IconButton label="Delete prompt" size="sm" onClick={() => deletePrompt(p.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-[var(--coral-strong)]" />
                  </IconButton>
                </div>
              </div>
            ))}
          </section>

          <form
            onSubmit={handleSavePrompt}
            className="lg:col-span-5 rounded-[20px] bg-[var(--surface-teal)]/65 border border-[var(--border-subtle)] p-5 space-y-3.5"
          >
            <h3 className="font-display text-lg font-medium text-[var(--text-primary)]">
              Add reflection prompt
            </h3>
            <textarea
              required
              rows={3}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g., What helped you feel even slightly more grounded today?"
              className="w-full rounded-[12px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-3 text-sm text-[var(--text-primary)]"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={promptPlacement}
                onChange={(e) =>
                  setPromptPlacement(e.target.value as ReflectionPromptItem['placement'])
                }
                className="min-h-[40px] rounded-[10px] bg-[var(--surface-main)] border border-[var(--border-subtle)] px-2.5 text-xs text-[var(--text-primary)]"
              >
                <option value="both">Check-in &amp; Journal</option>
                <option value="check-in">Check-in only</option>
                <option value="journal">Journal only</option>
              </select>
              <input
                type="text"
                value={promptTopic}
                onChange={(e) => setPromptTopic(e.target.value)}
                placeholder="Topic label"
                className="min-h-[40px] rounded-[10px] bg-[var(--surface-main)] border border-[var(--border-subtle)] px-3 text-xs text-[var(--text-primary)]"
              />
            </div>
            <Button type="submit" variant="teal" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Add prompt
            </Button>
          </form>
        </div>
      )}

      {/* TAB 4: ANNOUNCEMENTS */}
      {tab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-7 rounded-[20px] bg-[var(--surface-main)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
            {announcements.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--text-secondary)]">
                No announcements published yet.
              </div>
            ) : (
              announcements.map((a) => (
                <div key={a.id} className="p-5 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-[var(--blue-strong)] font-medium">
                      {a.createdBy} · {new Date(a.createdAt).toLocaleDateString('en-US')}
                    </div>
                    <h4 className="mt-1 font-display text-lg font-medium text-[var(--text-primary)]">
                      {a.title}
                    </h4>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{a.message}</p>
                  </div>
                  <IconButton
                    label="Remove announcement"
                    size="sm"
                    onClick={() => deleteAnnouncement(a.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-[var(--coral-strong)]" />
                  </IconButton>
                </div>
              ))
            )}
          </section>

          <form
            onSubmit={handlePublishAnnouncement}
            className="lg:col-span-5 rounded-[20px] bg-[var(--surface-blue)]/65 border border-[var(--border-subtle)] p-5 space-y-3.5"
          >
            <h3 className="font-display text-lg font-medium text-[var(--text-primary)]">
              Publish announcement
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Publishes to the workspace history and delivers a notice to the local Inbox.
            </p>
            <input
              type="text"
              required
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              placeholder="Announcement headline"
              className="w-full min-h-[40px] rounded-[10px] bg-[var(--surface-main)] border border-[var(--border-subtle)] px-3 text-sm text-[var(--text-primary)]"
            />
            <textarea
              required
              rows={3}
              value={annMessage}
              onChange={(e) => setAnnMessage(e.target.value)}
              placeholder="Calm, clear update for members..."
              className="w-full rounded-[12px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-3 text-sm text-[var(--text-primary)]"
            />
            <Button type="submit" variant="secondary" size="sm" leftIcon={<Megaphone className="w-4 h-4" />}>
              Publish &amp; notify
            </Button>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={deleteAffId !== null}
        title="Delete this affirmation?"
        description="This removes the affirmation from the curated catalog."
        confirmLabel={affirmationMutationPending ? 'Deleting…' : 'Delete'}
        destructive
        onConfirm={() => void handleDeleteAffirmation()}
        onCancel={() => setDeleteAffId(null)}
      />

      <ConfirmDialog
        open={deleteWisId !== null}
        title="Delete this wisdom passage?"
        description="This removes the passage from the Bhagavad Gita library."
        destructive
        confirmLabel={wisdomMutationPending ? 'Deleting…' : 'Delete'}
        onConfirm={() => void handleDeleteWisdom()}
        onCancel={() => setDeleteWisId(null)}
      />
    </div>
  );
};
