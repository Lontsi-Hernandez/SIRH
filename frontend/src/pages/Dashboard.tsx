import { useApp } from '../context/AppContext';

export default function DashboardPage() {
  const { t } = useApp();

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>{t('dashboard.title')}</h1>
          <p>{t('dashboard.subtitle')}</p>
        </div>
      </div>
      <div className="grid-4">
        {[
          { label: t('dashboard.activeEmployees'), value: '—', icon: '👥', color: 'var(--blue)' },
          { label: t('dashboard.absencesToday'), value: '—', icon: '🏖️', color: 'var(--yellow)' },
          { label: t('dashboard.upcomingShifts'), value: '—', icon: '🗓️', color: 'var(--green)' },
          { label: t('dashboard.payrollCost'), value: '—', icon: '💰', color: 'var(--peach)' },
        ].map((kpi) => (
          <div key={kpi.label} className="kpi-card">
            <div style={{ fontSize: '2rem' }}>{kpi.icon}</div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
              <div className="text-muted text-sm">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--subtext0)' }}>
        <p>{t('dashboard.kpisFooter')}</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>{t('dashboard.kpisSubFooter')}</p>
      </div>
    </div>
  );
}
