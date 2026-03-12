import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async listEmployees(department?: string) {
    const where = department ? { department } : undefined;

    const [employees, departments] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        orderBy: [{ department: 'asc' }, { fullName: 'asc' }],
      }),
      this.prisma.employee.findMany({
        distinct: ['department'],
        orderBy: { department: 'asc' },
        select: { department: true },
      }),
    ]);

    return {
      employees,
      departments: departments.map((entry) => entry.department),
    };
  }

  async getEmployeeByCode(employeeCode: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { employeeCode },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    return employee;
  }
}
