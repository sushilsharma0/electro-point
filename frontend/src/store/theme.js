import { create } from 'zustand';

const KEY = 'ep_theme';

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

function initialTheme() {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem(KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const useThemeStore = create((set, get) => ({
  theme: typeof window === 'undefined' ? 'light' : initialTheme(),
  setTheme: (theme) => {
    localStorage.setItem(KEY, theme);
    applyTheme(theme);
    set({ theme });
  },
  toggle: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
  hydrate: () => {
    const theme = initialTheme();
    applyTheme(theme);
    set({ theme });
  },
}));
