import {
  Controller,
  Get,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { SessionGuard } from '../auth/session.guard';
import { LayoutService } from '../layout/layout.service';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(SessionGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly layoutService: LayoutService,
  ) {}

  @Get()
  async index(@Req() request: Request) {
    const sessionUser = request.session.user;

    if (!sessionUser) {
      throw new UnauthorizedException('No active session.');
    }

    const chrome = this.layoutService.getShellViewModel(sessionUser);
    const dashboard = await this.dashboardService.getDashboardData(sessionUser);

    return {
      ...chrome,
      ...dashboard,
      title: 'Operations Dashboard',
      pageSummary:
        'Unified internal workspace for payroll processing, compliance review, and audit evidence oversight.',
    };
  }
}
