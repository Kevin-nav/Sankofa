import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionUser = request.session.user;

    if (!sessionUser?.isAdmin) {
      throw new ForbiddenException('Administrative access is required.');
    }

    return true;
  }
}
