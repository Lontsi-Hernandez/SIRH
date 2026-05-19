import fr from './locales/fr.json';
import en from './locales/en.json';
import es from './locales/es.json';

export type Locale = 'fr' | 'en' | 'es';

export const LOCALES: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  es: '🇪🇸',
};

const translations: Record<Locale, typeof fr> = { fr, en, es };

// Résolution sécurisée d'une clé imbriquée (ex: "nav.dashboard")
export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any = translations[locale];

  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      // Fallback: essayer en français, puis retourner la clé
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let fallback: any = translations['fr'];
      for (const fk of keys) {
        if (fallback && typeof fallback === 'object' && fk in fallback) {
          fallback = fallback[fk];
        } else {
          return key; // Clé inconnue, retourner la clé brute
        }
      }
      result = fallback;
      break;
    }
  }

  if (typeof result !== 'string') return key;

  // Interpolation de paramètres: {{name}} => valeur
  if (params) {
    return result.replace(/\{\{(\w+)\}\}/g, (_, p) => String(params[p] ?? `{{${p}}}`));
  }

  return result;
}

// Détection automatique de la langue du navigateur
export function detectBrowserLocale(): Locale {
  const browserLang = navigator.language.slice(0, 2).toLowerCase();
  if (browserLang in LOCALES) return browserLang as Locale;
  return 'fr';
}
