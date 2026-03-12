import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async listReviews() {
    return this.prisma.complianceReview.findMany({
      orderBy: [{ batch: { year: 'desc' } }, { batch: { quarter: 'desc' } }],
      include: {
        batch: true,
        reviewer: true,
        _count: {
          select: { flags: true },
        },
      },
    });
  }

  async getReview(batchCode: string) {
    const review = await this.prisma.complianceReview.findFirst({
      where: {
        batch: { batchCode },
      },
      include: {
        batch: true,
        reviewer: true,
        flags: {
          include: {
            payrollEntry: {
              include: { employee: true },
            },
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Compliance review not found.');
    }

    return review;
  }
}
