'use client';

import { useEffect } from 'react';

/**
 * useSessionRefresh()
 *
 * Call once in the dashboard layout or root layout.
 * Silently refreshes the wallet session cookie on:
 *   - App mount
 *   - Tab visibility change (tab regains focus)
 *   - Every 6 hours while active
 *
 * Extends effective session lifetime as long as the member uses the platform
 * without requiring full wallet re-authentication.
 */
export function useSessionRefresh() {
  useEffect(() => {
    const refresh = async () => {
      try {
        await fetch('/api/auth/wallet', { method: 'GET' });
      } catch {
        // Non-fatal — session expires naturally
      }
    };

    refresh();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const interval = setInterval(refresh, 6 * 60 * 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(interval);
    };
  }, []);
}
