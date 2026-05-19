import { NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';
import { useApp } from '../../context/AppContext';
import styles from './Sidebar.module.css';

const navItems = [
  { path: '/dashboard', icon: '📊', key: 'nav.dashboard' },
  { path: '/employees', icon: '👥', key: 'nav.employees' },
  { path: '/shifts', icon: '🗓️', key: 'nav.shifts' },
  { path: '/leaves', icon: '🏖️', key: 'nav.leaves' },
  { path: '/payroll', icon: '💰', key: 'nav.payroll' },
  { path: '/recruitment', icon: '🔍', key: 'nav.recruitment' },
  { path: '/performance', icon: '⭐', key: 'nav.performance' },
  { path: '/training', icon: '📚', key: 'nav.training' },
  { path: '/messages', icon: '💬', key: 'nav.messages' },
  { path: '/analytics', icon: '📈', key: 'nav.analytics' },
  { path: '/housings', icon: '🏠', key: 'nav.housings' },
];

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { sidebarOpen } = useAppSelector((s) => s.ui);
  const { user } = useAppSelector((s) => s.auth);
  const { t } = useApp();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <aside className={`${styles.sidebar} ${sidebarOpen ? '' : styles.collapsed}`}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>HR</div>
        {sidebarOpen && <span className={styles.logoText}>HRMS</span>}
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
            title={!sidebarOpen ? t(item.key) : undefined}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {sidebarOpen && <span className={styles.navLabel}>{t(item.key)}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className={styles.footer}>
        <NavLink to="/settings" className={styles.navItem} title={t('nav.settings')}>
          <span className={styles.navIcon}>⚙️</span>
          {sidebarOpen && <span className={styles.navLabel}>{t('nav.settings')}</span>}
        </NavLink>
        <NavLink to="/profile" className={styles.navItem} title={t('nav.profile')}>
          <div className={`avatar avatar-sm ${styles.userAvatar}`}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          {sidebarOpen && (
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.firstName} {user?.lastName}</span>
              <span className={`badge badge-primary ${styles.userRole}`}>{user?.role}</span>
            </div>
          )}
        </NavLink>
        <button className={`${styles.navItem} ${styles.logoutBtn}`} onClick={handleLogout} title={t('auth.logout')}>
          <span className={styles.navIcon}>🚪</span>
          {sidebarOpen && <span className={styles.navLabel}>{t('auth.logout')}</span>}
        </button>
      </div>

      {/* Toggle */}
      <button
        className={styles.toggleBtn}
        onClick={() => dispatch(toggleSidebar())}
        aria-label={sidebarOpen ? 'Réduire la sidebar' : 'Ouvrir la sidebar'}
      >
        {sidebarOpen ? '◀' : '▶'}
      </button>
    </aside>
  );
}
