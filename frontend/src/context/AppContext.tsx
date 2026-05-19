import React, { createContext, useContext, useEffect, useState } from 'react';
import { type Locale, t as translate, detectBrowserLocale } from '../i18n';

// ── Types ──────────────────────────────────────────────────────────────────────
export type Theme = 'light' | 'dark';

interface AppContextValue {
  // Thème
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  // Langue
  locale: Locale;
  setLocale: (locale: Locale) => void;
  // Fonction de traduction (racccourci)
  t: (key: string, params?: Record<string, string | number>) => string;
}

// ── Constantes ──────────────────────────────────────────────────────────────────
const THEME_STORAGE_KEY = 'hrms-theme';
const LOCALE_STORAGE_KEY = 'hrms-locale';

// ── Contexte ────────────────────────────────────────────────────────────────────
const AppContext = createContext<AppContextValue | null>(null);

// ── Provider ────────────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  // Initialisation du thème depuis le localStorage
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    // Détecter la préférence système
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Initialisation de la langue depuis le localStorage
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === 'fr' || saved === 'en' || saved === 'es') return saved;
    return detectBrowserLocale();
  });

  // Appliquer le thème sur le <html> via data-theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Appliquer la langue sur le <html> pour l'accessibilité
  useEffect(() => {
    document.documentElement.setAttribute('lang', locale);
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  const setTheme = (newTheme: Theme) => setThemeState(newTheme);
  const toggleTheme = () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  const setLocale = (newLocale: Locale) => setLocaleState(newLocale);

  // Raccourci t() lié à la locale active
  const t = (key: string, params?: Record<string, string | number>) =>
    translate(locale, key, params);

  return (
    <AppContext.Provider value={{ theme, setTheme, toggleTheme, locale, setLocale, t }}>
      {children}
    </AppContext.Provider>
  );
}

// ── Hook personnalisé ───────────────────────────────────────────────────────────
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp doit être utilisé à l\'intérieur de <AppProvider>');
  return ctx;
}
