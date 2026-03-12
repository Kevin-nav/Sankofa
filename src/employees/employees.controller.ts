import {
  Controller,
  Get,
  Param,
  Query,
  Render,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { SessionGuard } from '../auth/session.guard';
import { LayoutService } from '../layout/layout.service';
import { EmployeesService } from './employees.service';

@Controller('employees')
@UseGuards(SessionGuard)
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly layoutService: LayoutService,
  ) {}

  @Get()
  @Render('employees/index')
  async listEmployees(@Req() request: Request, @Query('department') department?: string) {
    const sessionUser = request.session.user;

    if (!sessionUser) {
      throw new UnauthorizedException('No active session.');
    }

    const { employees, departments } = await this.employeesService.listEmployees(department);
    const chrome = this.layoutService.getShellViewModel(sessionUser);

    return {
      ...chrome,
      title: 'Employee Directory',
      pageSummary:
        'Operational employee records used by payroll, compliance review, and audit correlation.',
      employees,
      departments,
      selectedDepartment: department ?? '',
    };
  }

  @Get(':employeeCode')
  @Render('employees/show')
  async showEmployee(@Req() request: Request, @Param('employeeCode') employeeCode: string) {
    const sessionUser = request.session.user;

    if (!sessionUser) {
      throw new UnauthorizedException('No active session.');
    }

    const employee = await this.employeesService.getEmployeeByCode(employeeCode);
    const chrome = this.layoutService.getShellViewModel(sessionUser);

    return {
      ...chrome,
      title: employee.fullName,
      pageSummary:
        'Employee profile details used for payroll validation, bank masking checks, and audit context.',
      employee,
    };
  }
}
