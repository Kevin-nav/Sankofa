import {
  Body,
  Controller,
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

    request.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return { success: true, user: request.session.user };
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
