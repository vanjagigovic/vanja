import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { env } from '../config/env';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth-dto';
import { RegisterAuthDto } from './dto/register-auth-dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async register(
    @Body() dto: RegisterAuthDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.register(dto);
    this.setRefreshCookie(response, session.refreshToken);
    return this.toPublicResponse(session);
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() dto: LoginAuthDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(dto);
    this.setRefreshCookie(response, session.refreshToken);
    return this.toPublicResponse(session);
  }

  @Post('refresh')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.refresh(
      request.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME],
    );
    this.setRefreshCookie(response, session.refreshToken);
    return this.toPublicResponse(session);
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(
      request.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME],
    );
    response.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, this.cookieOptions());
    return { success: true };
  }

  private toPublicResponse(session: { user: unknown; accessToken: string }) {
    return { user: session.user, accessToken: session.accessToken };
  }

  private setRefreshCookie(response: Response, refreshToken: string) {
    response.cookie(
      env.REFRESH_TOKEN_COOKIE_NAME,
      refreshToken,
      this.cookieOptions(),
    );
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: env.AUTH_COOKIE_SECURE,
      sameSite: env.AUTH_COOKIE_SAME_SITE,
      path: '/auth',
      maxAge: env.JWT_REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
    } as const;
  }
}
