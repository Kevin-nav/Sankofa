import { Injectable } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { SessionUser } from './session.types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async authenticate(email: string, password: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || user.passwordHash !== password) {
      return null;
    }

    return user;
  }

  getDashboardGreeting(sessionUser: SessionUser): string {
    return `Welcome ${sessionUser.name}. Role: ${this.getRoleLabel(sessionUser.role)}`;
  }

  private getRoleLabel(role: UserRole): string {
    switch (role) {
      case UserRole.PAYROLL_ADMIN:
        return 'Payroll Admin';
      case UserRole.COMPLIANCE_OFFICER:
        return 'Compliance Officer';
      case UserRole.AUDIT_ANALYST:
        return 'Audit Analyst';
      default:
        return 'User';
    }
  }
}
