import { NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';
import styles from './Sidebar.module.css';

const navItems = [
  { path: '/dashboard', icon: '📊', label: 'Tableau de bord' },
  { path: '/employees', icon: '👥', label: 'Employés' },
  { path: '/shifts', icon: '🗓️', label: 'Horaires' },
  { path: '/leaves', icon: '🏖️', label: 'Congés' },
  { path: '/payroll', icon: '💰', label: 'Paie' },
  { path: '/recruitment', icon: '🔍', label: 'Recrutement' },
  { path: '/performance', icon: '⭐', label: 'Performance' },
  { path: '/training', icon: '📚', label: 'Formation' },
  { path: '/messages', icon: '💬', label: 'Messages' },
  { path: '/analytics', icon: '📈', label: 'Analytics' },
  { path: '/housings', icon: '🏠', label: 'Hébergements' },
];

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { sidebarOpen } = useAppSelector((s) => s.ui);
  const { user } = useAppSelector((s) => s.auth);

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
            title={!sidebarOpen ? item.label : undefined}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {sidebarOpen && <span className={styles.navLabel}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className={styles.footer}>
        <NavLink to="/settings" className={styles.navItem} title="Paramètres">
          <span className={styles.navIcon}>⚙️</span>
          {sidebarOpen && <span className={styles.navLabel}>Paramètres</span>}
        </NavLink>
        <NavLink to="/profile" className={styles.navItem} title="Profil">
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
        <button className={`${styles.navItem} ${styles.logoutBtn}`} onClick={handleLogout} title="Déconnexion">
          <span className={styles.navIcon}>🚪</span>
          {sidebarOpen && <span className={styles.navLabel}>Déconnexion</span>}
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
