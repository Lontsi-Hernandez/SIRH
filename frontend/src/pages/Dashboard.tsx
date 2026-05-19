// ─── Pages stubs — à implémenter dans les phases suivantes ───────────────────
// Dashboard.tsx
export default function DashboardPage() {
  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Tableau de bord</h1>
          <p>Vue d'ensemble de votre organisation</p>
        </div>
      </div>
      <div className="grid-4">
        {[
          { label: 'Employés actifs', value: '—', icon: '👥', color: 'var(--blue)' },
          { label: 'Absences aujourd\'hui', value: '—', icon: '🏖️', color: 'var(--yellow)' },
          { label: 'Quarts à venir', value: '—', icon: '🗓️', color: 'var(--green)' },
          { label: 'Coût masse salariale', value: '—', icon: '💰', color: 'var(--peach)' },
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
        <p>📊 Les graphiques et KPIs seront disponibles une fois le backend connecté.</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Démarrez le backend et configurez votre tenant pour commencer.</p>
      </div>
    </div>
  );
}
