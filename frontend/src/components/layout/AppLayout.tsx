import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppSelector } from '../../hooks/useStore';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  const { sidebarOpen } = useAppSelector((state) => state.ui);

  return (
    <div className={`${styles.layout} ${sidebarOpen ? '' : styles.collapsed}`}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
