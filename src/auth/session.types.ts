import { UserRole } from '@prisma/client';

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  employeeCode?: string | null;
  role: UserRole;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  adminScopes?: string[];
  mustChangePassword?: boolean;
};
