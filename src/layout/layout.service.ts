import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { SessionUser } from '../auth/session.types';

type NavItem = {
  label: string;
  href: string;
};

type ShellViewModel = {
  title: string;
  sectionLabel: string;
  systemName: string;
  pageSummary: string;
  user: SessionUser;
  userRoleLabel: string;
  navItems: NavItem[];
};

@Injectable()
export class LayoutService {
  getShellViewModel(user: SessionUser): ShellViewModel {
    return {
      title: 'Operations Dashboard',
      sectionLabel: 'Internal Platform',
      systemName: 'Sankofa Payroll & Compliance Services',
      pageSummary:
        'Unified internal workspace for payroll processing, compliance review, and audit evidence oversight.',
      user,
      userRoleLabel: this.getRoleLabel(user.role),
      navItems: this.getNavigation(user.role),
    };
  }

  private getNavigation(role: UserRole): NavItem[] {
    switch (role) {
      case UserRole.PAYROLL_ADMIN:
        return [
          { label: 'Operations Dashboard', href: '/dashboard' },
          { label: 'Employees', href: '/employees' },
          { label: 'Payroll Batches', href: '/payroll' },
        ];
      case UserRole.COMPLIANCE_OFFICER:
        return [
          { label: 'Operations Dashboard', href: '/dashboard' },
          { label: 'Employees', href: '/employees' },
          { label: 'Payroll Batches', href: '/payroll' },
          { label: 'Compliance Queue', href: '/compliance' },
        ];
      case UserRole.AUDIT_ANALYST:
        return [
          { label: 'Operations Dashboard', href: '/dashboard' },
          { label: 'Employees', href: '/employees' },
          { label: 'Audit & Activity', href: '/audit' },
        ];
      default:
        return [{ label: 'Operations Dashboard', href: '/dashboard' }];
    }
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
        return 'Internal User';
    }
  }
}
