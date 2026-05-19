import { useAppSelector } from '../../hooks/useStore';
import { useApp } from '../../context/AppContext';
import LanguageThemeToggle from '../ui/LanguageThemeToggle';
import styles from './Header.module.css';

export default function Header() {
  const { user } = useAppSelector((s) => s.auth);
  const { unreadCount } = useAppSelector((s) => s.notifications);
  const { t } = useApp();

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h2 className={styles.pageTitle}>{t('dashboard.welcome')}, {user?.firstName} 👋</h2>
      </div>
      <div className={styles.right}>
        <LanguageThemeToggle />
        <button className={`btn btn-ghost btn-sm ${styles.iconBtn}`} title="Notifications" aria-label="Notifications">
          🔔
          {unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>
        <button className={`btn btn-ghost btn-sm ${styles.iconBtn}`} title="Aide" aria-label="Aide">❓</button>
        <div className={`avatar avatar-sm ${styles.avatar}`} title={`${user?.firstName} ${user?.lastName}`}>
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
      </div>
    </header>
  );
}

