import { AdminScope } from '@prisma/client';
import { SessionUser } from '../auth/session.types';

export type AdminSessionUser = SessionUser & {
  isAdmin: true;
  adminScopes: AdminScope[];
};
