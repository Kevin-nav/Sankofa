import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ComplianceModule } from './compliance/compliance.module';
import { EmployeesModule } from './employees/employees.module';
import { LayoutModule } from './layout/layout.module';
import { PayrollModule } from './payroll/payroll.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    LayoutModule,
    AuthModule,
    EmployeesModule,
    PayrollModule,
    ComplianceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
