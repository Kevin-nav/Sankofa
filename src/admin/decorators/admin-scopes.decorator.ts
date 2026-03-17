import { SetMetadata } from '@nestjs/common';
import { AdminScope } from '@prisma/client';

export const ADMIN_SCOPES_KEY = 'admin_scopes';

export const RequireAdminScopes = (...scopes: AdminScope[]) =>
  SetMetadata(ADMIN_SCOPES_KEY, scopes);
