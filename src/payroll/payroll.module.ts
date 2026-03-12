import { Module } from '@nestjs/common';
import { LayoutModule } from '../layout/layout.module';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';

@Module({
  imports: [LayoutModule],
  controllers: [PayrollController],
  providers: [PayrollService],
})
export class PayrollModule {}
