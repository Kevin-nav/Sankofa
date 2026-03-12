import {
  Controller,
  Get,
  Param,
  Render,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { RoleGuard } from '../auth/role.guard';
import { SessionGuard } from '../auth/session.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { LayoutService } from '../layout/layout.service';
import { ComplianceService } from './compliance.service';

@Controller('compliance')
@UseGuards(SessionGuard, RoleGuard)
@Roles(UserRole.COMPLIANCE_OFFICER)
export class ComplianceController {
  constructor(
    private readonly complianceService: ComplianceService,
    private readonly layoutService: LayoutService,
  ) {}

  @Get()
  @Render('compliance/index')
  async listReviews(@Req() request: Request) {
    const sessionUser = request.session.user;

    if (!sessionUser) {
      throw new UnauthorizedException('No active session.');
    }

    const reviews = await this.complianceService.listReviews();
    const chrome = this.layoutService.getShellViewModel(sessionUser);

    return {
      ...chrome,
      title: 'Compliance Queue',
      pageSummary:
        'Quarterly review worklist, open exceptions, and sign-off readiness for payroll controls.',
      reviews,
    };
  }

  @Get(':batchCode')
  @Render('compliance/show')
  async showReview(@Req() request: Request, @Param('batchCode') batchCode: string) {
    const sessionUser = request.session.user;

    if (!sessionUser) {
      throw new UnauthorizedException('No active session.');
    }

    const review = await this.complianceService.getReview(batchCode);
    const chrome = this.layoutService.getShellViewModel(sessionUser);

    return {
      ...chrome,
      title: `${review.batch.quarter} ${review.batch.year} Compliance Review`,
      pageSummary:
        'Control status, reviewer comments, and issue-level flags tied to the payroll batch.',
      review,
    };
  }
}
