import { useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading, csrfToken, setSession, setCsrfToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [loading, navigate, user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await axios.post('/api/admin/auth/login', {
        email: email.trim().toLowerCase(),
        password,
        _csrf: csrfToken,
      });

      setSession(response.data.user, response.data.csrfToken);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Unable to sign in.');
        if (typeof err.response?.data?.csrfToken === 'string') {
          setCsrfToken(err.response.data.csrfToken);
        }
      } else {
        setError('Unable to sign in.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="admin-login-shell">
      <section className="admin-login-hero">
        <span className="eyebrow">Admin control zone</span>
        <h1>Sankofa account operations and security management.</h1>
        <p>
          This portal is for IT personnel with delegated account-management rights. Passwords are never
          viewable, all resets are forced-rotation events, and every admin action is audited.
        </p>
      </section>

      <section className="admin-login-panel">
        <h2>Admin sign in</h2>
        <p>Use your administrative credentials to access the secure control surface.</p>
        <form className="admin-form" onSubmit={onSubmit}>
          {error ? <div className="alert">{error}</div> : null}
          <label>
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            <span>Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
            />
          </label>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Enter admin portal'}
          </button>
        </form>
        <p className="admin-login-note">
          Employee access remains on app.sankofa-company.org.
        </p>
      </section>
    </main>
  );
}
