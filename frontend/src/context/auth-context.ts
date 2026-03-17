import { createContext } from 'react';

export interface User {
  id: number;
  name: string;
  email: string;
  employeeCode?: string | null;
  role: string;
}

export interface AuthContextType {
  user: User | null;
  csrfToken: string;
  loading: boolean;
  login: (user: User, token: string) => void;
  setCsrfToken: (token: string) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
