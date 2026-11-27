import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bookmark,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  Feather,
  PenLine,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { WeeklyPulseChart } from '../components/charts/WeeklyPulseChart';
import { CalmHorizonOrb } from '../components/graphics/LunarArtwork';
import { AffirmationCard } from '../components/shared/AffirmationCard';
import { Button } from '../components/ui/Button';
import { MoodIcon } from '../components/ui/LunaraMark';
import { DAILY_REFLECTION_NOTES, MOOD_DEFINITIONS, MOOD_MAP } from '../data/sampleJourney';
import { WISDOM_TOPICS } from '../data/wisdomAndAffirmations';
import { getTimeEnvironment, LUNARA_ARTWORK } from '../lib/atmosphere';
import {
  addDays,
  formatLongDate,
  formatShortDay,
  toDateKey,
} from '../lib/date';
import { useAuth } from '../providers/AuthProvider';
import { useLunara } from '../providers/LunaraProvider';
import type { MoodId, WisdomTopic } from '../types/lunara';

const TOPIC_SURFACES: Record<WisdomTopic, { bg: string; text: string }> = {
  'Duty & Action': {
    bg: 'bg-[var(--surface-amber)]/85 hover:bg-[var(--surface-amber)]',
    text: 'text-[var(--amber-strong)]',
  },
  'Inner Balance': {
    bg: 'bg-[var(--surface-teal)]/85 hover:bg-[var(--surface-teal)]',
    text: 'text-[var(--teal-strong)]',
  },
  Patience: {
    bg: 'bg-[var(--surface-blue)]/85 hover:bg-[var(--surface-blue)]',
    text: 'text-[var(--blue-strong)]',
  },
  'Self-Understanding': {
    bg: 'bg-[var(--surface-lavender)]/85 hover:bg-[var(--surface-lavender)]',
    text: 'text-[var(--lavender-strong)]',
  },
  Courage: {
    bg: 'bg-[var(--surface-coral)]/85 hover:bg-[var(--surface-coral)]',
    text: 'text-[var(--coral-strong)]',
  },
  Detachment: {
    bg: 'bg-[var(--surface-blue)]/75 hover:bg-[var(--surface-blue)]',
    text: 'text-[var(--blue-strong)]',
  },
  Compassion: {
    bg: 'bg-[var(--surface-rose)]/85 hover:bg-[var(--surface-rose)]',
    text: 'text-[var(--rose-strong)]',
  },
};

export const HomePage: React.FC = () => {
  const {
    checkIns,
    saveCheckIn,
    journals,
    saveJournal,
    profile,
    resolvedTheme,
    hasSampleData,
    loadSampleJourney,
    clearSampleJourney,
    dailyWisdom,
    savedWisdomIds,
    toggleBookmarkWisdom,
    favoriteAffirmationIds,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    notificationPrefs,
    showToast,
  } = useLunara();
  const { user } = useAuth();

  const [heroImgError, setHeroImgError] = useState(false);
  const [krishnaImgError, setKrishnaImgError] = useState(false);
  const [journalImgError, setJournalImgError] = useState(false);
  const [mobileWisdomExpanded, setMobileWisdomExpanded] = useState(false);

  // Quick Daily Reflection draft state
  const [quickReflection, setQuickReflection] = useState('');
  const [quickSavedId, setQuickSavedId] = useState<string | null>(null);

  const todayKey = toDateKey();
  const todayCheckIn = checkIns.find((c) => c.date === todayKey);

  const timeEnv = useMemo(() => getTimeEnvironment(), []);
  const displayName = profile.displayName.trim() || user?.name?.split(' ')[0] || '';

  const dailyMessage = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    return DAILY_REFLECTION_NOTES[dayOfYear % DAILY_REFLECTION_NOTES.length];
  }, []);

  const avgHappiness = useMemo(() => {
    const recent = checkIns
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7)
      .map((c) => c.happiness)
      .filter((v): v is number => v !== null);
    if (recent.length === 0) return null;
    const avg = recent.reduce((sum, n) => sum + n, 0) / recent.length;
    return avg.toFixed(1);
  }, [checkIns]);

  const recentDays = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const dateKey = addDays(todayKey, -i);
      const ci = checkIns.find((c) => c.date === dateKey);
      const hasJournal = journals.some((j) => j.date === dateKey);
      return {
        dateKey,
        label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : formatShortDay(dateKey),
        checkIn: ci,
        hasJournal,
      };
    });
  }, [todayKey, checkIns, journals]);

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.read).slice(0, 2),
    [notifications]
  );

  const handleQuickMoodSelect = (moodId: MoodId) => {
    const nextMood = todayCheckIn?.mood === moodId ? null : moodId;
    saveCheckIn({
      date: todayKey,
      mood: nextMood,
      happiness: todayCheckIn?.happiness ?? null,
      energy: todayCheckIn?.energy ?? null,
      stress: todayCheckIn?.stress ?? null,
      likes: todayCheckIn?.likes ?? [],
      dislikes: todayCheckIn?.dislikes ?? [],
      notes: todayCheckIn?.notes ?? '',
      customValues: todayCheckIn?.customValues,
    });
    if (nextMood) {
      const label = MOOD_MAP[nextMood].label;
      showToast(`Today's mood noted as ${label.toLowerCase()}.`, 'lavender');
    } else {
      showToast("Cleared today's mood selection.", 'blue');
    }
  };

  const handleQuickReflectionSave = (e: React.FormEvent) => {
    e.preventDefault();
    const content = quickReflection.trim();
    if (!content) {
      showToast('Write a brief thought before saving to your journal.', 'amber');
      return;
    }
    const created = saveJournal({
      date: todayKey,
      title: 'What brought peace today',
      content,
      tags: ['Daily Reflection'],
    });
    setQuickReflection('');
    setQuickSavedId(created.id);
    showToast('Saved to your personal journal.', 'rose');
  };

  const isDailyWisdomSaved = dailyWisdom ? savedWisdomIds.includes(dailyWisdom.id) : false;

  const handleToggleDailyWisdomBookmark = () => {
    if (!dailyWisdom) return;
    toggleBookmarkWisdom(dailyWisdom.id);
    showToast(
      isDailyWisdomSaved
        ? 'Removed from saved wisdom.'
        : `Saved Bhagavad Gita ${dailyWisdom.chapter}:${dailyWisdom.verse}.`,
      'amber'
    );
  };

  return (
    <div className="space-y-6 lg:space-y-7">
      {/* Sample data notice when active */}
      {hasSampleData && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-[var(--surface-blue)]/85 border border-[var(--border-subtle)] px-4 py-3 text-xs sm:text-sm text-[var(--blue-strong)]">
          <span>
            Previewing with a sample week alongside your personal entries.
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSampleJourney}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Remove sample data
          </Button>
        </div>
      )}

      {/* 1. Time-Based Scenic Greeting Hero */}
      <section className="relative overflow-hidden rounded-[28px] shadow-[var(--shadow-soft)] min-h-[240px] sm:min-h-[268px] flex items-end text-white">
        {!heroImgError ? (
          <img
            src={timeEnv.backdropImage}
            alt={`${timeEnv.period} sky and tranquil horizon`}
            referrerPolicy="no-referrer"
            onError={() => setHeroImgError(true)}
            className={`absolute inset-0 w-full h-full object-cover ${
              timeEnv.needsEdgeCrop ? 'scale-125' : 'scale-105'
            }`}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: timeEnv.fallbackGradient }}
            aria-hidden="true"
          />
        )}

        {/* Scrim for guaranteed legibility */}
        <div
          className="absolute inset-0"
          style={{ background: timeEnv.scrimGradient }}
          aria-hidden="true"
        />

        <div className="relative z-10 w-full p-6 sm:p-8 lg:p-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium text-[#E5D4F7]/90">
              <span>{formatLongDate(todayKey)}</span>
              {todayCheckIn && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#BCE2D7] inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Checked in today
                  </span>
                </>
              )}
            </div>

            <h1 className="mt-2 font-display text-3xl sm:text-4xl lg:text-[42px] font-medium tracking-tight leading-[1.12] text-white">
              {timeEnv.greeting}
              {displayName ? `, ${displayName}` : ''}{' '}
              <span aria-hidden="true" className="inline-block ml-0.5">
                {timeEnv.symbol}
              </span>
            </h1>

            <p className="mt-2.5 text-sm sm:text-base lg:text-[17px] text-[#F2ECF7]/90 leading-relaxed max-w-xl">
              {profile.showGreetingPrompts ? timeEnv.subtitle : dailyMessage}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link to="/check-in">
              <Button
                variant="primary"
                size="md"
                leftIcon={<PenLine className="w-4 h-4" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {todayCheckIn ? 'Update check-in' : 'Check in today'}
              </Button>
            </Link>

            <Link to="/journal?new=1">
              <button
                type="button"
                className="inline-flex items-center gap-2 min-h-[42px] px-4 rounded-[13px] bg-white/14 hover:bg-white/22 border border-white/20 backdrop-blur-xs text-sm font-medium text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4" />
                <span>Write journal</span>
              </button>
            </Link>

            {checkIns.length === 0 && journals.length === 0 && (
              <button
                type="button"
                onClick={loadSampleJourney}
                className="inline-flex items-center gap-1.5 min-h-[42px] px-3.5 rounded-[13px] bg-black/20 hover:bg-black/30 border border-white/15 text-xs sm:text-sm font-medium text-[#E5D4F7] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Preview sample week</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Real-Data Sanctuary Overview Strip */}
      <section
        aria-label="Your reflection overview"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        <Link
          to="/calendar"
          className="group rounded-[20px] bg-[var(--surface-blue)]/85 hover:bg-[var(--surface-blue)] border border-[var(--border-subtle)] p-4 sm:p-5 transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
            <span>Check-ins recorded</span>
            <CalendarDays className="w-4 h-4 text-[var(--blue-strong)] opacity-80" />
          </div>
          <div className="mt-2 font-display text-2xl sm:text-3xl font-medium tabular-nums text-[var(--blue-strong)]">
            {checkIns.length}
          </div>
          <div className="mt-1 text-[11px] text-[var(--text-muted)]">
            {todayCheckIn ? 'Today included' : 'Open when ready'}
          </div>
        </Link>

        <Link
          to="/journal"
          className="group rounded-[20px] bg-[var(--surface-rose)]/85 hover:bg-[var(--surface-rose)] border border-[var(--border-subtle)] p-4 sm:p-5 transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
            <span>Journal pages</span>
            <BookOpen className="w-4 h-4 text-[var(--rose-strong)] opacity-80" />
          </div>
          <div className="mt-2 font-display text-2xl sm:text-3xl font-medium tabular-nums text-[var(--rose-strong)]">
            {journals.length}
          </div>
          <div className="mt-1 text-[11px] text-[var(--text-muted)] truncate">
            {journals[0] ? `Latest: ${journals[0].title}` : 'Blank pages waiting'}
          </div>
        </Link>

        <Link
          to="/insights"
          className="group rounded-[20px] bg-[var(--surface-teal)]/85 hover:bg-[var(--surface-teal)] border border-[var(--border-subtle)] p-4 sm:p-5 transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
            <span>Recent happiness</span>
            <BarChart3 className="w-4 h-4 text-[var(--teal-strong)] opacity-80" />
          </div>
          <div className="mt-2 font-display text-2xl sm:text-3xl font-medium tabular-nums text-[var(--teal-strong)]">
            {avgHappiness ?? '—'}
            {avgHappiness && <span className="text-sm font-sans opacity-75"> / 5</span>}
          </div>
          <div className="mt-1 text-[11px] text-[var(--text-muted)]">
            {avgHappiness ? 'Across recent check-ins' : 'Needs check-in ratings'}
          </div>
        </Link>

        <Link
          to="/wisdom"
          className="group rounded-[20px] bg-[var(--surface-amber)]/85 hover:bg-[var(--surface-amber)] border border-[var(--border-subtle)] p-4 sm:p-5 transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
            <span>Saved wisdom &amp; hearts</span>
            <Compass className="w-4 h-4 text-[var(--amber-strong)] opacity-80" />
          </div>
          <div className="mt-2 font-display text-2xl sm:text-3xl font-medium tabular-nums text-[var(--amber-strong)]">
            {savedWisdomIds.length + favoriteAffirmationIds.length}
          </div>
          <div className="mt-1 text-[11px] text-[var(--text-muted)] tabular-nums">
            {savedWisdomIds.length} verses · {favoriteAffirmationIds.length} affirmations
          </div>
        </Link>
      </section>

      {/* 3. Featured Editorial Row: Bhagavad Gita Wisdom + Daily Affirmation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Featured Bhagavad Gita Wisdom (Warm Luminous Ivory/Gold/Rose Panel) */}
        {dailyWisdom && notificationPrefs.dailyWisdom ? (
          <section
            aria-label="Featured Bhagavad Gita Wisdom"
            className="lg:col-span-8 relative overflow-hidden rounded-[28px] p-5 sm:p-7 shadow-[var(--shadow-soft)] border border-[#E6C79C]/55 text-[#271E36]"
            style={{
              background:
                'linear-gradient(135deg, #FDF6EC 0%, #FCEAD6 54%, #F7DFDF 100%)',
            }}
          >
            {/* Header Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#8A5B22]">
                <Compass className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Bhagavad Gita</span>
                <span aria-hidden="true">·</span>
                <span>
                  Chapter {dailyWisdom.chapter}, Verse {dailyWisdom.verse}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-[#6B5074]">{dailyWisdom.topic}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleDailyWisdomBookmark}
                  aria-pressed={isDailyWisdomSaved}
                  className={`inline-flex items-center gap-1.5 min-h-[34px] px-3 rounded-[10px] text-xs font-medium transition-colors cursor-pointer ${
                    isDailyWisdomSaved
                      ? 'bg-[#8A5B22] text-white'
                      : 'bg-white/75 text-[#3B2F4D] hover:bg-white'
                  }`}
                >
                  <Bookmark
                    className="w-3.5 h-3.5"
                    fill={isDailyWisdomSaved ? 'currentColor' : 'none'}
                  />
                  <span>{isDailyWisdomSaved ? 'Saved' : 'Save'}</span>
                </button>

                <Link
                  to="/wisdom"
                  className="inline-flex items-center gap-1 min-h-[34px] px-3 rounded-[10px] bg-[#271E36] text-[#FDF6EC] hover:bg-[#3B2D52] text-xs font-medium transition-colors whitespace-nowrap"
                >
                  <span>Explore more</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* 3-Region Composition on Desktop / Clean Stack + Expand on Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
              {/* Region 1: Krishna Flute Artwork */}
              <div className="md:col-span-4 lg:col-span-3 relative min-h-[175px] md:min-h-full rounded-[20px] overflow-hidden bg-[#2E2346] border border-[#D4B082]/45 shadow-sm">
                {!krishnaImgError ? (
                  <img
                    src={LUNARA_ARTWORK.krishnaWisdom}
                    alt="Serene illustration of Krishna playing the flute beside a lotus pond under golden lanterns"
                    referrerPolicy="no-referrer"
                    onError={() => setKrishnaImgError(true)}
                    className="w-full h-full object-cover scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#30205F] via-[#56348D] to-[#E5B26F]" />
                )}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-[#1B1330]/60 via-transparent to-transparent"
                  aria-hidden="true"
                />
                <div className="absolute bottom-2.5 left-3 right-3 text-[11px] font-medium text-[#FCEAD6]/95">
                  Daily contemplation
                </div>
              </div>

              {/* Region 2: Verse Title + Sanskrit + Transliteration + Meaning */}
              <div className="md:col-span-8 lg:col-span-5 flex flex-col justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl sm:text-[26px] font-medium text-[#271E36] leading-snug">
                    {dailyWisdom.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#453859]">
                    {dailyWisdom.meaning}
                  </p>
                </div>

                {/* Desktop always visible Sanskrit; Mobile collapsible */}
                <div className="hidden md:block rounded-[16px] bg-white/65 border border-[#E6C79C]/50 p-3.5 space-y-1.5">
                  <p className="text-sm leading-relaxed font-medium text-[#271E36] whitespace-pre-line">
                    {dailyWisdom.sanskrit}
                  </p>
                  <p className="text-xs italic leading-relaxed text-[#6B5B82] whitespace-pre-line">
                    {dailyWisdom.transliteration}
                  </p>
                </div>
              </div>

              {/* Region 3: Everyday Learning + Reflection Question (Desktop) */}
              <div className="hidden lg:flex lg:col-span-4 flex-col justify-between gap-3 rounded-[20px] bg-white/55 border border-[#E6C79C]/50 p-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8A5B22]">
                      Everyday learning
                    </div>
                    <p className="mt-1 text-xs sm:text-[13px] leading-relaxed text-[#382C4A]">
                      {dailyWisdom.learning}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-[#E6C79C]/55">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6B5074]">
                      Reflect
                    </div>
                    <p className="mt-1 text-xs sm:text-[13px] leading-relaxed text-[#271E36] font-medium">
                      {dailyWisdom.reflectionPrompt}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/journal?new=1&prompt=${encodeURIComponent(dailyWisdom.reflectionPrompt)}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B5074] hover:text-[#271E36] transition-colors"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  <span>Journal on this prompt</span>
                </Link>
              </div>
            </div>

            {/* Mobile & Tablet Compact Takeaway + Expandable Sanskrit/Reflection */}
            <div className="mt-4 lg:hidden space-y-3">
              <div className="rounded-[16px] bg-white/65 border border-[#E6C79C]/50 p-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8A5B22]">
                  Takeaway
                </div>
                <p className="mt-1 text-sm font-medium text-[#271E36]">{dailyWisdom.takeaway}</p>
              </div>

              <button
                type="button"
                aria-expanded={mobileWisdomExpanded}
                onClick={() => setMobileWisdomExpanded((v) => !v)}
                className="w-full flex items-center justify-between min-h-[40px] px-3.5 rounded-[12px] bg-white/55 text-xs font-semibold text-[#453859] cursor-pointer"
              >
                <span>
                  {mobileWisdomExpanded
                    ? 'Hide Sanskrit & reflection question'
                    : 'Read Sanskrit verse & reflection question'}
                </span>
                {mobileWisdomExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {mobileWisdomExpanded && (
                <div className="rounded-[16px] bg-white/75 border border-[#E6C79C]/55 p-4 space-y-3">
                  <div className="md:hidden space-y-1.5 pb-3 border-b border-[#E6C79C]/50">
                    <p className="text-sm font-medium text-[#271E36] whitespace-pre-line">
                      {dailyWisdom.sanskrit}
                    </p>
                    <p className="text-xs italic text-[#6B5B82] whitespace-pre-line">
                      {dailyWisdom.transliteration}
                    </p>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8A5B22]">
                      Everyday learning
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#382C4A]">
                      {dailyWisdom.learning}
                    </p>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6B5074]">
                      Reflection question
                    </div>
                    <p className="mt-1 text-xs font-medium text-[#271E36]">
                      {dailyWisdom.reflectionPrompt}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="lg:col-span-8 rounded-[28px] bg-[var(--surface-amber)] p-6 sm:p-8 shadow-[var(--shadow-card)] flex flex-col justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--amber-strong)]">
                <Compass className="w-4 h-4" />
                <span>Bhagavad Gita Wisdom Library</span>
              </span>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-medium text-[var(--text-primary)]">
                Timeless passages for quiet reflection
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-xl leading-relaxed">
                Daily wisdom snippets on Home are currently paused in your settings. You can still browse the full collection anytime.
              </p>
            </div>
            <div>
              <Link to="/wisdom">
                <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Open Wisdom Library
                </Button>
              </Link>
            </div>
          </section>
        )}

        {/* Daily Affirmation Lotus Panel */}
        <div className="lg:col-span-4">
          {notificationPrefs.affirmations ? (
            <AffirmationCard label="Daily affirmation" />
          ) : (
            <div className="h-full rounded-[26px] bg-[var(--surface-lavender)] p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-medium text-[var(--lavender-strong)]">
                  Quiet pace
                </span>
                <h2 className="mt-2 font-display text-2xl font-medium text-[var(--text-primary)]">
                  Recent days at a glance
                </h2>
                <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
                  Revisit your latest check-ins whenever you wish.
                </p>
              </div>
              <Link to="/calendar" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--lavender-strong)] hover:underline">
                <span>Open calendar</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 4. Interactive Mood Check-In + Quick Actions & Wellbeing Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: How are you feeling? + Quick Actions */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <section className="rounded-[26px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-5 sm:p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-medium text-[var(--text-primary)]">
                  Your mood today
                </h2>
                <p className="mt-0.5 text-xs sm:text-sm text-[var(--text-secondary)]">
                  How are you feeling? Tap to note today without pressure.
                </p>
              </div>
              <Link
                to="/check-in"
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--lavender-strong)] hover:underline whitespace-nowrap shrink-0"
              >
                <span>Full check-in</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {MOOD_DEFINITIONS.map((m) => {
                const selected = todayCheckIn?.mood === m.id;
                const surfaceBg = resolvedTheme === 'dark' ? m.surfaceDark : m.surfaceLight;
                const textCol = resolvedTheme === 'dark' ? m.textDark : m.textLight;

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleQuickMoodSelect(m.id)}
                    aria-pressed={selected}
                    style={
                      selected
                        ? {
                            backgroundColor: surfaceBg,
                            borderColor: m.accentHex,
                          }
                        : undefined
                    }
                    className={`min-h-[72px] rounded-[16px] p-3 border text-left flex flex-col justify-between transition-all cursor-pointer active:scale-[0.97] ${
                      selected
                        ? 'shadow-sm'
                        : 'bg-[var(--surface-secondary)]/75 border-transparent hover:bg-[var(--surface-secondary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className="w-7 h-7 rounded-[9px] flex items-center justify-center"
                        style={{
                          backgroundColor: `${m.accentHex}26`,
                          color: selected ? textCol : m.accentHex,
                        }}
                      >
                        <MoodIcon mood={m.id} className="w-4 h-4" />
                      </span>
                      <span className="text-base leading-none" aria-hidden="true">
                        {m.emoji}
                      </span>
                    </div>
                    <div
                      className="mt-2 text-xs sm:text-sm font-medium flex items-center justify-between gap-1"
                      style={{ color: selected ? textCol : 'var(--text-primary)' }}
                    >
                      <span>{m.label}</span>
                      {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Quick Actions 2x2 Grid */}
          <section
            aria-label="Quick actions"
            className="grid grid-cols-2 gap-3"
          >
            <Link
              to="/check-in"
              className="group rounded-[20px] bg-[var(--surface-teal)]/85 hover:bg-[var(--surface-teal)] border border-[var(--border-subtle)] p-4 flex items-center gap-3 transition-colors"
            >
              <div className="w-10 h-10 rounded-[12px] bg-[#76BBAA]/25 text-[var(--teal-strong)] flex items-center justify-center shrink-0">
                <PenLine className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-display text-base font-medium text-[var(--text-primary)]">
                  Check-in
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] truncate">
                  {todayCheckIn ? 'Edit today' : 'Log feelings'}
                </div>
              </div>
            </Link>

            <Link
              to="/journal?new=1"
              className="group rounded-[20px] bg-[var(--surface-rose)]/85 hover:bg-[var(--surface-rose)] border border-[var(--border-subtle)] p-4 flex items-center gap-3 transition-colors"
            >
              <div className="w-10 h-10 rounded-[12px] bg-[#D99EBB]/25 text-[var(--rose-strong)] flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-display text-base font-medium text-[var(--text-primary)]">
                  Write Journal
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] truncate">
                  Open a blank page
                </div>
              </div>
            </Link>

            <Link
              to="/wisdom"
              className="group rounded-[20px] bg-[var(--surface-amber)]/85 hover:bg-[var(--surface-amber)] border border-[var(--border-subtle)] p-4 flex items-center gap-3 transition-colors"
            >
              <div className="w-10 h-10 rounded-[12px] bg-[#E5B26F]/25 text-[var(--amber-strong)] flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-display text-base font-medium text-[var(--text-primary)]">
                  Explore Wisdom
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] truncate">
                  Bhagavad Gita verses
                </div>
              </div>
            </Link>

            <Link
              to="/insights"
              className="group rounded-[20px] bg-[var(--surface-blue)]/85 hover:bg-[var(--surface-blue)] border border-[var(--border-subtle)] p-4 flex items-center gap-3 transition-colors"
            >
              <div className="w-10 h-10 rounded-[12px] bg-[#78A6E7]/25 text-[var(--blue-strong)] flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-display text-base font-medium text-[var(--text-primary)]">
                  View Insights
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] truncate">
                  Patterns over time
                </div>
              </div>
            </Link>
          </section>
        </div>

        {/* Right: Wellbeing Journey Visualization + Recent Days Strip */}
        <section className="lg:col-span-7 rounded-[26px] bg-[var(--surface-blue)] border border-[var(--border-subtle)] p-6 sm:p-7 shadow-[var(--shadow-card)] flex flex-col justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-medium text-[var(--text-primary)]">
                  Your reflection journey
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)]">
                  Happiness, energy, and stress rhythms from your recorded check-ins.
                </p>
              </div>
              <Link
                to="/insights"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--blue-strong)] hover:underline whitespace-nowrap shrink-0"
              >
                <span>Explore insights</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <WeeklyPulseChart entries={checkIns} height={225} />
          </div>

          {/* Compact Recent Days Ribbon */}
          <div className="pt-4 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Recent days
              </span>
              <Link
                to="/calendar"
                className="text-xs font-medium text-[var(--blue-strong)] hover:underline"
              >
                Open calendar
              </Link>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {recentDays.map((day) => {
                const moodDef = day.checkIn?.mood ? MOOD_MAP[day.checkIn.mood] : null;
                return (
                  <Link
                    key={day.dateKey}
                    to={
                      day.checkIn
                        ? `/calendar?date=${day.dateKey}`
                        : `/check-in?date=${day.dateKey}`
                    }
                    className="rounded-[14px] bg-[var(--surface-main)]/75 hover:bg-[var(--surface-main)] p-2.5 text-center transition-colors"
                  >
                    <div className="text-[11px] font-medium text-[var(--text-secondary)] truncate">
                      {day.label}
                    </div>
                    <div className="mt-1 text-base leading-none">
                      {moodDef ? moodDef.emoji : day.hasJournal ? '📖' : '·'}
                    </div>
                    <div className="mt-1 text-[10px] text-[var(--text-muted)] truncate">
                      {moodDef ? moodDef.label : day.checkIn ? 'Checked' : 'Open'}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* 5. Daily Reflection Quick-Write + Explore Wisdom Topics + Notifications Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Daily Reflection Quick-Write with Botanical Artwork */}
        <section className="lg:col-span-5 rounded-[26px] bg-[var(--surface-rose)] border border-[var(--border-subtle)] overflow-hidden shadow-[var(--shadow-card)] flex flex-col justify-between">
          <div className="relative h-28 sm:h-32 overflow-hidden">
            {!journalImgError ? (
              <img
                src={LUNARA_ARTWORK.journalBotanical}
                alt="Open linen journal with pressed flowers"
                referrerPolicy="no-referrer"
                onError={() => setJournalImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-[#56348D] to-[#9E6686]" />
            )}
            <div
              className="absolute inset-0 bg-gradient-to-t from-[#1D1530]/85 via-[#1D1530]/40 to-transparent"
              aria-hidden="true"
            />
            <div className="absolute bottom-3 left-5 right-5 flex items-end justify-between gap-3 text-white">
              <div>
                <div className="text-[11px] font-medium text-[#F0C7DA]">
                  Daily reflection 🌙
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-medium leading-tight">
                  What brought you peace today?
                </h2>
              </div>
              <Feather className="w-5 h-5 text-[#F0C7DA] shrink-0" aria-hidden="true" />
            </div>
          </div>

          <form onSubmit={handleQuickReflectionSave} className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-3.5">
            <div>
              <textarea
                value={quickReflection}
                onChange={(e) => setQuickReflection(e.target.value)}
                rows={3}
                aria-label="What brought you peace today?"
                placeholder="A quiet conversation, a slow breath, warm light through the window..."
                className="w-full rounded-[16px] bg-[var(--surface-main)]/85 border border-[var(--border-subtle)] p-3.5 text-sm leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-2 focus:outline-[#D99EBB]"
              />
              {quickSavedId && (
                <p className="mt-2 text-xs text-[var(--rose-strong)] flex items-center justify-between gap-2">
                  <span>Saved to your journal.</span>
                  <Link to={`/journal?entry=${quickSavedId}`} className="font-medium underline">
                    Read entry
                  </Link>
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                to="/journal"
                className="text-xs font-medium text-[var(--rose-strong)] hover:underline"
              >
                Open full journal ({journals.length})
              </Link>
              <Button type="submit" variant="rose" size="sm" leftIcon={<Check className="w-3.5 h-3.5" />}>
                Save to Journal
              </Button>
            </div>
          </form>
        </section>

        {/* Explore Wisdom Topics */}
        <section className="lg:col-span-4 rounded-[26px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-5 sm:p-6 shadow-[var(--shadow-card)] flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
                  Explore wisdom topics
                </h2>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  Browse Bhagavad Gita verses by theme.
                </p>
              </div>
              <Link
                to="/wisdom"
                className="text-xs font-medium text-[var(--amber-strong)] hover:underline whitespace-nowrap shrink-0"
              >
                All verses
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {WISDOM_TOPICS.map((topic, idx) => {
                const style = TOPIC_SURFACES[topic];
                return (
                  <Link
                    key={topic}
                    to={`/wisdom?topic=${encodeURIComponent(topic)}`}
                    className={`rounded-[14px] ${style.bg} border border-[var(--border-subtle)] px-3.5 py-3 flex items-center justify-between gap-2 transition-colors ${
                      idx === WISDOM_TOPICS.length - 1 ? 'col-span-2' : ''
                    }`}
                  >
                    <span className={`text-xs sm:text-sm font-medium ${style.text} truncate`}>
                      {topic}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${style.text}`} />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Notifications Preview / Illustrated Empty State */}
        <section className="lg:col-span-3 rounded-[26px] bg-[var(--surface-lavender)]/65 border border-[var(--border-subtle)] p-5 sm:p-6 shadow-[var(--shadow-card)] flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[var(--lavender-strong)]" />
              <h2 className="font-display text-lg font-medium text-[var(--text-primary)]">
                Notifications
              </h2>
            </div>
            <Link
              to="/notifications"
              className="text-xs font-medium text-[var(--lavender-strong)] hover:underline whitespace-nowrap"
            >
              Inbox {unreadNotificationCount > 0 ? `(${unreadNotificationCount})` : ''}
            </Link>
          </div>

          {unreadNotifications.length > 0 ? (
            <div className="space-y-2.5 flex-1 flex flex-col justify-center">
              {unreadNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="rounded-[16px] bg-[var(--surface-main)]/85 border border-[var(--border-subtle)] p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-[var(--lavender-strong)] truncate">
                      {notif.sender}
                    </span>
                    <button
                      type="button"
                      onClick={() => markNotificationRead(notif.id, true)}
                      aria-label="Mark notification as read"
                      className="text-[11px] font-medium text-[var(--teal-strong)] hover:underline cursor-pointer shrink-0"
                    >
                      Mark read
                    </button>
                  </div>
                  <div className="text-sm font-medium text-[var(--text-primary)] line-clamp-1">
                    {notif.title}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                    {notif.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-3">
              <div className="w-24">
                <CalmHorizonOrb className="w-full h-auto" />
              </div>
              <h3 className="mt-2 font-display text-lg font-medium text-[var(--text-primary)]">
                All caught up!
              </h3>
              <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                You&apos;ve read your notifications.
              </p>
            </div>
          )}

          <Link
            to="/notifications"
            className="inline-flex items-center justify-center gap-1.5 min-h-[38px] rounded-[12px] bg-[var(--surface-main)]/75 hover:bg-[var(--surface-main)] text-xs font-medium text-[var(--text-primary)] transition-colors"
          >
            <span>Open notifications</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      </div>
    </div>
  );
};
