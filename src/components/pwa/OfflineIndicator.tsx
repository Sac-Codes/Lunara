import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-5 left-4 z-40 flex items-center gap-2 rounded-[14px] bg-[var(--surface-amber)] border border-[#E5B26F]/40 px-3.5 py-2 text-xs font-medium text-[var(--amber-strong)] shadow-md"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>Offline mode — reflections saved on this device</span>
    </div>
  );
};
