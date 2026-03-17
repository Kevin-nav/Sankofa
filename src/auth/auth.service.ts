import {
  BadRequestException,
  ConflictException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { AdminScope, Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SessionUser } from './session.types';

type SignupInput = {
  name: string;
  email: string;
  password: string;
  role: string;
};

type AdminProvisionInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  scopes: AdminScope[];
  isSuperAdmin?: boolean;
};

const ADMIN_SCOPE_VALUES = new Set<AdminScope>(Object.values(AdminScope));

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.ensureBootstrapSuperAdmin();
  }

  async authenticate(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(email) },
    });

    if (!user || user.status !== 'Active') {
      return null;
    }

    const isPasswordValid = await compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
      },
    });
  }

  async getAdminSessionUser(email: string, password: string): Promise<SessionUser | null> {
    const user = await this.authenticate(email, password);

    if (!user || !user.isAdmin) {
      return null;
    }

    const scopes = await this.getAdminScopes(user.id);
    return this.toSessionUser(user, scopes);
  }

  async signup(input: SignupInput): Promise<User> {
    const name = this.normalizeName(input.name);
    const email = this.normalizeEmail(input.email);
    const password = input.password;
    const role = this.parseRole(input.role);

    this.assertValidPassword(password);
    await this.assertEmailAvailable(email);

    return this.prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hash(password, 10),
        role,
        department: this.getDepartmentForRole(role),
        status: 'Active',
        lastLogin: new Date(),
        lastPasswordChangeAt: new Date(),
      },
    });
  }

  async createManagedUser(input: SignupInput & { mustChangePassword?: boolean }): Promise<User> {
    const name = this.normalizeName(input.name);
    const email = this.normalizeEmail(input.email);
    const password = input.password;
    const role = this.parseRole(input.role);

    this.assertValidPassword(password);
    await this.assertEmailAvailable(email);

    return this.prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hash(password, 10),
        role,
        department: this.getDepartmentForRole(role),
        status: 'Active',
        mustChangePassword: input.mustChangePassword ?? false,
        lastPasswordChangeAt: new Date(),
      },
    });
  }

  async createAdmin(input: AdminProvisionInput): Promise<User> {
    const name = this.normalizeName(input.name);
    const email = this.normalizeEmail(input.email);
    this.assertValidPassword(input.password);
    await this.assertEmailAvailable(email);

    return this.prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hash(input.password, 12),
        role: input.role,
        department: 'Administration',
        status: 'Active',
        isAdmin: true,
        isSuperAdmin: input.isSuperAdmin ?? false,
        mustChangePassword: true,
        lastPasswordChangeAt: new Date(),
        adminScopes: {
          create: input.scopes.map((scope) => ({ scope })),
        },
      },
    });
  }

  async listUsers() {
    return this.prisma.user.findMany({
      orderBy: [{ isAdmin: 'desc' }, { createdAt: 'desc' }],
      include: {
        adminScopes: {
          select: {
            scope: true,
          },
        },
      },
    });
  }

  async resetUserPassword(userId: number, newPassword: string): Promise<User> {
    this.assertValidPassword(newPassword);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await hash(newPassword, 12),
        mustChangePassword: true,
        passwordResetAt: new Date(),
      },
    });
  }

  async updateUserStatus(userId: number, status: 'Active' | 'Suspended') {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }

  async updateAdminScopes(userId: number, scopes: AdminScope[], isSuperAdmin = false) {
    const normalizedScopes = this.parseScopes(scopes);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isAdmin: true,
        isSuperAdmin,
        adminScopes: {
          deleteMany: {},
          create: normalizedScopes.map((scope) => ({ scope })),
        },
      },
      include: {
        adminScopes: true,
      },
    });
  }

  async getAdminScopes(userId: number): Promise<AdminScope[]> {
    const scopes = await this.prisma.adminScopeGrant.findMany({
      where: { userId },
      select: { scope: true },
    });

    return scopes.map((entry) => entry.scope);
  }

  async writeAdminAuditLog(input: {
    actorUserId: number;
    action: string;
    description: string;
    targetUserId?: number;
    sourceIp?: string;
    userAgent?: string;
  }) {
    return this.prisma.adminAuditLog.create({
      data: {
        actorUserId: input.actorUserId,
        targetUserId: input.targetUserId,
        action: input.action,
        description: input.description,
        sourceIp: input.sourceIp,
        userAgent: input.userAgent,
      },
    });
  }

  async buildSessionUser(userId: number): Promise<SessionUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        adminScopes: {
          select: {
            scope: true,
          },
        },
      },
    });

    return this.toSessionUser(user, user.adminScopes.map((entry) => entry.scope));
  }

  private toSessionUser(
    user: User & { adminScopes?: Array<{ scope: AdminScope }> },
    scopes: AdminScope[],
  ): SessionUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
      adminScopes: scopes,
      mustChangePassword: user.mustChangePassword,
    };
  }

  private async ensureBootstrapSuperAdmin(): Promise<void> {
    const email = process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.BOOTSTRAP_SUPER_ADMIN_PASSWORD ?? '';
    const name = process.env.BOOTSTRAP_SUPER_ADMIN_NAME?.trim() || 'Sankofa Super Admin';

    if (!email || !password) {
      return;
    }

    const existing = await this.prisma.user.findUnique({
      where: { email },
      include: {
        adminScopes: true,
      },
    });

    const allScopes = Object.values(AdminScope);

    if (existing) {
      if (!existing.isAdmin || !existing.isSuperAdmin || existing.adminScopes.length !== allScopes.length) {
        await this.updateAdminScopes(existing.id, allScopes, true);
        await this.prisma.user.update({
          where: { id: existing.id },
          data: {
            isAdmin: true,
            isSuperAdmin: true,
            status: 'Active',
          },
        });
      }

      return;
    }

    await this.createAdmin({
      name,
      email,
      password,
      role: UserRole.PAYROLL_ADMIN,
      scopes: allScopes,
      isSuperAdmin: true,
    });
  }

  private normalizeName(name: string): string {
    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new BadRequestException('Full name is required.');
    }
    return normalizedName;
  }

  private normalizeEmail(email: string): string {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new BadRequestException('A valid email address is required.');
    }
    return normalizedEmail;
  }

  private assertValidPassword(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long.');
    }
  }

  private async assertEmailAvailable(email: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('An account with that email already exists.');
    }
  }

  private parseRole(role: string): UserRole {
    if (Object.values(UserRole).includes(role as UserRole)) {
      return role as UserRole;
    }

    throw new BadRequestException('A valid role selection is required.');
  }

  private parseScopes(scopes: Iterable<AdminScope | string>): AdminScope[] {
    const normalizedScopes = Array.from(new Set(Array.from(scopes)));

    if (normalizedScopes.length === 0) {
      throw new BadRequestException('At least one admin scope is required.');
    }

    return normalizedScopes.map((scope) => {
      if (ADMIN_SCOPE_VALUES.has(scope as AdminScope)) {
        return scope as AdminScope;
      }

      throw new BadRequestException(`Invalid admin scope: ${scope}`);
    });
  }

  private getDepartmentForRole(role: UserRole): string {
    switch (role) {
      case UserRole.PAYROLL_ADMIN:
        return 'Payroll';
      case UserRole.COMPLIANCE_OFFICER:
        return 'Compliance';
      case UserRole.AUDIT_ANALYST:
        return 'Audit';
      default:
        return 'Operations';
    }
  }
}
