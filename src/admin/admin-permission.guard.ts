import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AdminScope } from '@prisma/client';
import { ADMIN_SCOPES_KEY } from './decorators/admin-scopes.decorator';

@Injectable()
export class AdminPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes =
      this.reflector.getAllAndOverride<AdminScope[]>(ADMIN_SCOPES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredScopes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.session.user;

    if (!user?.isAdmin) {
      throw new ForbiddenException('Administrative access is required.');
    }

    if (user.isSuperAdmin) {
      return true;
    }

    const grantedScopes = new Set(user.adminScopes ?? []);
    const hasAllScopes = requiredScopes.every((scope) => grantedScopes.has(scope));

    if (!hasAllScopes) {
      throw new ForbiddenException('You do not have permission to perform that action.');
    }

    return true;
  }
}
