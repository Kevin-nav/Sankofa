import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { SessionUser } from '../auth/session.types';

type NavItem = {
  label: string;
  href: string;
};

type DashboardCard = {
  label: string;
  value: string;
  detail: string;
};

type DashboardViewModel = {
  title: string;
  sectionLabel: string;
  systemName: string;
  pageSummary: string;
  user: SessionUser;
  userRoleLabel: string;
  navItems: NavItem[];
  dashboardCards: DashboardCard[];
  activityItems: string[];
};

@Injectable()
export class LayoutService {
  getDashboardViewModel(user: SessionUser): DashboardViewModel {
    return {
      title: 'Operations Dashboard',
      sectionLabel: 'Internal Platform',
      systemName: 'Sankofa Payroll & Compliance Services',
      pageSummary:
        'Unified internal workspace for payroll processing, compliance review, and audit evidence oversight.',
      user,
      userRoleLabel: this.getRoleLabel(user.role),
      navItems: this.getNavigation(user.role),
      dashboardCards: this.getDashboardCards(user.role),
      activityItems: this.getActivityItems(user.role),
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

  private getDashboardCards(role: UserRole): DashboardCard[] {
    switch (role) {
      case UserRole.PAYROLL_ADMIN:
        return [
          {
            label: 'Quarterly batches',
            value: '04',
            detail: 'Open payroll cycles awaiting verification.',
          },
          {
            label: 'Pending employee updates',
            value: '11',
            detail: 'Directory changes pending payroll review.',
          },
          {
            label: 'Export readiness',
            value: '92%',
            detail: 'Payroll records aligned for controlled release.',
          },
        ];
      case UserRole.COMPLIANCE_OFFICER:
        return [
          {
            label: 'Reviews assigned',
            value: '03',
            detail: 'Quarterly batches queued for compliance sign-off.',
          },
          {
            label: 'Flagged records',
            value: '07',
            detail: 'Entries requiring documentation before approval.',
          },
          {
            label: 'Policy checkpoints',
            value: '18',
            detail: 'Verification controls tracked on this cycle.',
          },
        ];
      case UserRole.AUDIT_ANALYST:
        return [
          {
            label: 'Login anomalies',
            value: '05',
            detail: 'Flagged timestamps across monitored accounts.',
          },
          {
            label: 'System events',
            value: '14',
            detail: 'Read-only host evidence loaded for review.',
          },
          {
            label: 'Outbound links',
            value: '03',
            detail: 'Network records marked for audit follow-up.',
          },
        ];
      default:
        return [];
    }
  }

  private getActivityItems(role: UserRole): string[] {
    switch (role) {
      case UserRole.PAYROLL_ADMIN:
        return [
          'Quarterly payroll sheet synchronized for internal review.',
          'Bank account masking verified across finance department records.',
          'Compensation adjustments staged for next approval window.',
        ];
      case UserRole.COMPLIANCE_OFFICER:
        return [
          'Review queue updated with newly flagged deduction mismatches.',
          'Policy acknowledgement status refreshed for the current cycle.',
          'Pending sign-off records grouped by quarter and department.',
        ];
      case UserRole.AUDIT_ANALYST:
        return [
          'Suspicious login history assembled into the investigation timeline.',
          'Host event feed reconciled against payroll workstation inventory.',
          'Outbound connection records marked for evidence preservation.',
        ];
      default:
        return [];
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
