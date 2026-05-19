const stub = (n: string, i: string) => () => (<div className="page animate-fade-in"><div className="page-header"><h1>{i} {n}</h1></div><div className="card" style={{ textAlign: 'center', padding: '4rem' }}><div style={{ fontSize: '4rem' }}>{i}</div><h3>Module {n}</h3><p style={{ marginTop: '0.5rem' }}>En cours de développement.</p></div></div>);
export default stub('Congés', '🏖️');
