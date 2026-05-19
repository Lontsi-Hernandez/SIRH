const stub = (name: string, icon: string) => function Page() {
  return (<div className="page animate-fade-in"><div className="page-header"><h1>{icon} {name}</h1></div><div className="card" style={{ textAlign: 'center', padding: '4rem' }}><div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{icon}</div><h3>Module {name}</h3><p style={{ marginTop: '0.5rem' }}>En cours de développement.</p></div></div>);
};
export default stub('Horaires', '🗓️');
