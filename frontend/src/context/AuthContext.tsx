import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext, type User } from './auth-context';

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
