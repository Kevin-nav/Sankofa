import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import axios from 'axios';
import type { SessionUser } from './types';

type AuthContextValue = {
  user: SessionUser | null;
  csrfToken: string;
  loading: boolean;
  setSession: (user: SessionUser, csrfToken: string) => void;
  setCsrfToken: (token: string) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [csrfToken, setCsrfToken] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      try {
        const response = await axios.get('/api/admin/session');
        setUser(response.data.user);
        const me = await axios.get('/api/auth/me');
        if (typeof me.data.csrfToken === 'string') {
          setCsrfToken(me.data.csrfToken);
        }
      } catch {
        try {
          const me = await axios.get('/api/auth/me');
          if (typeof me.data.csrfToken === 'string') {
            setCsrfToken(me.data.csrfToken);
          }
        } catch {
          setCsrfToken('');
        }
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();
  }, []);

  const setSession = (nextUser: SessionUser, nextToken: string) => {
    setUser(nextUser);
    setCsrfToken(nextToken);
  };

  const logout = async () => {
    await axios.post('/api/auth/logout', { _csrf: csrfToken });
    setUser(null);
    setCsrfToken('');
  };

  return (
    <AuthContext.Provider value={{ user, csrfToken, loading, setSession, setCsrfToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
