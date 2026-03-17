import {
  BadRequestException,
  ConflictException,
  Injectable,
  OnModuleInit,
} from "@nestjs/common";
import * as crypto from "crypto";
import { AdminScope, Prisma, User, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SessionUser } from "./session.types";

type SignupInput = {
  name: string;
  email: string;
  password: string;
  role: string;
};

type ResetPasswordInput = {
  employeeCode: string;
  name: string;
  email: string;
  password: string;
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
    await this.ensureEmployeeCodes();
  }

  async authenticate(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(email) },
    });

    if (!user || user.status !== "Active") {
      return null;
    }

    const decryptedPassword = this.decryptPassword(user.passwordHash);
    if (decryptedPassword !== password) {
      return null;
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
      },
    });
  }

  async getAdminSessionUser(
    email: string,
    password: string,
  ): Promise<SessionUser | null> {
    const user = await this.authenticate(email, password);

    if (!user || !user.isAdmin) {
      return null;
    }

    const scopes = await this.getAdminScopes(user.id);
    return this.toSessionUser(user, scopes);
  }

  async signup(input: SignupInput): Promise<User> {
    throw new BadRequestException("Public signups are currently disabled.");
  }

  async createManagedUser(
    input: SignupInput & { mustChangePassword?: boolean },
  ): Promise<User> {
    const name = this.normalizeName(input.name);
    const email = this.normalizeEmail(input.email);
    const password = input.password;
    const role = this.parseRole(input.role);

    this.assertValidPassword(password);
    await this.assertEmailAvailable(email);

    return this.prisma.$transaction(async (transaction) => {
      const now = new Date();
      return transaction.user.create({
        data: {
          name,
          email,
          employeeCode: await this.generateEmployeeCode(transaction),
          passwordHash: this.encryptPassword(password),
          role,
          department: this.getDepartmentForRole(role),
          status: "Active",
          mustChangePassword: input.mustChangePassword ?? false,
          lastPasswordChangeAt: now,
        },
      });
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
        passwordHash: this.encryptPassword(input.password),
        role: input.role,
        department: "Administration",
        status: "Active",
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
      orderBy: [{ isAdmin: "desc" }, { createdAt: "desc" }],
      include: {
        adminScopes: {
          select: {
            scope: true,
          },
        },
      },
    });
  }

  async getDecryptedPassword(userId: number): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, isAdmin: true },
    });

    if (!user || user.isAdmin) {
      throw new BadRequestException(
        "Can only view passwords for non-admin employees.",
      );
    }

    return this.decryptPassword(user.passwordHash);
  }

  async resetUserPassword(userId: number, newPassword: string): Promise<User> {
    return this.updatePassword(userId, newPassword, {
      mustChangePassword: true,
    });
  }

  async resetEmployeePassword(input: ResetPasswordInput): Promise<User> {
    const employeeCode = this.normalizeEmployeeCode(input.employeeCode);
    const name = this.normalizeName(input.name);
    const email = this.normalizeEmail(input.email);
    this.assertValidPassword(input.password);

    const user = await this.prisma.user.findFirst({
      where: {
        employeeCode,
        name,
        email,
        isAdmin: false,
        status: "Active",
      },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException(
        "We could not verify an active employee with those details.",
      );
    }

    return this.updatePassword(user.id, input.password, {
      mustChangePassword: false,
    });
  }

  async updateUserStatus(userId: number, status: "Active" | "Suspended") {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }

  async updateAdminScopes(
    userId: number,
    scopes: AdminScope[],
    isSuperAdmin = false,
  ) {
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

    return this.toSessionUser(
      user,
      user.adminScopes.map((entry) => entry.scope),
    );
  }

  private toSessionUser(
    user: User & { adminScopes?: Array<{ scope: AdminScope }> },
    scopes: AdminScope[],
  ): SessionUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      employeeCode: user.employeeCode,
      role: user.role,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
      adminScopes: scopes,
      mustChangePassword: user.mustChangePassword,
    };
  }

  private async ensureBootstrapSuperAdmin(): Promise<void> {
    const email = process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.BOOTSTRAP_SUPER_ADMIN_PASSWORD ?? "";
    const name =
      process.env.BOOTSTRAP_SUPER_ADMIN_NAME?.trim() || "Sankofa Super Admin";

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
      if (
        !existing.isAdmin ||
        !existing.isSuperAdmin ||
        existing.adminScopes.length !== allScopes.length
      ) {
        await this.updateAdminScopes(existing.id, allScopes, true);
        await this.prisma.user.update({
          where: { id: existing.id },
          data: {
            isAdmin: true,
            isSuperAdmin: true,
            status: "Active",
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

  private async ensureEmployeeCodes(): Promise<void> {
    const usersMissingCodes = await this.prisma.user.findMany({
      where: {
        isAdmin: false,
        employeeCode: null,
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true },
    });

    if (usersMissingCodes.length === 0) {
      return;
    }

    let nextEmployeeCodeNumber = await this.getNextEmployeeCodeNumber(
      this.prisma,
    );

    await this.prisma.$transaction(
      usersMissingCodes.map((user) =>
        this.prisma.user.update({
          where: { id: user.id },
          data: {
            employeeCode: this.formatEmployeeCode(nextEmployeeCodeNumber++),
          },
        }),
      ),
    );
  }

  private async updatePassword(
    userId: number,
    password: string,
    options: { mustChangePassword: boolean },
  ): Promise<User> {
    this.assertValidPassword(password);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: this.encryptPassword(password),
        mustChangePassword: options.mustChangePassword,
        passwordResetAt: new Date(),
        lastPasswordChangeAt: new Date(),
      },
    });
  }

  private normalizeName(name: string): string {
    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new BadRequestException("Full name is required.");
    }
    return normalizedName;
  }

  private normalizeEmail(email: string): string {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      throw new BadRequestException("A valid email address is required.");
    }
    return normalizedEmail;
  }

  private normalizeEmployeeCode(employeeCode: string): string {
    const normalizedEmployeeCode = employeeCode.trim().toUpperCase();
    if (!normalizedEmployeeCode) {
      throw new BadRequestException("Employee ID is required.");
    }
    return normalizedEmployeeCode;
  }

  private assertValidPassword(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException(
        "Password must be at least 8 characters long.",
      );
    }
  }

  private async assertEmailAvailable(email: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException("An account with that email already exists.");
    }
  }

  private parseRole(role: string): UserRole {
    if (Object.values(UserRole).includes(role as UserRole)) {
      return role as UserRole;
    }

    throw new BadRequestException("A valid role selection is required.");
  }

  private parseScopes(scopes: Iterable<AdminScope | string>): AdminScope[] {
    const normalizedScopes = Array.from(new Set(Array.from(scopes)));

    if (normalizedScopes.length === 0) {
      throw new BadRequestException("At least one admin scope is required.");
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
        return "Payroll";
      case UserRole.COMPLIANCE_OFFICER:
        return "Compliance";
      case UserRole.AUDIT_ANALYST:
        return "Audit";
      default:
        return "Operations";
    }
  }

  private async generateEmployeeCode(
    prisma: Prisma.TransactionClient,
  ): Promise<string> {
    const nextEmployeeCodeNumber = await this.getNextEmployeeCodeNumber(prisma);
    return this.formatEmployeeCode(nextEmployeeCodeNumber);
  }

  private async getNextEmployeeCodeNumber(
    prisma: Prisma.TransactionClient | PrismaService,
  ): Promise<number> {
    const [userEmployeeCodes, employeeDirectoryCodes] = await Promise.all([
      prisma.user.findMany({
        where: { employeeCode: { not: null } },
        select: { employeeCode: true },
      }),
      prisma.employee.findMany({
        select: { employeeCode: true },
      }),
    ]);

    const highestEmployeeCodeNumber = Math.max(
      1000,
      ...userEmployeeCodes.map((entry) =>
        this.extractEmployeeCodeNumber(entry.employeeCode),
      ),
      ...employeeDirectoryCodes.map((entry) =>
        this.extractEmployeeCodeNumber(entry.employeeCode),
      ),
    );

    return highestEmployeeCodeNumber + 1;
  }

  private extractEmployeeCodeNumber(employeeCode: string | null): number {
    if (!employeeCode) {
      return 1000;
    }

    const match = employeeCode.match(/(\d+)$/);
    return match ? Number.parseInt(match[1], 10) : 1000;
  }

  private formatEmployeeCode(value: number): string {
    return `SK-${String(value).padStart(4, "0")}`;
  }

  private get encryptionKey(): Buffer {
    const key =
      process.env.PASSWORD_ENCRYPTION_KEY ||
      "default-32-character-secret-key-!";
    return Buffer.from(key.padEnd(32, "0").slice(0, 32));
  }

  private encryptPassword(password: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.encryptionKey, iv);

    let encrypted = cipher.update(password, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  }

  private decryptPassword(encryptedPassword: string): string {
    try {
      const parts = encryptedPassword.split(":");
      if (parts.length !== 3) return "";

      const [ivHex, authTagHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, "hex");
      const authTag = Buffer.from(authTagHex, "hex");

      const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        this.encryptionKey,
        iv,
      );
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedHex, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      return "";
    }
  }
}
