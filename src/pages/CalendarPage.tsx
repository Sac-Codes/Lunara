import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  PenLine,
} from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';
import { Button, IconButton } from '../components/ui/Button';
import { MoodIcon } from '../components/ui/LunaraMark';
import { MOOD_MAP } from '../data/sampleJourney';
import { LUNARA_ARTWORK } from '../lib/atmosphere';
import {
  countWords,
  formatLongDate,
  getMonthDays,
  parseDateKey,
  toDateKey,
} from '../lib/date';
import { useLunara } from '../providers/LunaraProvider';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { checkIns, journals, resolvedTheme, dailyWisdom } = useLunara();

  const todayKey = toDateKey();
  const paramDate = searchParams.get('date');
  const initialDate = paramDate && /^\d{4}-\d{2}-\d{2}$/.test(paramDate) ? paramDate : todayKey;

  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [viewYear, setViewYear] = useState<number>(() => parseDateKey(initialDate).getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => parseDateKey(initialDate).getMonth());

  useEffect(() => {
    if (paramDate && /^\d{4}-\d{2}-\d{2}$/.test(paramDate)) {
      setSelectedDate(paramDate);
      const d = parseDateKey(paramDate);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [paramDate]);

  const checkInByDate = useMemo(() => {
    const map = new Map<string, (typeof checkIns)[number]>();
    checkIns.forEach((c) => map.set(c.date, c));
    return map;
  }, [checkIns]);

  const journalsByDate = useMemo(() => {
    const map = new Map<string, typeof journals>();
    journals.forEach((j) => {
      const list = map.get(j.date) || [];
      list.push(j);
      map.set(j.date, list);
    });
    return map;
  }, [journals]);

  const monthCells = useMemo(() => getMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const monthLabel = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [viewYear, viewMonth]);

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const jumpToToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDate(todayKey);
    setSearchParams({});
  };

  const selectedCheckIn = checkInByDate.get(selectedDate);
  const selectedJournals = journalsByDate.get(selectedDate) || [];
  const selectedMoodDef = selectedCheckIn?.mood ? MOOD_MAP[selectedCheckIn.mood] : null;
  const isFutureDate = selectedDate > todayKey;

  return (
    <div>
      <PageHeader
        eyebrow="Calendar"
        title="Revisit your days"
        description="Browse past check-ins and journal notes across the month."
        artwork={LUNARA_ARTWORK.afternoon}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Monthly Grid — Twilight Blue Visual Identity */}
        <section className="lg:col-span-7 rounded-[28px] bg-[var(--surface-blue)] p-5 sm:p-7 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 className="font-display text-2xl sm:text-[26px] font-medium text-[var(--text-primary)]">
              {monthLabel}
            </h2>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={jumpToToday}>
                Today
              </Button>
              <IconButton
                label="Previous month"
                variant="surface"
                size="sm"
                onClick={() => shiftMonth(-1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </IconButton>
              <IconButton
                label="Next month"
                variant="surface"
                size="sm"
                onClick={() => shiftMonth(1)}
              >
                <ChevronRight className="w-4 h-4" />
              </IconButton>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-xs font-medium text-[var(--text-secondary)] py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {monthCells.map((cell) => {
              const ci = checkInByDate.get(cell.dateKey);
              const dayJournals = journalsByDate.get(cell.dateKey);
              const moodDef = ci?.mood ? MOOD_MAP[ci.mood] : null;
              const isSelected = selectedDate === cell.dateKey;
              const isToday = todayKey === cell.dateKey;

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => {
                    setSelectedDate(cell.dateKey);
                    if (!cell.inCurrentMonth) {
                      const d = parseDateKey(cell.dateKey);
                      setViewYear(d.getFullYear());
                      setViewMonth(d.getMonth());
                    }
                  }}
                  aria-label={`${formatLongDate(cell.dateKey)}${ci ? ', has check-in' : ''}${
                    dayJournals?.length ? ', has journal entry' : ''
                  }`}
                  aria-pressed={isSelected}
                  className={`relative flex flex-col items-center justify-between min-h-[52px] sm:min-h-[64px] p-1.5 sm:p-2 rounded-[14px] transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#78A6E7] ${
                    isSelected
                      ? 'bg-[#304A70] text-white dark:bg-[#78A6E7] dark:text-[#152031] shadow-sm'
                      : cell.inCurrentMonth
                        ? 'bg-[var(--surface-main)]/75 text-[var(--text-primary)] hover:bg-[var(--surface-main)]'
                        : 'bg-[var(--surface-main)]/30 text-[var(--text-muted)] opacity-60 hover:opacity-90'
                  } ${isToday && !isSelected ? 'ring-2 ring-[#78A6E7]' : ''}`}
                >
                  <span className="tabular-nums text-xs sm:text-sm font-medium">
                    {cell.dayNumber}
                  </span>

                  <div className="flex items-center justify-center gap-1 h-2.5">
                    {ci && (
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: moodDef
                            ? moodDef.accentHex
                            : isSelected
                              ? 'currentColor'
                              : '#B18ACD',
                        }}
                        aria-hidden="true"
                      />
                    )}
                    {dayJournals && dayJournals.length > 0 && (
                      <span
                        className="w-2 h-2 rounded-xs bg-[#D99EBB]"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-5 text-xs text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#76BBAA]" aria-hidden="true" />
              Check-in mood
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#D99EBB]" aria-hidden="true" />
              Journal note
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm ring-2 ring-[#78A6E7]" aria-hidden="true" />
              Today
            </span>
          </div>
        </section>

        {/* Selected Day Detail Panel */}
        <aside className="lg:col-span-5 space-y-5">
          <div className="rounded-[24px] bg-[var(--surface-main)] p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[var(--blue-strong)]">
                  {selectedDate === todayKey ? 'Today' : isFutureDate ? 'Upcoming day' : 'Selected day'}
                </p>
                <h3 className="mt-1 font-display text-xl sm:text-2xl font-medium text-[var(--text-primary)]">
                  {formatLongDate(selectedDate)}
                </h3>
              </div>
            </div>

            {selectedCheckIn ? (
              <div className="mt-5 space-y-4">
                {selectedMoodDef && selectedCheckIn.mood && (
                  <div
                    className="flex items-center gap-3.5 rounded-[16px] p-3.5"
                    style={{
                      backgroundColor:
                        resolvedTheme === 'dark'
                          ? selectedMoodDef.surfaceDark
                          : selectedMoodDef.surfaceLight,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${selectedMoodDef.accentHex}30`,
                        color:
                          resolvedTheme === 'dark'
                            ? selectedMoodDef.textDark
                            : selectedMoodDef.textLight,
                      }}
                    >
                      <MoodIcon mood={selectedCheckIn.mood} className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-secondary)]">Mood</div>
                      <div
                        className="font-display text-lg font-medium"
                        style={{
                          color:
                            resolvedTheme === 'dark'
                              ? selectedMoodDef.textDark
                              : selectedMoodDef.textLight,
                        }}
                      >
                        {selectedMoodDef.label}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Happiness', val: selectedCheckIn.happiness, bg: 'bg-[var(--surface-teal)]', text: 'text-[var(--teal-strong)]' },
                    { label: 'Energy', val: selectedCheckIn.energy, bg: 'bg-[var(--surface-amber)]', text: 'text-[var(--amber-strong)]' },
                    { label: 'Stress', val: selectedCheckIn.stress, bg: 'bg-[var(--surface-coral)]', text: 'text-[var(--coral-strong)]' },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-[14px] p-3 ${item.bg}`}>
                      <div className="text-[11px] text-[var(--text-secondary)]">{item.label}</div>
                      <div className={`mt-1 font-display text-lg font-medium tabular-nums ${item.text}`}>
                        {item.val ?? '—'} / 5
                      </div>
                    </div>
                  ))}
                </div>

                {selectedCheckIn.likes.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-[var(--text-muted)]">Enjoyed</div>
                    <p className="mt-1 text-sm text-[var(--text-primary)]">
                      {selectedCheckIn.likes.join(' · ')}
                    </p>
                  </div>
                )}

                {selectedCheckIn.dislikes.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-[var(--text-muted)]">Felt heavy</div>
                    <p className="mt-1 text-sm text-[var(--text-primary)]">
                      {selectedCheckIn.dislikes.join(' · ')}
                    </p>
                  </div>
                )}

                {selectedCheckIn.notes && (
                  <div className="rounded-[16px] bg-[var(--surface-secondary)] p-4">
                    <div className="text-xs font-medium text-[var(--text-muted)] mb-1">Note</div>
                    <p className="text-sm leading-relaxed text-[var(--text-primary)]">
                      {selectedCheckIn.notes}
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <Link to={`/check-in?date=${selectedDate}`}>
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<PenLine className="w-3.5 h-3.5" />}
                    >
                      Edit check-in
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-[18px] bg-[var(--surface-secondary)] p-5">
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {isFutureDate
                    ? 'This day is still ahead. Check-ins open once the day arrives.'
                    : 'No check-in was recorded for this day.'}
                </p>
                {!isFutureDate && (
                  <div className="mt-4">
                    <Link to={`/check-in?date=${selectedDate}`}>
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<PenLine className="w-3.5 h-3.5" />}
                      >
                        Add check-in for this day
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Journal Entries for Selected Day */}
          <div className="rounded-[24px] bg-[var(--surface-rose)] p-6">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-display text-lg font-medium text-[var(--text-primary)]">
                Journal notes
              </h4>
              {!isFutureDate && (
                <Link
                  to={`/journal?new=1&date=${selectedDate}`}
                  className="text-xs font-medium text-[var(--rose-strong)] hover:underline"
                >
                  Write entry
                </Link>
              )}
            </div>

            {selectedJournals.length > 0 ? (
              <div className="mt-4 space-y-3">
                {selectedJournals.map((entry) => (
                  <Link
                    key={entry.id}
                    to={`/journal?entry=${entry.id}`}
                    className="block rounded-[16px] bg-[var(--surface-main)]/80 p-4 hover:bg-[var(--surface-main)] transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-base font-medium text-[var(--text-primary)] group-hover:text-[var(--rose-strong)] transition-colors">
                        {entry.title}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--rose-strong)] shrink-0" />
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2">
                      {entry.content}
                    </p>
                    <div className="mt-2 text-[11px] text-[var(--text-muted)] tabular-nums">
                      {countWords(entry.content)} words
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[var(--text-secondary)] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[var(--rose-strong)] shrink-0" />
                <span>No journal entry written on this date.</span>
              </p>
            )}
          </div>

          {dailyWisdom && (
            <Link
              to="/wisdom"
              className="block rounded-[20px] bg-[var(--surface-amber)] p-5 hover:opacity-95 transition-opacity"
            >
              <div className="flex items-center justify-between gap-2 text-xs font-medium text-[var(--amber-strong)]">
                <span className="inline-flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Wisdom · Gita {dailyWisdom.chapter}:{dailyWisdom.verse}</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
              <p className="mt-1.5 text-sm font-medium text-[var(--text-primary)]">
                {dailyWisdom.takeaway}
              </p>
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
};
