import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  async listBatches() {
    return this.prisma.payrollBatch.findMany({
      orderBy: [{ year: 'desc' }, { quarter: 'desc' }],
      include: {
        createdBy: true,
        _count: {
          select: { entries: true },
        },
      },
    });
  }

  async getBatch(batchCode: string) {
    const batch = await this.prisma.payrollBatch.findUnique({
      where: { batchCode },
      include: {
        createdBy: true,
        entries: {
          include: { employee: true },
          orderBy: { employee: { fullName: 'asc' } },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Payroll batch not found.');
    }

    return batch;
  }

  async getEntry(batchCode: string, employeeCode: string) {
    const entry = await this.prisma.payrollEntry.findFirst({
      where: {
        batch: { batchCode },
        employee: { employeeCode },
      },
      include: {
        batch: true,
        employee: true,
      },
    });

    if (!entry) {
      throw new NotFoundException('Payroll entry not found.');
    }

    return entry;
  }
}
