export type AdminScope = 'USER_ADMIN' | 'SECURITY_ADMIN' | 'AUDIT_ADMIN' | 'ADMIN_ADMIN';

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  mustChangePassword?: boolean;
  adminScopes: AdminScope[];
};

export type ManagedUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  mustChangePassword: boolean;
  adminScopes: AdminScope[];
  createdAt: string;
  lastLogin?: string;
};

export type AuditEntry = {
  id: number;
  action: string;
  description: string;
  createdAt: string;
  actor: {
    name: string;
    email: string;
  };
  target?: {
    name: string;
    email: string;
  } | null;
};
