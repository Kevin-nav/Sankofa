import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  csrfToken: string;
  loading: boolean;
  login: (user: User, token: string) => void;
  setCsrfToken: (token: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        if (response.data.user) {
          setUser(response.data.user);
        }
        if (response.data.csrfToken) {
          setCsrfToken(response.data.csrfToken);
        }
      } catch (error) {
        console.error('Failed to fetch user', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = (userData: User, token: string) => {
    setUser(userData);
    setCsrfToken(token);
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout', { _csrf: csrfToken });
      setUser(null);
      setCsrfToken('');
    } catch (error) {
      console.error('Failed to logout', error);
      setUser(null);
      setCsrfToken('');
    }
  };

  return (
    <AuthContext.Provider value={{ user, csrfToken, loading, login, setCsrfToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
