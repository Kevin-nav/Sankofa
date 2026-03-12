import { Controller, Get, Redirect } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Redirect('/login')
  getRoot(): { url: string } {
    return { url: '/login' };
  }
}
