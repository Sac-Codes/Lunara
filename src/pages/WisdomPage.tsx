import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Compass,
  PenLine,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';
import { Button } from '../components/ui/Button';
import { WISDOM_TOPICS } from '../data/wisdomAndAffirmations';
import { LUNARA_ARTWORK } from '../lib/atmosphere';
import { useLunara } from '../providers/LunaraProvider';
import type { WisdomEntry, WisdomTopic } from '../types/lunara';

export const WisdomPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    publishedWisdom,
    dailyWisdom,
    savedWisdomIds,
    toggleBookmarkWisdom,
    wisdomLoading,
    wisdomError,
    refreshWisdom,
    showToast,
  } = useLunara();

  const topicParam = searchParams.get('topic') as WisdomTopic | null;
  const queryParam = searchParams.get('q') || '';

  const [search, setSearch] = useState(queryParam);
  const [selectedTopic, setSelectedTopic] = useState<WisdomTopic | 'All'>(
    topicParam && WISDOM_TOPICS.includes(topicParam) ? topicParam : 'All'
  );
  const [selectedChapter, setSelectedChapter] = useState<number | 'All'>('All');
  const [savedOnly, setSavedOnly] = useState(false);
  const [activeEntry, setActiveEntry] = useState<WisdomEntry | null>(null);
  const [krishnaImgError, setKrishnaImgError] = useState(false);
  const [mobileHeroExpanded, setMobileHeroExpanded] = useState(false);

  useEffect(() => {
    const nextTopic = searchParams.get('topic') as WisdomTopic | null;
    const nextQuery = searchParams.get('q');
    if (nextTopic && WISDOM_TOPICS.includes(nextTopic)) {
      setSelectedTopic(nextTopic);
    } else if (nextTopic === null && !nextQuery) {
      // Keep user's interactive state unless URL explicitly changes
    }
    if (nextQuery !== null) {
      setSearch(nextQuery);
    }
  }, [searchParams]);

  const chapters = useMemo(() => {
    const set = new Set<number>();
    publishedWisdom.forEach((w) => set.add(w.chapter));
    return Array.from(set).sort((a, b) => a - b);
  }, [publishedWisdom]);

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return publishedWisdom.filter((entry) => {
      if (selectedTopic !== 'All' && entry.topic !== selectedTopic) return false;
      if (selectedChapter !== 'All' && entry.chapter !== selectedChapter) return false;
      if (savedOnly && !savedWisdomIds.includes(entry.id)) return false;
      if (!q) return true;
      return (
        entry.title.toLowerCase().includes(q) ||
        entry.meaning.toLowerCase().includes(q) ||
        entry.learning.toLowerCase().includes(q) ||
        entry.takeaway.toLowerCase().includes(q) ||
        entry.transliteration.toLowerCase().includes(q) ||
        entry.topic.toLowerCase().includes(q) ||
        `${entry.chapter}:${entry.verse}`.includes(q)
      );
    });
  }, [publishedWisdom, search, selectedTopic, selectedChapter, savedOnly, savedWisdomIds]);

  const handleSelectTopic = (topic: WisdomTopic | 'All') => {
    setSelectedTopic(topic);
    if (topic === 'All') {
      searchParams.delete('topic');
    } else {
      searchParams.set('topic', topic);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const handleBookmark = async (entry: WisdomEntry) => {
    const willSave = !savedWisdomIds.includes(entry.id);
    try {
      await toggleBookmarkWisdom(entry.id);
      showToast(
        willSave
          ? `Saved Bhagavad Gita ${entry.chapter}:${entry.verse} to your bookmarks.`
          : 'Removed from saved wisdom.',
        'amber'
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update saved wisdom.', 'amber');
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Wisdom · Bhagavad Gita"
        title="Steady wisdom for ordinary days"
        description="Reflective passages from the Bhagavad Gita paired with calm, everyday takeaways—meant for thoughtful pause, never instruction or judgment."
        artwork={LUNARA_ARTWORK.night}
        needsEdgeCrop
      />

      {wisdomLoading && (
        <div role="status" aria-live="polite" className="rounded-[16px] bg-[var(--surface-main)] border border-[var(--border-subtle)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          Loading the shared wisdom library…
        </div>
      )}
      {wisdomError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-[var(--surface-amber)] border border-[var(--border-subtle)] px-4 py-3">
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

      {/* Featured Daily Wisdom Hero — Illuminated Warm Ivory / Peach / Gold Sanctuary */}
      {dailyWisdom && (
        <section
          aria-label="Daily featured wisdom"
          className="rounded-[28px] p-5 sm:p-8 lg:p-9 shadow-[var(--shadow-soft)] border border-[#E6C79C]/55 text-[#271E36]"
          style={{
            background:
              'linear-gradient(135deg, #FDF6EC 0%, #FCEAD6 55%, #F7DFDF 100%)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-[#8A5B22]">
              <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Today&apos;s featured passage</span>
              <span aria-hidden="true">·</span>
              <span>
                Bhagavad Gita {dailyWisdom.chapter}:{dailyWisdom.verse}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-[#6B5074]">{dailyWisdom.topic}</span>
            </div>

            <button
              type="button"
              onClick={() => handleBookmark(dailyWisdom)}
              aria-pressed={savedWisdomIds.includes(dailyWisdom.id)}
              className={`inline-flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-[12px] text-xs font-semibold transition-colors cursor-pointer ${
                savedWisdomIds.includes(dailyWisdom.id)
                  ? 'bg-[#8A5B22] text-white'
                  : 'bg-white/80 text-[#3B2F4D] hover:bg-white'
              }`}
            >
              <Bookmark
                className="w-3.5 h-3.5"
                fill={savedWisdomIds.includes(dailyWisdom.id) ? 'currentColor' : 'none'}
              />
              <span>{savedWisdomIds.includes(dailyWisdom.id) ? 'Saved' : 'Save passage'}</span>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Region 1: Krishna Flute Artwork */}
            <div className="lg:col-span-3 relative min-h-[210px] lg:min-h-full rounded-[22px] overflow-hidden bg-[#2E2346] border border-[#D4B082]/45 shadow-sm">
              {!krishnaImgError ? (
                <img
                  src={LUNARA_ARTWORK.krishnaWisdom}
                  alt="Krishna playing the flute beneath a lantern tree beside a tranquil lotus pond"
                  referrerPolicy="no-referrer"
                  onError={() => setKrishnaImgError(true)}
                  className="w-full h-full object-cover scale-110"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#30205F] via-[#56348D] to-[#E5B26F]" />
              )}
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#1B1330]/65 via-transparent to-transparent"
                aria-hidden="true"
              />
              <div className="absolute bottom-3 left-3.5 right-3.5 text-xs font-medium text-[#FCEAD6]">
                Chapter {dailyWisdom.chapter} · Verse {dailyWisdom.verse}
              </div>
            </div>

            {/* Region 2: Title + Sanskrit + Transliteration */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-medium text-[#271E36] leading-snug">
                  {dailyWisdom.title}
                </h2>
                <p className="mt-2.5 text-sm sm:text-[15px] leading-relaxed text-[#453859]">
                  {dailyWisdom.meaning}
                </p>
              </div>

              <div className="hidden sm:block rounded-[20px] bg-white/75 border border-[#E6C79C]/55 p-4 sm:p-5 space-y-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8A5B22]">
                    Sanskrit verse
                  </div>
                  <p className="mt-1.5 text-base sm:text-lg leading-relaxed text-[#271E36] whitespace-pre-line font-medium">
                    {dailyWisdom.sanskrit}
                  </p>
                </div>
                <div className="pt-2.5 border-t border-[#E6C79C]/55">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6B5074]">
                    Transliteration
                  </div>
                  <p className="mt-1 text-xs sm:text-sm leading-relaxed text-[#594B6E] italic whitespace-pre-line">
                    {dailyWisdom.transliteration}
                  </p>
                </div>
              </div>
            </div>

            {/* Region 3: Everyday Learning + Reflection Question */}
            <div className="lg:col-span-4 flex flex-col justify-between gap-4">
              <div className="rounded-[20px] bg-white/70 border border-[#E6C79C]/55 p-5 space-y-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#285D53]">
                    Everyday learning
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#271E36]">
                    {dailyWisdom.learning}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E6C79C]/55">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6B5074]">
                    Reflection question
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#271E36] font-medium">
                    {dailyWisdom.reflectionPrompt}
                  </p>
                  <Link
                    to={`/journal?new=1&prompt=${encodeURIComponent(dailyWisdom.reflectionPrompt)}`}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B5074] hover:text-[#271E36]"
                  >
                    <PenLine className="w-3.5 h-3.5" />
                    <span>Reflect in journal</span>
                  </Link>
                </div>
              </div>

              <div className="rounded-[18px] bg-[#271E36]/6 px-4 py-3 text-xs leading-relaxed text-[#3B2F4D]">
                <span className="font-semibold text-[#8A5B22] mr-1.5">Takeaway:</span>
                {dailyWisdom.takeaway}
                <div className="mt-1 text-[11px] text-[#6B5B82]">{dailyWisdom.sourceNote}</div>
              </div>
            </div>
          </div>

          {/* Mobile Disclosure for Sanskrit & Transliteration */}
          <div className="mt-4 sm:hidden space-y-2.5">
            <button
              type="button"
              aria-expanded={mobileHeroExpanded}
              onClick={() => setMobileHeroExpanded((v) => !v)}
              className="w-full flex items-center justify-between min-h-[42px] px-4 rounded-[12px] bg-white/70 text-xs font-semibold text-[#3B2F4D] cursor-pointer"
            >
              <span>{mobileHeroExpanded ? 'Hide Sanskrit verse' : 'View Sanskrit & transliteration'}</span>
              {mobileHeroExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {mobileHeroExpanded && (
              <div className="rounded-[18px] bg-white/80 border border-[#E6C79C]/55 p-4 space-y-2.5">
                <p className="text-base font-medium text-[#271E36] whitespace-pre-line">
                  {dailyWisdom.sanskrit}
                </p>
                <p className="text-xs italic text-[#594B6E] whitespace-pre-line">
                  {dailyWisdom.transliteration}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Search & Filter Controls */}
      <section className="rounded-[24px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-5 sm:p-6 shadow-[var(--shadow-card)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search
              className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by theme, verse (e.g. 2:47), or word..."
              aria-label="Search wisdom entries"
              className="w-full min-h-[44px] rounded-[13px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-2 focus:outline-[#E5B26F]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedChapter}
              onChange={(e) =>
                setSelectedChapter(e.target.value === 'All' ? 'All' : Number(e.target.value))
              }
              aria-label="Filter by chapter"
              className="min-h-[40px] rounded-[12px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-3 text-xs sm:text-sm text-[var(--text-primary)]"
            >
              <option value="All">All chapters</option>
              {chapters.map((ch) => (
                <option key={ch} value={ch}>
                  Chapter {ch}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setSavedOnly((v) => !v)}
              aria-pressed={savedOnly}
              className={`inline-flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-[12px] text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                savedOnly
                  ? 'bg-[var(--surface-amber)] text-[var(--amber-strong)]'
                  : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved ({savedWisdomIds.length})</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => handleSelectTopic('All')}
            className={`min-h-[34px] px-3 rounded-[10px] text-xs font-medium transition-colors cursor-pointer ${
              selectedTopic === 'All'
                ? 'bg-[var(--surface-lavender)] text-[var(--lavender-strong)]'
                : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            All themes
          </button>
          {WISDOM_TOPICS.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => handleSelectTopic(selectedTopic === topic ? 'All' : topic)}
              className={`min-h-[34px] px-3 rounded-[10px] text-xs font-medium transition-colors cursor-pointer ${
                selectedTopic === topic
                  ? 'bg-[var(--surface-lavender)] text-[var(--lavender-strong)]'
                  : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </section>

      {/* Wisdom Library Grid */}
      {wisdomLoading && publishedWisdom.length === 0 ? (
        <section role="status" className="rounded-[24px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-8 text-center text-sm text-[var(--text-secondary)]">
          Loading shared passages…
        </section>
      ) : wisdomError && publishedWisdom.length === 0 ? null : publishedWisdom.length === 0 ? (
        <section className="rounded-[24px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-8 text-center space-y-3">
          <Compass className="w-8 h-8 text-[var(--amber-strong)] mx-auto" />
          <p className="text-sm text-[var(--text-secondary)]">
            No published wisdom passages are available yet.
          </p>
        </section>
      ) : filteredEntries.length === 0 ? (
        <section className="rounded-[24px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-8 text-center space-y-3">
          <Compass className="w-8 h-8 text-[var(--amber-strong)] mx-auto" />
          <p className="text-sm text-[var(--text-secondary)]">
            No wisdom passages match your current search or saved filter.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              handleSelectTopic('All');
              setSelectedChapter('All');
              setSavedOnly(false);
            }}
          >
            Show all passages
          </Button>
        </section>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredEntries.map((entry, idx) => {
            const isSaved = savedWisdomIds.includes(entry.id);
            const surface =
              idx % 3 === 0
                ? 'bg-[var(--surface-main)]'
                : idx % 3 === 1
                  ? 'bg-[var(--surface-blue)]/65'
                  : 'bg-[var(--surface-lavender)]/65';
            return (
              <article
                key={entry.id}
                className={`rounded-[24px] ${surface} border border-[var(--border-subtle)] p-6 shadow-[var(--shadow-card)] flex flex-col justify-between gap-4`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-[var(--amber-strong)]">
                      Chapter {entry.chapter}, Verse {entry.verse} · {entry.topic}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleBookmark(entry)}
                      aria-label={isSaved ? 'Remove bookmark' : 'Save passage'}
                      className={`w-8 h-8 rounded-[10px] flex items-center justify-center transition-colors cursor-pointer ${
                        isSaved
                          ? 'bg-[var(--surface-amber)] text-[var(--amber-strong)]'
                          : 'bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <h3 className="mt-2 font-display text-xl font-medium text-[var(--text-primary)]">
                    {entry.title}
                  </h3>

                  <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                    {entry.learning}
                  </p>

                  <p className="mt-3 text-xs font-medium text-[var(--teal-strong)]">
                    Takeaway: {entry.takeaway}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveEntry(entry)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--lavender-strong)] hover:underline cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Read Sanskrit &amp; full note</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <Link
                    to={`/journal?new=1&prompt=${encodeURIComponent(entry.reflectionPrompt)}`}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Journal prompt
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Full Passage Modal */}
      {activeEntry && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="wisdom-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
          onClick={() => setActiveEntry(null)}
        >
          <div
            className="w-full max-w-2xl rounded-[28px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-6 sm:p-8 shadow-2xl space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-[var(--amber-strong)]">
                  Bhagavad Gita · Chapter {activeEntry.chapter}, Verse {activeEntry.verse} ·{' '}
                  {activeEntry.topic}
                </div>
                <h2
                  id="wisdom-modal-title"
                  className="mt-1 font-display text-2xl font-medium text-[var(--text-primary)]"
                >
                  {activeEntry.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveEntry(null)}
                aria-label="Close passage"
                className="w-9 h-9 rounded-[11px] bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-[18px] bg-[var(--surface-amber)]/65 p-5 space-y-3">
              <p className="text-lg leading-relaxed text-[var(--text-primary)] whitespace-pre-line font-medium">
                {activeEntry.sanskrit}
              </p>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)] italic whitespace-pre-line">
                {activeEntry.transliteration}
              </p>
            </div>

            <div className="space-y-3 text-sm leading-relaxed">
              <div>
                <div className="text-xs font-medium text-[var(--text-muted)]">Meaning</div>
                <p className="mt-1 text-[var(--text-primary)]">{activeEntry.meaning}</p>
              </div>
              <div>
                <div className="text-xs font-medium text-[var(--text-muted)]">
                  Everyday learning
                </div>
                <p className="mt-1 text-[var(--text-primary)]">{activeEntry.learning}</p>
              </div>
              <div className="rounded-[16px] bg-[var(--surface-lavender)] p-4">
                <div className="text-xs font-medium text-[var(--lavender-strong)]">
                  Reflection question
                </div>
                <p className="mt-1 text-[var(--text-primary)]">{activeEntry.reflectionPrompt}</p>
              </div>
              <p className="text-xs text-[var(--text-muted)]">{activeEntry.sourceNote}</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-subtle)]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBookmark(activeEntry)}
                leftIcon={<Bookmark className="w-3.5 h-3.5" />}
              >
                {savedWisdomIds.includes(activeEntry.id) ? 'Saved' : 'Save passage'}
              </Button>
              <Link
                to={`/journal?new=1&prompt=${encodeURIComponent(activeEntry.reflectionPrompt)}`}
              >
                <Button variant="primary" size="sm" leftIcon={<PenLine className="w-3.5 h-3.5" />}>
                  Reflect in journal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
