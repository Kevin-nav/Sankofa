import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getLoginPage(): string {
    return 'Sankofa Payroll & Compliance Services Login';
  }
}
