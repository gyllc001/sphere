'use client';

import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'sphere.theme';

function readDocumentTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function applyTheme(next: Theme) {
  const root = document.documentElement;
  if (next === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // localStorage can be blocked (Safari private mode, etc.) — drop silently.
  }
}

/**
 * Reads the current theme from <html> and exposes a setter that flips both
 * the DOM class and the localStorage entry. State is seeded post-mount to
 * match whatever the FOUC-prevention script in <head> already applied.
 */
export function useTheme() {
  // Start with 'dark' on the server / first client paint to match the default
  // applied by the FOUC script. The post-mount effect snaps to reality if
  // the user previously chose 'light'.
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    setThemeState(readDocumentTheme());
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return next;
    });
  }, []);

  return { theme, setTheme, toggle };
}
