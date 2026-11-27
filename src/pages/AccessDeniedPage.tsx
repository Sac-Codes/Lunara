import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { LunaraMark } from '../components/ui/LunaraMark';

export const AccessDeniedPage: React.FC = () => {
  return (
    <div className="lunara-atmosphere min-h-dvh flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-[28px] bg-[var(--surface-main)] p-7 sm:p-9 shadow-[var(--shadow-soft)] border border-[var(--border-subtle)] text-center">
        <div className="mx-auto w-14 h-14 rounded-[18px] bg-[var(--surface-coral)] text-[var(--coral-strong)] flex items-center justify-center">
          <ShieldOff className="w-7 h-7" />
        </div>

        <div className="mt-5 inline-flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <LunaraMark className="w-5 h-5" />
          <span>Lunara Workspace</span>
        </div>

        <h1 className="mt-3 font-display text-2xl sm:text-3xl font-medium text-[var(--text-primary)]">
          Admin access required
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-[var(--text-secondary)]">
          This workspace area is reserved for authorized administrator accounts. Your personal reflection space remains completely available.
        </p>

        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              className="w-full"
            >
              Return to Home
            </Button>
          </Link>
          <Link to="/settings" className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full">
              Go to Settings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
