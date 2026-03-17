import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminScope } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { SessionGuard } from '../auth/session.guard';
import { AdminGuard } from './admin.guard';
import { AdminPermissionGuard } from './admin-permission.guard';
import { RequireAdminScopes } from './decorators/admin-scopes.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
  ) {}

  @Post('auth/login')
  @HttpCode(200)
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Req() request: Request,
  ) {
    const sessionUser = await this.authService.getAdminSessionUser(email, password);

    if (!sessionUser) {
      throw new UnauthorizedException('Invalid admin credentials.');
    }

    request.session.user = sessionUser;
    request.session.adminSessionVerifiedAt = new Date().toISOString();

    await this.authService.writeAdminAuditLog({
      actorUserId: sessionUser.id,
      action: 'ADMIN_LOGIN',
      description: 'Administrator signed in successfully.',
      sourceIp: request.ip,
      userAgent: request.get('user-agent') ?? '',
    });

    return {
      success: true,
      user: request.session.user,
      csrfToken: request.session.csrfToken ?? '',
    };
  }

  @Get('session')
  @UseGuards(SessionGuard, AdminGuard)
  async session(@Req() request: Request) {
    return this.adminService.getSession(request.session.user!.id);
  }

  @Get('users')
  @UseGuards(SessionGuard, AdminGuard, AdminPermissionGuard)
  @RequireAdminScopes(AdminScope.USER_ADMIN)
  async listUsers() {
    return {
      users: await this.adminService.listUsers(),
    };
  }

  @Post('users')
  @UseGuards(SessionGuard, AdminGuard, AdminPermissionGuard)
  @RequireAdminScopes(AdminScope.USER_ADMIN)
  async createUser(
    @Body('name') name: string,
    @Body('email') email: string,
    @Body('role') role: string,
    @Req() request: Request,
  ) {
    const { user, temporaryPassword } = await this.adminService.createEmployeeUser({
      name,
      email,
      role,
    });

    await this.authService.writeAdminAuditLog({
      actorUserId: request.session.user!.id,
      targetUserId: user.id,
      action: 'USER_CREATED',
      description: `Created employee account for ${user.email}.`,
      sourceIp: request.ip,
      userAgent: request.get('user-agent') ?? '',
    });

    return { success: true, user, temporaryPassword };
  }

  @Post('users/:id/reset-password')
  @UseGuards(SessionGuard, AdminGuard, AdminPermissionGuard)
  @RequireAdminScopes(AdminScope.SECURITY_ADMIN)
  async resetPassword(@Param('id', ParseIntPipe) userId: number, @Req() request: Request) {
    const { user, temporaryPassword } = await this.adminService.resetPassword(userId);

    await this.authService.writeAdminAuditLog({
      actorUserId: request.session.user!.id,
      targetUserId: user.id,
      action: 'PASSWORD_RESET',
      description: `Issued a forced password reset for ${user.email}.`,
      sourceIp: request.ip,
      userAgent: request.get('user-agent') ?? '',
    });

    return { success: true, user, temporaryPassword };
  }

  @Post('users/:id/status')
  @UseGuards(SessionGuard, AdminGuard, AdminPermissionGuard)
  @RequireAdminScopes(AdminScope.SECURITY_ADMIN)
  async updateStatus(
    @Param('id', ParseIntPipe) userId: number,
    @Body('status') status: 'Active' | 'Suspended',
    @Req() request: Request,
  ) {
    const user = await this.adminService.updateUserStatus(userId, status);

    await this.authService.writeAdminAuditLog({
      actorUserId: request.session.user!.id,
      targetUserId: user.id,
      action: 'USER_STATUS_CHANGED',
      description: `Changed ${user.email} status to ${status}.`,
      sourceIp: request.ip,
      userAgent: request.get('user-agent') ?? '',
    });

    return { success: true, user };
  }

  @Post('admins')
  @UseGuards(SessionGuard, AdminGuard, AdminPermissionGuard)
  @RequireAdminScopes(AdminScope.ADMIN_ADMIN)
  async createAdmin(
    @Body('name') name: string,
    @Body('email') email: string,
    @Body('scopes') scopes: AdminScope[],
    @Body('isSuperAdmin') isSuperAdmin: boolean,
    @Req() request: Request,
  ) {
    if (isSuperAdmin && !request.session.user?.isSuperAdmin) {
      throw new UnauthorizedException('Only a super admin can create another super admin.');
    }

    const { user, temporaryPassword } = await this.adminService.createAdmin({
      name,
      email,
      scopes,
      isSuperAdmin,
    });

    await this.authService.writeAdminAuditLog({
      actorUserId: request.session.user!.id,
      targetUserId: user.id,
      action: 'ADMIN_CREATED',
      description: `Created admin account for ${user.email}.`,
      sourceIp: request.ip,
      userAgent: request.get('user-agent') ?? '',
    });

    return { success: true, user, temporaryPassword };
  }

  @Post('admins/:id/scopes')
  @UseGuards(SessionGuard, AdminGuard, AdminPermissionGuard)
  @RequireAdminScopes(AdminScope.ADMIN_ADMIN)
  async updateAdminScopes(
    @Param('id', ParseIntPipe) userId: number,
    @Body('scopes') scopes: AdminScope[],
    @Body('isSuperAdmin') isSuperAdmin: boolean,
    @Req() request: Request,
  ) {
    if (isSuperAdmin && !request.session.user?.isSuperAdmin) {
      throw new UnauthorizedException('Only a super admin can grant super admin privileges.');
    }

    const user = await this.adminService.updateAdminScopes(userId, scopes, isSuperAdmin);

    await this.authService.writeAdminAuditLog({
      actorUserId: request.session.user!.id,
      targetUserId: user.id,
      action: 'ADMIN_SCOPES_UPDATED',
      description: `Updated admin scopes for user ${user.id}.`,
      sourceIp: request.ip,
      userAgent: request.get('user-agent') ?? '',
    });

    return { success: true, user };
  }
}
