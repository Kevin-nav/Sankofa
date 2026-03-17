import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditModule } from './audit/audit.module';
import { ComplianceModule } from './compliance/compliance.module';
import { AppConfigModule } from './config/app-config.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EmployeesModule } from './employees/employees.module';
import { HealthModule } from './health/health.module';
import { LayoutModule } from './layout/layout.module';
import { PayrollModule } from './payroll/payroll.module';
import { PrismaModule } from './prisma/prisma.module';
import { SystemModule } from './system/system.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    HealthModule,
    LayoutModule,
    AuthModule,
    AuditModule,
    DashboardModule,
    EmployeesModule,
    PayrollModule,
    ComplianceModule,
    ...(process.env.NODE_ENV === 'test' ? [SystemModule] : []),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
