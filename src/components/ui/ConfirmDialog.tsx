import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button, IconButton } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md rounded-[24px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h3 id="confirm-dialog-title" className="font-display text-xl font-medium text-[var(--text-primary)]">
            {title}
          </h3>
          <IconButton label="Close dialog" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </IconButton>
        </div>
        <p className="mt-2.5 text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'destructive' : 'primary'} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
