import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatRoleLabel } from '../lib/auth';

type DashboardCard = {
  label: string;
  value: string;
  detail: string;
};

type DashboardData = {
  title: string;
  pageSummary: string;
  dashboardCards: DashboardCard[];
  activityItems: string[];
};

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get('/api/dashboard');
        setData(response.data);
      } catch (err) {
        console.error('Failed to load dashboard', err);
        setError('The dashboard could not be loaded. Refresh the page or sign in again.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="app-shell app-shell-centered">
        <div className="status-card">
          <div className="status-spinner" />
          <p>Loading your operations dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <span className="dashboard-kicker">Sankofa payroll platform</span>
          <h1>{data?.title ?? 'Operations Dashboard'}</h1>
          <p>{data?.pageSummary ?? 'Unified internal workspace.'}</p>
        </div>
        <button className="secondary-button" onClick={handleLogout} type="button">
          Log out
        </button>
      </header>

      <section className="dashboard-grid">
        <article className="profile-card">
          <span className="profile-overline">Signed-in profile</span>
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
          <div className="profile-badges">
            <span>{formatRoleLabel(user?.role)}</span>
            <span>Session active</span>
          </div>
          <div className="profile-note">
            Your dashboard content adapts to the role selected during signup or assigned at login.
          </div>
        </article>

        <article className="activity-card">
          <span className="profile-overline">Workspace focus</span>
          <h2>Today&apos;s internal posture</h2>
          <p>
            {error || 'Operational metrics, review counts, and investigation context are grouped below.'}
          </p>
          <ul className="activity-list">
            {(data?.activityItems ?? []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="metric-grid">
        {(data?.dashboardCards ?? []).map((card) => (
          <article className="metric-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.detail}</p>
          </article>
        ))}
      </section>
    </div>
  );
};
