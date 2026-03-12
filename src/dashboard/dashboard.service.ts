import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { SessionUser } from '../auth/session.types';
import { PrismaService } from '../prisma/prisma.service';

type DashboardCard = {
  label: string;
  value: string;
  detail: string;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(user: SessionUser): Promise<{
    dashboardCards: DashboardCard[];
    activityItems: string[];
  }> {
    switch (user.role) {
      case UserRole.PAYROLL_ADMIN:
        return this.getPayrollAdminData();
      case UserRole.COMPLIANCE_OFFICER:
        return this.getComplianceOfficerData();
      case UserRole.AUDIT_ANALYST:
        return this.getAuditAnalystData();
      default:
        return { dashboardCards: [], activityItems: [] };
    }
  }

  private async getPayrollAdminData() {
    const [batches, activeEmployees, flaggedEntries] = await Promise.all([
      this.prisma.payrollBatch.count(),
      this.prisma.employee.count({
        where: { employmentStatus: 'Active' },
      }),
      this.prisma.payrollEntry.count({
        where: { isFlagged: true },
      }),
    ]);

    return {
      dashboardCards: [
        {
          label: 'Quarterly batches',
          value: String(batches).padStart(2, '0'),
          detail: 'Seeded payroll cycles available for operations and review.',
        },
        {
          label: 'Active employees',
          value: String(activeEmployees).padStart(2, '0'),
          detail: 'Employees currently covered by internal payroll processing.',
        },
        {
          label: 'Flagged entries',
          value: String(flaggedEntries).padStart(2, '0'),
          detail: 'Payroll line items already marked for follow-up.',
        },
      ],
      activityItems: [
        `${batches} quarterly payroll batches are available for review.`,
        `${activeEmployees} active employee records are linked into current payroll coverage.`,
        `${flaggedEntries} payroll entries are already marked for verification.`,
      ],
    };
  }

  private async getComplianceOfficerData() {
    const [reviews, openFlags, completedChecks] = await Promise.all([
      this.prisma.complianceReview.count(),
      this.prisma.complianceFlag.count({
        where: {
          resolutionState: {
            in: ['Open', 'Pending Evidence'],
          },
        },
      }),
      this.prisma.complianceReview.aggregate({
        _sum: {
          completedChecks: true,
        },
      }),
    ]);

    return {
      dashboardCards: [
        {
          label: 'Reviews assigned',
          value: String(reviews).padStart(2, '0'),
          detail: 'Compliance review records tied to seeded payroll batches.',
        },
        {
          label: 'Open flags',
          value: String(openFlags).padStart(2, '0'),
          detail: 'Issues that still need documentation or resolution.',
        },
        {
          label: 'Checks completed',
          value: String(completedChecks._sum.completedChecks ?? 0),
          detail: 'Total completed control checks across seeded reviews.',
        },
      ],
      activityItems: [
        `${reviews} compliance reviews are available in the work queue.`,
        `${openFlags} flags are still unresolved or pending evidence.`,
        `${completedChecks._sum.completedChecks ?? 0} total control checks have been recorded.`,
      ],
    };
  }

  private async getAuditAnalystData() {
    const [loginAnomalies, systemEvents, networkEvents] = await Promise.all([
      this.prisma.loginEvent.count({
        where: { anomalyFlag: true },
      }),
      this.prisma.systemEvent.count(),
      this.prisma.networkEvent.count(),
    ]);

    return {
      dashboardCards: [
        {
          label: 'Login anomalies',
          value: String(loginAnomalies).padStart(2, '0'),
          detail: 'Out-of-hours authentication events flagged for review.',
        },
        {
          label: 'System events',
          value: String(systemEvents).padStart(2, '0'),
          detail: 'Host-side evidence records loaded into the investigation view.',
        },
        {
          label: 'Outbound links',
          value: String(networkEvents).padStart(2, '0'),
          detail: 'Network connections preserved for audit correlation.',
        },
      ],
      activityItems: [
        `${loginAnomalies} anomalous login timestamps are tied to the seeded scenario.`,
        `${systemEvents} host events are preserved for workstation review.`,
        `${networkEvents} outbound network events are ready for analyst inspection.`,
      ],
    };
  }
}
