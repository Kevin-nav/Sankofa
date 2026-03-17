import {
  Controller,
  Get,
  Param,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { SessionGuard } from '../auth/session.guard';
import { LayoutService } from '../layout/layout.service';
import { PayrollService } from './payroll.service';

@Controller('payroll')
@UseGuards(SessionGuard)
export class PayrollController {
  constructor(
    private readonly payrollService: PayrollService,
    private readonly layoutService: LayoutService,
  ) {}

  @Get()
  async listBatches(@Req() request: Request) {
    const sessionUser = request.session.user;

    if (!sessionUser) {
      throw new UnauthorizedException('No active session.');
    }

    const batches = await this.payrollService.listBatches();
    const chrome = this.layoutService.getShellViewModel(sessionUser);

    return {
      ...chrome,
      title: 'Payroll Batches',
      pageSummary:
        'Quarterly payroll runs, approval state, and linked employee entries for internal review.',
      batches,
    };
  }

  @Get(':batchCode')
  async showBatch(@Req() request: Request, @Param('batchCode') batchCode: string) {
    const sessionUser = request.session.user;

    if (!sessionUser) {
      throw new UnauthorizedException('No active session.');
    }

    const batch = await this.payrollService.getBatch(batchCode);
    const chrome = this.layoutService.getShellViewModel(sessionUser);

    return {
      ...chrome,
      title: `${batch.quarter} ${batch.year} Payroll Batch`,
      pageSummary:
        'Payroll batch totals, review status, and linked employee payroll records.',
      batch,
    };
  }

  @Get(':batchCode/entries/:employeeCode')
  async showEntry(
    @Req() request: Request,
    @Param('batchCode') batchCode: string,
    @Param('employeeCode') employeeCode: string,
  ) {
    const sessionUser = request.session.user;

    if (!sessionUser) {
      throw new UnauthorizedException('No active session.');
    }

    const entry = await this.payrollService.getEntry(batchCode, employeeCode);
    const chrome = this.layoutService.getShellViewModel(sessionUser);

    return {
      ...chrome,
      title: `${entry.employee.fullName} Payroll Entry`,
      pageSummary:
        'Individual payroll line-item details for verification, exceptions, and controlled review.',
      entry,
    };
  }
}
