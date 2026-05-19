import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { login } from '../../store/slices/authSlice';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((s) => s.auth);
  const [form, setForm] = useState({ email: '', password: '', tenantId: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) navigate('/dashboard');
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>HR</div>
          <h1 className={styles.title}>HRMS</h1>
          <p className={styles.subtitle}>Système d'Information des Ressources Humaines</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="tenantId" className={styles.label}>Identifiant de l'entreprise</label>
            <input
              id="tenantId"
              type="text"
              className="input"
              placeholder="ex: mon-entreprise"
              value={form.tenantId}
              onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Courriel</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="jean.tremblay@entreprise.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Mot de passe</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className={styles.errorMsg} role="alert">
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="animate-spin" style={{ display: 'inline-block' }}>⏳</span>
            ) : '🔐 Se connecter'}
          </button>
        </form>

        <p className={styles.footer}>
          © 2026 HRMS — Conformité québécoise/canadienne native
        </p>
      </div>

      {/* Arrière-plan décoratif */}
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.blob1} />
        <div className={styles.blob2} />
        <div className={styles.blob3} />
      </div>
    </div>
  );
}
