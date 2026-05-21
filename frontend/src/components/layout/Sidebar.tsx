import { NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';
import { useApp } from '../../context/AppContext';
import styles from './Sidebar.module.css';

const navItems = [
  { path: '/dashboard', icon: '📊', key: 'nav.dashboard' },
  { path: '/tenants', icon: '🌐', key: 'nav.tenants', roles: ['PLATFORM_ADMIN'] },
  { path: '/branches', icon: '📍', key: 'nav.branches', roles: ['SUPER_ADMIN'] },
  { path: '/employees', icon: '👥', key: 'nav.employees', roles: ['ADMIN', 'HR', 'MANAGER'] },
  { path: '/departments', icon: '🏢', key: 'nav.departments', roles: ['ADMIN', 'HR'] },
  { path: '/shifts', icon: '🗓️', key: 'nav.shifts' },
  { path: '/leaves', icon: '🏖️', key: 'nav.leaves' },
  { path: '/payroll', icon: '💰', key: 'nav.payroll', roles: ['ADMIN', 'HR'] },
  { path: '/recruitment', icon: '🔍', key: 'nav.recruitment', roles: ['ADMIN', 'HR', 'MANAGER'] },
  { path: '/performance', icon: '⭐', key: 'nav.performance' },
  { path: '/training', icon: '📚', key: 'nav.training' },
  { path: '/messages', icon: '💬', key: 'nav.messages' },
  { path: '/analytics', icon: '📈', key: 'nav.analytics', roles: ['ADMIN', 'HR', 'MANAGER'] },
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
      {/* Logo & Tenant Info */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>HR</div>
        {sidebarOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '0.5rem', textAlign: 'left', lineHeight: '1.2' }}>
            <span className={styles.logoText}>HRMS</span>
            {user?.tenantName && (
              <span style={{ fontSize: '0.7rem', color: 'var(--peach)', fontWeight: 600, marginTop: '2px' }} title={user.tenantName}>
                🏢 {user.tenantName.length > 20 ? user.tenantName.substring(0, 18) + '...' : user.tenantName}
              </span>
            )}
            {user?.branchName && (
              <span style={{ fontSize: '0.65rem', color: 'var(--blue)', fontWeight: 500, marginTop: '1px' }} title={user.branchName}>
                📍 {user.branchName}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {navItems
          .filter((item) => {
            if (user?.role === 'PLATFORM_ADMIN') {
              return item.path === '/dashboard' || item.path === '/tenants';
            }
            if (item.path === '/tenants') {
              return false;
            }
            return !item.roles || user?.role === 'SUPER_ADMIN' || (user?.role && item.roles.includes(user.role));
          })
          .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              title={!sidebarOpen ? (item.key === 'nav.tenants' ? 'Entreprises (Tenants)' : t(item.key)) : undefined}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {sidebarOpen && <span className={styles.navLabel}>{item.key === 'nav.tenants' ? 'Entreprises' : t(item.key)}</span>}
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
