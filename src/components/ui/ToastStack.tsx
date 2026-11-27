import React from 'react';
import { Check, X } from 'lucide-react';
import { useLunara, type ToastMessage } from '../../providers/LunaraProvider';

const TONE_MAP: Record<NonNullable<ToastMessage['tone']>, string> = {
  lavender: 'bg-[var(--surface-lavender)] text-[var(--text-primary)] border-[#B18ACD]/35',
  teal: 'bg-[var(--surface-teal)] text-[var(--text-primary)] border-[#76BBAA]/35',
  blue: 'bg-[var(--surface-blue)] text-[var(--text-primary)] border-[#78A6E7]/35',
  rose: 'bg-[var(--surface-rose)] text-[var(--text-primary)] border-[#D99EBB]/35',
  amber: 'bg-[var(--surface-amber)] text-[var(--text-primary)] border-[#E5B26F]/35',
};

export const ToastStack: React.FC = () => {
  const { toasts, dismissToast } = useLunara();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-22 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-[calc(100vw-2rem)] sm:max-w-sm pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 rounded-[16px] border px-4 py-3 text-sm font-medium shadow-lg transition-all duration-200 ${TONE_MAP[toast.tone || 'lavender']}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Check className="w-4 h-4 shrink-0 text-[var(--lavender-strong)]" aria-hidden="true" />
            <span className="truncate">{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss message"
            className="p-1 rounded-lg opacity-70 hover:opacity-100 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
