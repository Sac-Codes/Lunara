import React, { useState } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  artwork?: string;
  needsEdgeCrop?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  description,
  action,
  artwork,
  needsEdgeCrop = false,
}) => {
  const [imgError, setImgError] = useState(false);

  if (artwork) {
    return (
      <header className="relative overflow-hidden rounded-[24px] mb-6 md:mb-8 p-5 sm:p-7 shadow-[var(--shadow-card)] text-white">
        {!imgError ? (
          <img
            src={artwork}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className={`absolute inset-0 w-full h-full object-cover ${
              needsEdgeCrop ? 'scale-125' : 'scale-105'
            }`}
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#11163D] via-[#30205F] to-[#56348D]"
            aria-hidden="true"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(100deg, rgba(17, 22, 61, 0.88) 0%, rgba(48, 32, 95, 0.72) 58%, rgba(27, 32, 86, 0.36) 100%)',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-xs font-medium text-[#D5BCE8] mb-1.5">{eyebrow}</p>
            )}
            <h1 className="font-display text-2xl sm:text-3xl lg:text-[34px] font-medium tracking-tight text-white leading-tight">
              {title}
            </h1>
            {description && (
              <p className="mt-1.5 text-sm sm:text-[15px] text-[#F2ECF7]/88 max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0 flex items-center gap-2.5">{action}</div>}
        </div>
      </header>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6 md:mb-8">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-medium text-[var(--text-muted)] mb-1.5">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl sm:text-3xl lg:text-[34px] font-medium tracking-tight text-[var(--text-primary)] leading-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm sm:text-[15px] text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2.5">{action}</div>}
    </div>
  );
};
