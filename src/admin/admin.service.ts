import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminScope, UserRole } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async getSession(userId: number) {
    const [user, recentAuditLogs] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          adminScopes: {
            select: { scope: true },
          },
        },
      }),
      this.prisma.adminAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          actor: {
            select: { name: true, email: true },
          },
          target: {
            select: { name: true, email: true },
          },
        },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('Admin session user not found.');
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin,
        mustChangePassword: user.mustChangePassword,
        adminScopes: user.adminScopes.map((entry) => entry.scope),
      },
      recentAuditLogs: recentAuditLogs.map((entry) => ({
        id: entry.id,
        action: entry.action,
        description: entry.description,
        createdAt: entry.createdAt,
        actor: entry.actor,
        target: entry.target,
      })),
    };
  }

  async listUsers() {
    const users = await this.authService.listUsers();
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
      mustChangePassword: user.mustChangePassword,
      adminScopes: user.adminScopes.map((entry) => entry.scope),
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    }));
  }

  async createEmployeeUser(input: {
    name: string;
    email: string;
    role: string;
  }) {
    const temporaryPassword = this.generateTemporaryPassword();
    const user = await this.authService.createManagedUser({
      ...input,
      password: temporaryPassword,
      mustChangePassword: true,
    });

    return { user, temporaryPassword };
  }

  async resetPassword(userId: number) {
    await this.ensureUserExists(userId);
    const temporaryPassword = this.generateTemporaryPassword();
    const user = await this.authService.resetUserPassword(userId, temporaryPassword);
    return { user, temporaryPassword };
  }

  async updateUserStatus(userId: number, status: 'Active' | 'Suspended') {
    await this.ensureUserExists(userId);
    return this.authService.updateUserStatus(userId, status);
  }

  async createAdmin(input: {
    name: string;
    email: string;
    role?: string;
    scopes: AdminScope[];
    isSuperAdmin?: boolean;
  }) {
    const temporaryPassword = this.generateTemporaryPassword();
    const role = (input.role as UserRole | undefined) ?? UserRole.PAYROLL_ADMIN;
    const user = await this.authService.createAdmin({
      name: input.name,
      email: input.email,
      password: temporaryPassword,
      role,
      scopes: input.scopes,
      isSuperAdmin: input.isSuperAdmin ?? false,
    });

    return { user, temporaryPassword };
  }

  async updateAdminScopes(userId: number, scopes: AdminScope[], isSuperAdmin: boolean) {
    await this.ensureUserExists(userId);
    return this.authService.updateAdminScopes(userId, scopes, isSuperAdmin);
  }

  private async ensureUserExists(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User account not found.');
    }
  }

  private generateTemporaryPassword(): string {
    return `Skf-${randomBytes(6).toString('base64url')}`;
  }
}
