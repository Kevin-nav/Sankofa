import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get('/api/dashboard');
        setData(response.data);
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
        <div className="text-muted-foreground font-medium">Loading Dashboard...</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-6 gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Operations Dashboard</h2>
            <p className="text-muted-foreground mt-1">Manage payroll, approvals, and system alerts.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium text-muted-foreground flex flex-col items-end">
              <span>Logged in as: <span className="text-foreground">{user?.name}</span></span>
              <span className="text-xs badge bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full mt-1">{user?.role}</span>
            </div>
            <button 
              onClick={() => { logout(); navigate('/login'); }}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Payroll Status</h3>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">{data?.payrollOverview?.status || 'Unknown'}</div>
              <p className="text-xs text-muted-foreground mt-1">Current operational status</p>
            </div>
          </div>
          
          <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Pending Approvals</h3>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">{data?.pendingApprovals || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow md:col-span-1">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Recent Alerts</h3>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            </div>
            <div className="p-6 pt-0">
              <ul className="space-y-3 mt-2">
                {data?.alerts?.map((alert: any, idx: number) => (
                  <li key={idx} className="text-sm font-medium leading-relaxed text-muted-foreground flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                    <span>{alert.message}</span>
                  </li>
                ))}
                {(!data?.alerts || data.alerts.length === 0) && (
                  <li className="text-sm font-medium leading-none text-muted-foreground italic">No recent alerts</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};