import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks/useStore';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';

// Pages
import DashboardPage from './pages/Dashboard';
import TenantsPage from './pages/tenants/TenantsPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import BranchesPage from './pages/branches/BranchesPage';
import DepartmentsPage from './pages/departments/DepartmentsPage';
import ShiftsPage from './pages/shifts/ShiftsPage';
import LeavesPage from './pages/leaves/LeavesPage';
import PayrollPage from './pages/payroll/PayrollPage';
import RecruitmentPage from './pages/recruitment/RecruitmentPage';
import PerformancePage from './pages/performance/PerformancePage';
import TrainingPage from './pages/training/TrainingPage';
import MessagesPage from './pages/messages/MessagesPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import SettingsPage from './pages/settings/SettingsPage';
import ProfilePage from './pages/profile/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAppSelector((state) => state.auth);
  const userRole = user?.role;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route
          path="tenants"
          element={
            userRole === 'PLATFORM_ADMIN' ? (
              <TenantsPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="branches"
          element={
            userRole === 'SUPER_ADMIN' ? (
              <BranchesPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="employees"
          element={
            userRole && (userRole === 'SUPER_ADMIN' || ['ADMIN', 'HR', 'MANAGER'].includes(userRole)) ? (
              <EmployeesPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="departments"
          element={
            userRole && (userRole === 'SUPER_ADMIN' || ['ADMIN', 'HR'].includes(userRole)) ? (
              <DepartmentsPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route path="shifts" element={<ShiftsPage />} />
        <Route path="leaves" element={<LeavesPage />} />
        <Route
          path="payroll"
          element={
            userRole && (userRole === 'SUPER_ADMIN' || ['ADMIN', 'HR'].includes(userRole)) ? (
              <PayrollPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="recruitment"
          element={
            userRole && (userRole === 'SUPER_ADMIN' || ['ADMIN', 'HR', 'MANAGER'].includes(userRole)) ? (
              <RecruitmentPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route path="performance" element={<PerformancePage />} />
        <Route path="training" element={<TrainingPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route
          path="analytics"
          element={
            userRole && (userRole === 'SUPER_ADMIN' || ['ADMIN', 'HR', 'MANAGER'].includes(userRole)) ? (
              <AnalyticsPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
