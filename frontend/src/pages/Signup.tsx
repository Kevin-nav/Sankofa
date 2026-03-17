import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthShell } from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { AUTH_ROLE_OPTIONS, type AuthRole } from '../lib/auth';

export const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<AuthRole>('PAYROLL_ADMIN');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { csrfToken, login, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, navigate, user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post('/api/auth/signup', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        _csrf: csrfToken,
      });

      if (response.data.success) {
        login(response.data.user, response.data.csrfToken ?? csrfToken);
        navigate('/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Unable to create the account.');
      } else {
        setError('Unable to create the account.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <AuthShell
        eyebrow="Create Internal Profile"
        title="Open a role-based access point in minutes."
        description="Create your account, choose the team function you support, and land directly in the operations dashboard with your session already active."
        panelTitle="Sign up"
        panelDescription="Set up your profile and choose the internal role you need."
        footer={
          <p>
            Already registered? <Link to="/login">Return to sign in</Link>
          </p>
        }
      >
        <form className="auth-form" onSubmit={handleSubmit}>
          {error ? <div className="form-alert">{error}</div> : null}

          <label className="field">
            <span>Full name</span>
            <input
              type="text"
              placeholder="Kojo Annan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              placeholder="kojo.annan@sankofa.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Role</span>
            <select value={role} onChange={(e) => setRole(e.target.value as AuthRole)}>
              {AUTH_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="field-grid">
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Confirm password</span>
              <input
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </label>
          </div>

          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </AuthShell>
    </div>
  );
};
