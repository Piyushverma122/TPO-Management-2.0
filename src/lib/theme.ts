export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'tpo-theme';

export const getStoredTheme = (): ThemeMode => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
};

/** Switches the <html> class and remembers the choice. */
export const applyTheme = (mode: ThemeMode) => {
  document.documentElement.classList.toggle('dark', mode === 'dark');
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* storage unavailable, theme just will not persist */
  }
  window.dispatchEvent(new CustomEvent('tpo-theme-change', { detail: mode }));
};
