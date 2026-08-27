import type { Request, Response } from 'express';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { env } from '../config/env';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { AuthSession } from './auth.types';
import type { LoginAuthDto } from './dto/login-auth-dto';
import type { RegisterAuthDto } from './dto/register-auth-dto';

describe('AuthController', () => {
  const session: AuthSession = {
    user: { id: 'user-id', email: 'user@example.com' },
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  let authService: jest.Mocked<
    Pick<AuthService, 'register' | 'login' | 'refresh' | 'logout'>
  >;
  let controller: AuthController;
  let response: jest.Mocked<Pick<Response, 'cookie' | 'clearCookie'>>;

  beforeEach(() => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    };
    controller = new AuthController(authService as unknown as AuthService);
    response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
  });

  function expectedCookieOptions() {
    return {
      httpOnly: true,
      secure: env.AUTH_COOKIE_SECURE,
      sameSite: env.AUTH_COOKIE_SAME_SITE,
      path: '/auth',
      maxAge: env.JWT_REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
    };
  }

  function requestWithCookies(cookies?: Record<string, string>): Request {
    return { cookies } as unknown as Request;
  }

  it('registers a user, sets the refresh cookie, and returns only the public session', async () => {
    const dto: RegisterAuthDto = {
      email: 'user@example.com',
      password: 'StrongPassword123!',
    };
    authService.register.mockResolvedValue(session);

    const result = await controller.register(
      dto,
      response as unknown as Response,
    );

    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(response.cookie).toHaveBeenCalledWith(
      env.REFRESH_TOKEN_COOKIE_NAME,
      session.refreshToken,
      expectedCookieOptions(),
    );
    expect(result).toEqual({
      user: session.user,
      accessToken: session.accessToken,
    });
    expect(result).not.toHaveProperty('refreshToken');
  });

  it('propagates registration errors without writing a refresh cookie', async () => {
    const dto: RegisterAuthDto = {
      email: 'existing@example.com',
      password: 'StrongPassword123!',
    };
    const error = new ConflictException('Email is already registered');
    authService.register.mockRejectedValue(error);

    await expect(
      controller.register(dto, response as unknown as Response),
    ).rejects.toBe(error);
    expect(response.cookie).not.toHaveBeenCalled();
  });

  it('logs in a user, sets the refresh cookie, and hides the refresh token', async () => {
    const dto: LoginAuthDto = {
      email: 'user@example.com',
      password: 'StrongPassword123!',
    };
    authService.login.mockResolvedValue(session);

    const result = await controller.login(dto, response as unknown as Response);

    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(response.cookie).toHaveBeenCalledWith(
      env.REFRESH_TOKEN_COOKIE_NAME,
      session.refreshToken,
      expectedCookieOptions(),
    );
    expect(result).toEqual({
      user: session.user,
      accessToken: session.accessToken,
    });
    expect(result).not.toHaveProperty('refreshToken');
  });

  it('propagates login errors without writing a cookie', async () => {
    const dto: LoginAuthDto = {
      email: 'user@example.com',
      password: 'wrong-password',
    };
    const error = new UnauthorizedException('Invalid credentials');
    authService.login.mockRejectedValue(error);

    await expect(
      controller.login(dto, response as unknown as Response),
    ).rejects.toBe(error);
    expect(response.cookie).not.toHaveBeenCalled();
  });

  it('refreshes a session from the configured cookie and rotates the cookie', async () => {
    const refreshToken = 'old-refresh-token';
    const rotatedSession = { ...session, refreshToken: 'new-refresh-token' };
    authService.refresh.mockResolvedValue(rotatedSession);

    const result = await controller.refresh(
      requestWithCookies({ [env.REFRESH_TOKEN_COOKIE_NAME]: refreshToken }),
      response as unknown as Response,
    );

    expect(authService.refresh).toHaveBeenCalledWith(refreshToken);
    expect(response.cookie).toHaveBeenCalledWith(
      env.REFRESH_TOKEN_COOKIE_NAME,
      rotatedSession.refreshToken,
      expectedCookieOptions(),
    );
    expect(result).toEqual({
      user: rotatedSession.user,
      accessToken: rotatedSession.accessToken,
    });
  });

  it('passes an absent refresh cookie as undefined and propagates the service error', async () => {
    const error = new UnauthorizedException('Refresh token is required');
    authService.refresh.mockRejectedValue(error);

    await expect(
      controller.refresh(requestWithCookies(), response as unknown as Response),
    ).rejects.toBe(error);

    expect(authService.refresh).toHaveBeenCalledWith(undefined);
    expect(response.cookie).not.toHaveBeenCalled();
  });

  it('logs out the current refresh session, clears the cookie, and returns success', async () => {
    const refreshToken = 'refresh-token';
    authService.logout.mockResolvedValue(undefined);

    const result = await controller.logout(
      requestWithCookies({ [env.REFRESH_TOKEN_COOKIE_NAME]: refreshToken }),
      response as unknown as Response,
    );

    expect(authService.logout).toHaveBeenCalledWith(refreshToken);
    expect(response.clearCookie).toHaveBeenCalledWith(
      env.REFRESH_TOKEN_COOKIE_NAME,
      expectedCookieOptions(),
    );
    expect(result).toEqual({ success: true });
  });

  it('passes an absent refresh cookie to logout and still clears the cookie', async () => {
    authService.logout.mockResolvedValue(undefined);

    const result = await controller.logout(
      requestWithCookies(),
      response as unknown as Response,
    );

    expect(authService.logout).toHaveBeenCalledWith(undefined);
    expect(response.clearCookie).toHaveBeenCalledWith(
      env.REFRESH_TOKEN_COOKIE_NAME,
      expectedCookieOptions(),
    );
    expect(result).toEqual({ success: true });
  });
});
