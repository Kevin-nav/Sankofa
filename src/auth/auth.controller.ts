import {
  Body,
  Controller,
  HttpCode,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  getMe(@Req() request: Request) {
    const csrfToken = request.session.csrfToken ?? '';

    if (request.session.user) {
      return {
        user: request.session.user,
        csrfToken,
      };
    }

    return {
      user: null,
      csrfToken,
    };
  }

  @Post('login')
  async postLogin(
    @Body('email') email: string,
    @Body('password') password: string,
    @Req() request: Request,
  ) {
    const user = await this.authService.authenticate(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials. Verify your assigned demo account.');
    }

    request.session.user = await this.authService.buildSessionUser(user.id);

    return { success: true, user: request.session.user, csrfToken: request.session.csrfToken ?? '' };
  }

  @Post('signup')
  @HttpCode(201)
  async postSignup(
    @Body('name') name: string,
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('role') role: string,
    @Req() request: Request,
  ) {
    const user = await this.authService.signup({
      name,
      email,
      password,
      role,
    });

    request.session.user = await this.authService.buildSessionUser(user.id);

    return { success: true, user: request.session.user, csrfToken: request.session.csrfToken ?? '' };
  }

  @Post('reset-password')
  @HttpCode(200)
  async postResetPassword(
    @Body('employeeCode') employeeCode: string,
    @Body('name') name: string,
    @Body('email') email: string,
    @Body('password') password: string,
    @Req() request: Request,
  ) {
    await this.authService.resetEmployeePassword({
      employeeCode,
      name,
      email,
      password,
    });

    return {
      success: true,
      message: 'Password updated. Sign in with your new password.',
      csrfToken: request.session.csrfToken ?? '',
    };
  }

  @Post('logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await new Promise<void>((resolve, reject) => {
      request.session.destroy((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    response.clearCookie('connect.sid'); // Assuming default connect.sid cookie
    return { success: true };
  }
}
