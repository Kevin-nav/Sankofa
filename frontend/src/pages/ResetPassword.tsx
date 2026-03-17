import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthShell } from '../components/AuthShell';
import { useAuth } from '../context/useAuth';

export const ResetPassword: React.FC = () => {
  const [employeeCode, setEmployeeCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successCode, setSuccessCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { csrfToken, setCsrfToken, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, navigate, user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessCode('');

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
      const normalizedEmployeeCode = employeeCode.trim().toUpperCase();
      const response = await axios.post('/api/auth/reset-password', {
        employeeCode: normalizedEmployeeCode,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        _csrf: csrfToken,
      });

      if (response.data.success) {
        setSuccessCode(normalizedEmployeeCode);
        setPassword('');
        setConfirmPassword('');
        if (typeof response.data.csrfToken === 'string') {
          setCsrfToken(response.data.csrfToken);
        }
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'We could not reset your password.');
        if (typeof err.response?.data?.csrfToken === 'string') {
          setCsrfToken(err.response.data.csrfToken);
        }
      } else {
        setError('We could not reset your password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <AuthShell
        eyebrow="Employee Verification"
        title="Reset your password with your private employee ID."
        description="Verify your existing Sankofa employee account with your employee ID, name, and email, then set a new password and return to sign in."
        panelTitle="Reset password"
        panelDescription="This page is only for existing employee accounts. Use the exact details assigned to you."
        footer={
          <div className="auth-action-stack">
            <p>
              Remembered your password? <Link to="/login">Return to sign in</Link>
            </p>
            <p>
              Need a new account first? <Link to="/signup">Create an account</Link>
            </p>
          </div>
        }
      >
        <form className="auth-form" onSubmit={handleSubmit}>
          {error ? <div className="form-alert">{error}</div> : null}
          {successCode ? (
            <div className="form-success">
              Password updated successfully for employee ID
              <strong>{successCode}</strong>
              <Link to="/login">Continue to login</Link>
            </div>
          ) : null}

          <label className="field">
            <span>Employee ID</span>
            <input
              type="text"
              placeholder="SK-1004"
              value={employeeCode}
              onChange={(event) => setEmployeeCode(event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Full name</span>
            <input
              type="text"
              placeholder="Anita Mensah"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              placeholder="anita@sankofa.local"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <div className="field-grid">
            <label className="field password-field">
              <span>New password</span>
              <div className="password-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            <label className="field password-field">
              <span>Confirm password</span>
              <div className="password-input-wrap">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>
          </div>

          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Updating password...' : 'Set new password'}
          </button>
        </form>
      </AuthShell>
    </div>
  );
};
