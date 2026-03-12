import {
  Controller,
  Get,
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
import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(SessionGuard, RoleGuard)
@Roles(UserRole.AUDIT_ANALYST)
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly layoutService: LayoutService,
  ) {}

  @Get()
  @Render('audit/index')
  async index(@Req() request: Request) {
    const sessionUser = request.session.user;

    if (!sessionUser) {
      throw new UnauthorizedException('No active session.');
    }

    const evidence = await this.auditService.getEvidenceView();
    const chrome = this.layoutService.getDashboardViewModel(sessionUser);

    return {
      ...chrome,
      title: 'Audit & Activity',
      pageSummary:
        'Read-only investigation evidence for login anomalies, host events, and outbound network activity.',
      ...evidence,
    };
  }
}
