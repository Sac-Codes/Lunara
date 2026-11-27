import React, { useMemo, useState } from 'react';
import { Heart, RefreshCw, Sparkles } from 'lucide-react';
import { LUNARA_ARTWORK } from '../../lib/atmosphere';
import { useLunara } from '../../providers/LunaraProvider';

interface AffirmationCardProps {
  tone?: 'lavender' | 'rose' | 'teal';
  compact?: boolean;
  label?: string;
}

export const AffirmationCard: React.FC<AffirmationCardProps> = ({
  tone = 'lavender',
  compact = false,
  label = 'Daily affirmation',
}) => {
  const {
    publishedAffirmations,
    affirmationLoading,
    affirmationError,
    refreshAffirmations,
    favoriteAffirmationIds,
    toggleFavoriteAffirmation,
    showToast,
  } = useLunara();
  const [offset, setOffset] = useState<number>(0);
  const [imgError, setImgError] = useState(false);

  const dailyIndex = useMemo(() => {
    if (publishedAffirmations.length === 0) return 0;
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    return dayOfYear % publishedAffirmations.length;
  }, [publishedAffirmations.length]);

  if (publishedAffirmations.length === 0) {
    return (
      <section
        role={affirmationError ? 'alert' : 'status'}
        aria-live="polite"
        className="rounded-[26px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-6 text-center text-sm text-[var(--text-secondary)]"
      >
        {affirmationLoading
          ? 'Loading today’s affirmation…'
          : affirmationError
            ? (
                <div className="space-y-2">
                  <p>{affirmationError}</p>
                  <button
                    type="button"
                    onClick={() => void refreshAffirmations()}
                    className="font-medium text-[var(--blue-strong)] hover:underline"
                  >
                    Retry
                  </button>
                </div>
              )
            : 'No shared affirmation is available today.'}
      </section>
    );
  }

  const current = publishedAffirmations[(dailyIndex + offset) % publishedAffirmations.length];
  const isFavorite = favoriteAffirmationIds.includes(current.id);

  const handleRefresh = () => {
    if (publishedAffirmations.length <= 1) return;
    setOffset((prev) => (prev + 1) % publishedAffirmations.length);
  };

  const handleToggleFavorite = () => {
    const nextFav = !isFavorite;
    toggleFavoriteAffirmation(current.id);
    showToast(
      nextFav ? 'Saved to your favorite affirmations.' : 'Removed from favorites.',
      'rose'
    );
  };

  const fallbackBg =
    tone === 'rose'
      ? 'from-[#42284B] via-[#56348D] to-[#935376]'
      : tone === 'teal'
        ? 'from-[#1E3B4A] via-[#203160] to-[#326E62]'
        : 'from-[#30205F] via-[#56348D] to-[#935376]';

  return (
    <section
      aria-label="Daily gentle affirmation"
      className={`relative overflow-hidden rounded-[26px] ${
        compact ? 'min-h-[190px] p-5 sm:p-6' : 'h-full min-h-[270px] p-6 sm:p-7'
      } shadow-[var(--shadow-soft)] flex flex-col justify-between gap-5 text-white`}
    >
      {/* Atmospheric Lotus & Twilight Sky Artwork */}
      <div className={`absolute inset-0 bg-gradient-to-br ${fallbackBg}`} aria-hidden="true">
        {!imgError && (
          <img
            src={LUNARA_ARTWORK.lotusAffirmation}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover opacity-85"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(165deg, rgba(27, 32, 86, 0.72) 0%, rgba(48, 32, 95, 0.62) 48%, rgba(17, 22, 61, 0.84) 100%)',
          }}
        />
      </div>

      {/* Top Metadata + Favorite */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-[#F4CFE0]">
          <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#F6DCA9]" aria-hidden="true" />
          <span>{label}</span>
          <span aria-hidden="true">·</span>
          <span className="text-[#D9C4FA]">{current.category}</span>
        </div>

        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-label={isFavorite ? 'Remove from favorite affirmations' : 'Favorite affirmation'}
          aria-pressed={isFavorite}
          className={`w-9 h-9 rounded-[11px] flex items-center justify-center transition-all cursor-pointer shrink-0 ${
            isFavorite
              ? 'bg-[#D99EBB] text-[#23151D] shadow-sm'
              : 'bg-white/14 text-white/85 hover:bg-white/22 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Centered Editorial Affirmation */}
      <div className="relative z-10 my-auto text-center px-1">
        <p
          className={`font-display font-medium text-white leading-snug drop-shadow-xs ${
            compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-[26px]'
          }`}
        >
          &ldquo;{current.text}&rdquo;
        </p>
      </div>

      {/* Action Footer */}
      <div className="relative z-10 flex items-center justify-center">
        {publishedAffirmations.length > 1 && (
          <button
            type="button"
            onClick={handleRefresh}
            aria-label="Show another affirmation"
            className="inline-flex items-center gap-2 min-h-[40px] px-4 rounded-[12px] bg-white/14 hover:bg-white/24 backdrop-blur-sm text-xs font-medium text-white transition-all cursor-pointer active:scale-[0.98]"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Another one</span>
          </button>
        )}
      </div>
    </section>
  );
};
