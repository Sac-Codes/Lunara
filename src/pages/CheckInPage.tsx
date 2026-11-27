import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { CalmHorizonOrb } from '../components/graphics/LunarArtwork';
import { AffirmationCard } from '../components/shared/AffirmationCard';
import { PageHeader } from '../components/shared/PageHeader';
import { Button, IconButton } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { MoodIcon } from '../components/ui/LunaraMark';
import {
  MOOD_DEFINITIONS,
  MOOD_MAP,
  SUGGESTED_DISLIKES,
  SUGGESTED_LIKES,
} from '../data/sampleJourney';
import { LUNARA_ARTWORK } from '../lib/atmosphere';
import { addDays, formatLongDate, toDateKey } from '../lib/date';
import { useLunara } from '../providers/LunaraProvider';
import type { MoodId } from '../types/lunara';

interface ScaleSelectorProps {
  label: string;
  description: string;
  value: number | null;
  onChange: (val: number | null) => void;
  lowLabel: string;
  highLabel: string;
  surfaceClass: string;
  activeClass: string;
  accentTextClass: string;
}

const ScaleSelector: React.FC<ScaleSelectorProps> = ({
  label,
  description,
  value,
  onChange,
  lowLabel,
  highLabel,
  surfaceClass,
  activeClass,
  accentTextClass,
}) => {
  return (
    <div className={`rounded-[22px] p-5 sm:p-6 ${surfaceClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-medium text-[var(--text-primary)]">{label}</h3>
          <p className="mt-0.5 text-xs sm:text-sm text-[var(--text-secondary)]">{description}</p>
        </div>
        <span className={`font-display text-xl font-medium tabular-nums shrink-0 ${accentTextClass}`}>
          {value !== null ? `${value} / 5` : '—'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((num) => {
          const isSelected = value === num;
          return (
            <button
              key={num}
              type="button"
              onClick={() => onChange(isSelected ? null : num)}
              aria-pressed={isSelected}
              className={`min-h-[46px] rounded-[13px] font-medium text-sm tabular-nums transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#B18ACD] active:scale-[0.97] ${
                isSelected
                  ? `${activeClass} shadow-sm`
                  : 'bg-[var(--surface-main)]/75 text-[var(--text-secondary)] hover:bg-[var(--surface-main)] hover:text-[var(--text-primary)]'
              }`}
            >
              {num}
            </button>
          );
        })}
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
};

export const CheckInPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    getCheckInByDate,
    saveCheckIn,
    deleteCheckIn,
    parameters,
    adminConfig,
    resolvedTheme,
    reflectionPrompts,
    showToast,
  } = useLunara();

  const checkInPrompt = useMemo(() => {
    const candidates = reflectionPrompts.filter(
      (p) => p.active && (p.placement === 'check-in' || p.placement === 'both')
    );
    if (candidates.length === 0) return null;
    return candidates[new Date().getDate() % candidates.length];
  }, [reflectionPrompts]);

  const todayKey = toDateKey();
  const paramDate = searchParams.get('date');
  const activeDate = paramDate && /^\d{4}-\d{2}-\d{2}$/.test(paramDate) ? paramDate : todayKey;

  const existing = getCheckInByDate(activeDate);

  const [mood, setMood] = useState<MoodId | null>(existing?.mood ?? null);
  const [happiness, setHappiness] = useState<number | null>(existing?.happiness ?? null);
  const [energy, setEnergy] = useState<number | null>(existing?.energy ?? null);
  const [stress, setStress] = useState<number | null>(existing?.stress ?? null);
  const [likes, setLikes] = useState<string[]>(existing?.likes ?? []);
  const [dislikes, setDislikes] = useState<string[]>(existing?.dislikes ?? []);
  const [notes, setNotes] = useState<string>(existing?.notes ?? '');
  const [customValues, setCustomValues] = useState<Record<string, string | number>>(
    existing?.customValues ?? {}
  );

  const [customLikeInput, setCustomLikeInput] = useState('');
  const [customDislikeInput, setCustomDislikeInput] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [completedState, setCompletedState] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    const entry = getCheckInByDate(activeDate);
    setMood(entry?.mood ?? null);
    setHappiness(entry?.happiness ?? null);
    setEnergy(entry?.energy ?? null);
    setStress(entry?.stress ?? null);
    setLikes(entry?.likes ?? []);
    setDislikes(entry?.dislikes ?? []);
    setNotes(entry?.notes ?? '');
    setCustomValues(entry?.customValues ?? {});
    setValidationMessage('');
    setCompletedState(false);
  }, [activeDate, getCheckInByDate]);

  const enabledCustomParams = useMemo(
    () =>
      parameters
        .filter((p) => !p.isCore && p.enabled)
        .sort((a, b) => a.order - b.order),
    [parameters]
  );

  const allLikeOptions = useMemo(
    () => Array.from(new Set([...SUGGESTED_LIKES, ...likes])),
    [likes]
  );

  const allDislikeOptions = useMemo(
    () => Array.from(new Set([...SUGGESTED_DISLIKES, ...dislikes])),
    [dislikes]
  );

  const toggleTag = (
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    tag: string
  ) => {
    setList((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
  };

  const addCustomTag = (
    input: string,
    setInput: React.Dispatch<React.SetStateAction<string>>,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (!list.includes(trimmed)) {
      setList((prev) => [...prev, trimmed]);
    }
    setInput('');
  };

  const handleDateShift = (delta: number) => {
    const nextDate = addDays(activeDate, delta);
    if (nextDate > todayKey) return;
    setSearchParams({ date: nextDate });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const hasAnyInput =
      mood !== null ||
      happiness !== null ||
      energy !== null ||
      stress !== null ||
      likes.length > 0 ||
      dislikes.length > 0 ||
      notes.trim().length > 0 ||
      Object.keys(customValues).length > 0;

    if (!hasAnyInput) {
      setValidationMessage('Choose at least one mood, scale, tag, or note before saving.');
      return;
    }

    setValidationMessage('');
    setIsSaving(true);

    window.setTimeout(() => {
      saveCheckIn({
        date: activeDate,
        mood,
        happiness,
        energy,
        stress,
        likes,
        dislikes,
        notes: notes.trim(),
        customValues,
      });
      setIsSaving(false);
      setCompletedState(true);
      showToast(existing ? 'Check-in updated.' : 'Daily check-in saved.', 'teal');
    }, 220);
  };

  const handleDelete = () => {
    deleteCheckIn(activeDate);
    setConfirmDeleteOpen(false);
    showToast('Check-in removed for this day.', 'lavender');
    navigate('/');
  };

  if (completedState) {
    const savedMood = mood ? MOOD_MAP[mood] : null;
    return (
      <div className="max-w-2xl mx-auto py-4">
        <div className="rounded-[28px] bg-[var(--surface-teal)] p-7 sm:p-10 shadow-[var(--shadow-soft)] text-center">
          <div className="w-36 mx-auto">
            <CalmHorizonOrb className="w-full h-auto" />
          </div>
          <h1 className="mt-3 font-display text-3xl font-medium text-[var(--text-primary)]">
            Thank you for checking in.
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
            Your reflection for {formatLongDate(activeDate)} is saved on this device.
            {savedMood ? ` ${savedMood.emoji} Recorded as ${savedMood.label.toLowerCase()}.` : ''}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link to="/">
              <Button variant="teal" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Back to Home
              </Button>
            </Link>
            <Link to={`/journal?new=1&date=${activeDate}`}>
              <Button variant="outline" size="md" leftIcon={<BookOpen className="w-4 h-4" />}>
                Add a journal note
              </Button>
            </Link>
            <Button variant="ghost" size="md" onClick={() => setCompletedState(false)}>
              Keep editing
            </Button>
          </div>
        </div>

        <div className="mt-5">
          <AffirmationCard tone="lavender" compact label="For the rest of your day" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        eyebrow={activeDate === todayKey ? "Today's check-in" : 'Past day check-in'}
        title="How is your day feeling?"
        description="Check in at your own pace. Leave any section blank if it doesn't apply today."
        artwork={LUNARA_ARTWORK.morning}
        action={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-[10px] bg-white/14 hover:bg-white/22 text-xs font-medium text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        }
      />

      {/* Date Navigation Strip */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-[var(--surface-blue)] px-4 sm:px-5 py-3">
        <div className="flex items-center gap-2">
          <IconButton
            label="Previous day"
            variant="surface"
            size="sm"
            onClick={() => handleDateShift(-1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </IconButton>

          <div className="px-2">
            <div className="text-sm font-medium text-[var(--text-primary)]">
              {formatLongDate(activeDate)}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              {activeDate === todayKey ? 'Today' : existing ? 'Editing saved entry' : 'Recording past day'}
            </div>
          </div>

          <IconButton
            label="Next day"
            variant="surface"
            size="sm"
            disabled={activeDate >= todayKey}
            onClick={() => handleDateShift(1)}
          >
            <ChevronRight className="w-4 h-4" />
          </IconButton>
        </div>

        <input
          type="date"
          max={todayKey}
          value={activeDate}
          onChange={(e) => e.target.value && setSearchParams({ date: e.target.value })}
          aria-label="Choose check-in date"
          className="min-h-[40px] rounded-[12px] bg-[var(--surface-main)] border border-[var(--border-subtle)] px-3 text-xs font-medium text-[var(--text-primary)] focus:outline-2 focus:outline-[#78A6E7]"
        />
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Mood Selection */}
        <section className="rounded-[24px] bg-[var(--surface-main)] p-5 sm:p-7 shadow-[var(--shadow-card)]">
          <div className="flex items-baseline justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
                Overall mood
              </h2>
              <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                Pick whichever word feels closest right now.
              </p>
            </div>
            {mood && (
              <button
                type="button"
                onClick={() => setMood(null)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MOOD_DEFINITIONS.map((m) => {
              const selected = mood === m.id;
              const surfaceBg = resolvedTheme === 'dark' ? m.surfaceDark : m.surfaceLight;
              const textColor = resolvedTheme === 'dark' ? m.textDark : m.textLight;

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMood(selected ? null : m.id)}
                  aria-pressed={selected}
                  style={
                    selected
                      ? {
                          backgroundColor: surfaceBg,
                          borderColor: m.accentHex,
                        }
                      : undefined
                  }
                  className={`text-left rounded-[18px] p-4 border transition-all duration-150 cursor-pointer active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#B18ACD] ${
                    selected
                      ? 'shadow-sm'
                      : 'bg-[var(--surface-secondary)]/70 border-transparent hover:bg-[var(--surface-secondary)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="w-9 h-9 rounded-[11px] flex items-center justify-center"
                      style={{
                        backgroundColor: selected ? `${m.accentHex}30` : 'var(--surface-main)',
                        color: selected ? textColor : m.accentHex,
                      }}
                    >
                      <MoodIcon mood={m.id} className="w-[18px] h-[18px]" />
                    </span>
                    <span className="text-lg leading-none" aria-hidden="true">
                      {m.emoji}
                    </span>
                  </div>
                  <div
                    className="mt-3 font-display text-base font-medium flex items-center justify-between gap-2"
                    style={{ color: selected ? textColor : 'var(--text-primary)' }}
                  >
                    <span>{m.label}</span>
                    {selected && <Check className="w-4 h-4 shrink-0" aria-hidden="true" />}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--text-secondary)] leading-snug">
                    {m.description}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Happiness, Energy, Stress Scales */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ScaleSelector
            label="Happiness"
            description="Warmth or contentment felt"
            value={happiness}
            onChange={setHappiness}
            lowLabel="Very low"
            highLabel="Bright"
            surfaceClass="bg-[var(--surface-teal)]"
            activeClass="bg-[#3D7D70] text-white dark:bg-[#76BBAA] dark:text-[#132421]"
            accentTextClass="text-[var(--teal-strong)]"
          />

          <ScaleSelector
            label="Energy"
            description="Physical & mental capacity"
            value={energy}
            onChange={setEnergy}
            lowLabel="Depleted"
            highLabel="Rested"
            surfaceClass="bg-[var(--surface-amber)]"
            activeClass="bg-[#9A692C] text-white dark:bg-[#E5B26F] dark:text-[#23190B]"
            accentTextClass="text-[var(--amber-strong)]"
          />

          <ScaleSelector
            label="Stress"
            description="Pressure or tension carried"
            value={stress}
            onChange={setStress}
            lowLabel="Calm"
            highLabel="Heavy"
            surfaceClass="bg-[var(--surface-coral)]"
            activeClass="bg-[#A85D56] text-white dark:bg-[#DF9189] dark:text-[#241315]"
            accentTextClass="text-[var(--coral-strong)]"
          />
        </section>

        {/* Optional Custom Parameters configured in Workspace */}
        {enabledCustomParams.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enabledCustomParams.map((param) => {
              const current = customValues[param.id];
              if (param.type === 'scale') {
                return (
                  <ScaleSelector
                    key={param.id}
                    label={param.name}
                    description={param.description}
                    value={typeof current === 'number' ? current : null}
                    onChange={(val) =>
                      setCustomValues((prev) => {
                        const next = { ...prev };
                        if (val === null) delete next[param.id];
                        else next[param.id] = val;
                        return next;
                      })
                    }
                    lowLabel={param.scaleLabels?.[0] || 'Low'}
                    highLabel={param.scaleLabels?.[1] || 'High'}
                    surfaceClass="bg-[var(--surface-lavender)]"
                    activeClass="bg-[#795D96] text-white dark:bg-[#B18ACD] dark:text-[#17131F]"
                    accentTextClass="text-[var(--lavender-strong)]"
                  />
                );
              }
              return (
                <div key={param.id} className="rounded-[22px] bg-[var(--surface-lavender)] p-5 sm:p-6">
                  <label
                    htmlFor={`custom-${param.id}`}
                    className="block font-display text-lg font-medium text-[var(--text-primary)]"
                  >
                    {param.name}
                  </label>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{param.description}</p>
                  <input
                    id={`custom-${param.id}`}
                    type="text"
                    value={typeof current === 'string' ? current : ''}
                    onChange={(e) =>
                      setCustomValues((prev) => ({ ...prev, [param.id]: e.target.value }))
                    }
                    placeholder="Add a brief note..."
                    className="mt-3 w-full min-h-[44px] rounded-[12px] bg-[var(--surface-main)] border border-[var(--border-subtle)] px-3.5 text-sm text-[var(--text-primary)] focus:outline-2 focus:outline-[#B18ACD]"
                  />
                </div>
              );
            })}
          </section>
        )}

        {/* Likes & Dislikes */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Likes */}
          <div className="rounded-[24px] bg-[var(--surface-rose)] p-5 sm:p-6">
            <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
              What did you enjoy today?
            </h2>
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
              Moments, comforts, or small things that felt good.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {allLikeOptions.map((item) => {
                const selected = likes.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleTag(setLikes, item)}
                    aria-pressed={selected}
                    className={`min-h-[40px] px-3.5 py-2 rounded-[12px] text-xs sm:text-sm font-medium transition-all cursor-pointer active:scale-[0.97] ${
                      selected
                        ? 'bg-[#9E6686] text-white dark:bg-[#D99EBB] dark:text-[#23151D] shadow-xs'
                        : 'bg-[var(--surface-main)]/75 text-[var(--text-secondary)] hover:bg-[var(--surface-main)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            {adminConfig.allowCustomTags && (
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="text"
                  value={customLikeInput}
                  onChange={(e) => setCustomLikeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomTag(customLikeInput, setCustomLikeInput, likes, setLikes);
                    }
                  }}
                  placeholder="Add something else you enjoyed..."
                  aria-label="Add custom thing you enjoyed"
                  className="flex-1 min-w-0 min-h-[44px] rounded-[12px] bg-[var(--surface-main)] border border-[var(--border-subtle)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-2 focus:outline-[#D99EBB]"
                />
                <Button
                  type="button"
                  variant="rose"
                  size="sm"
                  onClick={() => addCustomTag(customLikeInput, setCustomLikeInput, likes, setLikes)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add
                </Button>
              </div>
            )}
          </div>

          {/* Dislikes */}
          <div className="rounded-[24px] bg-[var(--surface-main)] p-5 sm:p-6 shadow-[var(--shadow-card)]">
            <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
              What didn&apos;t feel so good?
            </h2>
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
              Drains, friction, or anything that weighed on your day.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {allDislikeOptions.map((item) => {
                const selected = dislikes.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleTag(setDislikes, item)}
                    aria-pressed={selected}
                    className={`min-h-[40px] px-3.5 py-2 rounded-[12px] text-xs sm:text-sm font-medium transition-all cursor-pointer active:scale-[0.97] ${
                      selected
                        ? 'bg-[#A85D56] text-white dark:bg-[#DF9189] dark:text-[#241315] shadow-xs'
                        : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            {adminConfig.allowCustomTags && (
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="text"
                  value={customDislikeInput}
                  onChange={(e) => setCustomDislikeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomTag(customDislikeInput, setCustomDislikeInput, dislikes, setDislikes);
                    }
                  }}
                  placeholder="Add something that felt heavy..."
                  aria-label="Add custom friction point"
                  className="flex-1 min-w-0 min-h-[44px] rounded-[12px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-2 focus:outline-[#DF9189]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    addCustomTag(customDislikeInput, setCustomDislikeInput, dislikes, setDislikes)
                  }
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Free-form Reflection Notes */}
        <section className="rounded-[24px] bg-[var(--surface-main)] p-5 sm:p-7 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="checkin-notes"
              className="font-display text-xl font-medium text-[var(--text-primary)]"
            >
              A short note for yourself
            </label>
            <span className="text-xs text-[var(--text-muted)]">Optional</span>
          </div>
          {checkInPrompt && (
            <p className="mt-1 text-xs sm:text-sm text-[var(--lavender-strong)]">
              Gentle prompt: {checkInPrompt.text}
            </p>
          )}
          <textarea
            id="checkin-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Anything else worth remembering about today..."
            className="mt-3 w-full rounded-[16px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] p-4 text-[15px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-2 focus:outline-[#B18ACD]"
          />
        </section>

        {validationMessage && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-[16px] bg-[var(--surface-amber)] px-4 py-3 text-sm text-[var(--amber-strong)]"
          >
            <span>{validationMessage}</span>
            <button
              type="button"
              onClick={() => setValidationMessage('')}
              aria-label="Dismiss validation notice"
              className="p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            {existing && (
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setConfirmDeleteOpen(true)}
                leftIcon={<Trash2 className="w-4 h-4 text-[var(--coral-strong)]" />}
              >
                Remove entry
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <Button type="button" variant="outline" size="md" onClick={() => navigate('/')}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSaving}
              leftIcon={<Check className="w-4 h-4" />}
            >
              {existing ? 'Update check-in' : 'Save check-in'}
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Remove this check-in?"
        description={`This will remove your recorded check-in for ${formatLongDate(activeDate)} from this device.`}
        confirmLabel="Remove"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
};
