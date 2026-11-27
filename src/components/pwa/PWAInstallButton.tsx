import React, { useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Button, IconButton } from '../ui/Button';

interface PWAInstallButtonProps {
  compact?: boolean;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    if (compact) {
      return (
        <IconButton
          label="Install Lunara app"
          variant="blue"
          size="sm"
          onClick={install}
          className={className}
        >
          <Download className="w-4 h-4" />
        </IconButton>
      );
    }

    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={install}
        leftIcon={<Download className="w-4 h-4" />}
        className={`w-full ${className}`}
      >
        Install Lunara
      </Button>
    );
  }

  if (isIOS) {
    return (
      <>
        {compact ? (
          <IconButton
            label="Install Lunara on iOS"
            variant="blue"
            size="sm"
            onClick={() => setShowIOSGuide(true)}
            className={className}
          >
            <Smartphone className="w-4 h-4" />
          </IconButton>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowIOSGuide(true)}
            leftIcon={<Smartphone className="w-4 h-4" />}
            className={`w-full ${className}`}
          >
            Add to Home Screen
          </Button>
        )}

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div className="w-full max-w-sm rounded-[24px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <h3 id="ios-install-title" className="font-display text-xl font-medium text-[var(--text-primary)]">
                  Install Lunara on iOS
                </h3>
                <IconButton label="Close guide" size="sm" onClick={() => setShowIOSGuide(false)}>
                  <X className="w-4 h-4" />
                </IconButton>
              </div>
              <ol className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
                <li className="flex items-start gap-2.5">
                  <span className="tabular-nums font-semibold text-[var(--lavender-strong)]">1.</span>
                  <span>
                    Tap the <strong className="text-[var(--text-primary)] inline-flex items-center gap-1">Share <Share className="w-3.5 h-3.5 inline" /></strong> button in Safari&apos;s toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="tabular-nums font-semibold text-[var(--lavender-strong)]">2.</span>
                  <span>
                    Scroll down and select <strong className="text-[var(--text-primary)]">Add to Home Screen</strong>.
                  </span>
                </li>
              </ol>
              <div className="mt-6">
                <Button variant="primary" size="sm" onClick={() => setShowIOSGuide(false)} className="w-full">
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
