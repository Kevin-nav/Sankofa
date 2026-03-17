import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { AuthShell } from '../components/AuthShell';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { csrfToken, login, setCsrfToken, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, navigate, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await axios.post('/api/auth/login', {
        email: email.trim().toLowerCase(),
        password,
        _csrf: csrfToken,
      });
      if (response.data.success) {
        login(response.data.user, response.data.csrfToken ?? csrfToken);
        navigate('/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Invalid credentials');
        if (typeof err.response?.data?.csrfToken === 'string') {
          setCsrfToken(err.response.data.csrfToken);
        }
      } else {
        setError('Invalid credentials');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <AuthShell
        eyebrow="Secure Internal Access"
        title="Enter the payroll and compliance workspace."
        description="Use your assigned account to review payroll cycles, compliance checks, and audit evidence from one warm, role-aware interface."
        panelTitle="Sign in"
        panelDescription="Enter your internal credentials to continue."
        footer={
          <p>
            New to the platform? <Link to="/signup">Create an account</Link>
          </p>
        }
      >
        <form className="auth-form" onSubmit={handleSubmit}>
          {error ? <div className="form-alert">{error}</div> : null}

          <label className="field">
            <span>Email</span>
            <input
              id="email"
              type="email"
              placeholder="anita@sankofa.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </AuthShell>
    </div>
  );
};
