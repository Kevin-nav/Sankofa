import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async getEvidenceView() {
    const [loginEvents, systemEvents, networkEvents] = await Promise.all([
      this.prisma.loginEvent.findMany({
        orderBy: { loginTime: 'desc' },
        include: { user: true },
      }),
      this.prisma.systemEvent.findMany({
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.networkEvent.findMany({
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    return { loginEvents, systemEvents, networkEvents };
  }
}
