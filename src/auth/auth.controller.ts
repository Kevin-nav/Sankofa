import {
  Body,
  Controller,
  Get,
  Post,
  Render,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SessionGuard } from './session.guard';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  @Render('login')
  getLogin(@Req() request: Request): { title: string; error?: string } {
    if (request.session.user) {
      return {
        title: 'Session Active',
        error: 'You are already signed in to the internal platform.',
      };
    }

    return {
      title: 'Internal Access',
    };
  }

  @Post('login')
  async postLogin(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res() response: Response,
    @Req() request: Request,
  ): Promise<void> {
    const user = await this.authService.authenticate(email, password);

    if (!user) {
      response.status(401).render('login', {
        title: 'Internal Access',
        error: 'Invalid credentials. Verify your assigned demo account.',
      });
      return;
    }

    request.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    response.redirect('/dashboard');
  }

  @Post('logout')
  async logout(@Req() request: Request, @Res() response: Response): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      request.session.destroy((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    response.redirect('/login');
  }

  @Get('dashboard')
  @UseGuards(SessionGuard)
  getDashboard(@Req() request: Request): string {
    const sessionUser = request.session.user;

    if (!sessionUser) {
      throw new UnauthorizedException('No active session.');
    }

    return this.authService.getDashboardGreeting(sessionUser);
  }
}
