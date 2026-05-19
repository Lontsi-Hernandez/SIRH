import { useApp } from '../../context/AppContext';
import { LOCALES, LOCALE_FLAGS, type Locale } from '../../i18n';
import { Sun, Moon } from 'lucide-react';
import styles from './LanguageThemeToggle.module.css';

export default function LanguageThemeToggle() {
  const { theme, toggleTheme, locale, setLocale, t } = useApp();

  return (
    <div className={styles.container}>
      {/* ── Sélecteur de langue ── */}
      <div className={styles.localeGroup}>
        {(Object.keys(LOCALES) as Locale[]).map((lang) => (
          <button
            key={lang}
            id={`lang-${lang}`}
            onClick={() => setLocale(lang)}
            className={`${styles.localeBtn} ${locale === lang ? styles.localeBtnActive : ''}`}
            title={LOCALES[lang]}
            aria-label={`Changer la langue en ${LOCALES[lang]}`}
            aria-pressed={locale === lang}
          >
            <span className={styles.flag}>{LOCALE_FLAGS[lang]}</span>
            <span className={styles.langCode}>{lang.toUpperCase()}</span>
          </button>
        ))}
      </div>

      {/* ── Bascule thème ── */}
      <button
        id="theme-toggle"
        onClick={toggleTheme}
        className={styles.themeToggle}
        title={theme === 'dark' ? t('settings.themeLight') : t('settings.themeDark')}
        aria-label={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
      >
        <span className={`${styles.themeIcon} ${theme === 'dark' ? styles.themeIconVisible : ''}`}>
          <Sun size={16} />
        </span>
        <span className={`${styles.themeIcon} ${theme === 'light' ? styles.themeIconVisible : ''}`}>
          <Moon size={16} />
        </span>
        <span
          className={styles.themeIndicator}
          style={{ transform: theme === 'dark' ? 'translateX(0)' : 'translateX(100%)' }}
        />
      </button>
    </div>
  );
}
