/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ConflictException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as requestContext from '../common/request-context';

describe('AuthService', () => {
  const db = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as any;
  const jwtService = { signAsync: jest.fn() } as any;
  const passwordService = { hash: jest.fn(), verify: jest.fn() } as any;
  const service = new AuthService(db, jwtService, passwordService);
  const loggerSpy = jest.spyOn(Logger.prototype, 'log');

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(requestContext, 'getCorrelationId')
      .mockReturnValue('test-correlation-id');
  });

  function selectResult(result: unknown) {
    return {
      from: () => ({ where: () => ({ limit: async () => result }) }),
    };
  }

  function collectColumnNames(
    value: unknown,
    names = new Set<string>(),
    seen = new Set<object>(),
  ) {
    if (!value || typeof value !== 'object' || seen.has(value)) {
      return names;
    }

    seen.add(value);
    for (const [key, child] of Object.entries(value)) {
      if (key === 'name' && typeof child === 'string') {
        names.add(child);
      }
      collectColumnNames(child, names, seen);
    }

    return names;
  }

  it('registers a normalized email and stores a hashed refresh token', async () => {
    db.select.mockReturnValue(selectResult([]));
    passwordService.hash.mockResolvedValue('password-hash');
    db.insert.mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: async () => [{ id: 'user-id', email: 'user@example.com' }],
      }),
    });
    jwtService.signAsync.mockResolvedValue('access-token');

    const result = await service.register({
      email: ' User@Example.com ',
      password: 'password123',
    });

    expect(result.user).toEqual({ id: 'user-id', email: 'user@example.com' });
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBeTruthy();
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(db.insert).toHaveBeenCalledTimes(2);
    const valuesMock = db.insert.mock.results[1].value.values;
    expect(valuesMock.mock.calls[1][0].tokenHash).not.toBe(result.refreshToken);

    const logPayload = JSON.parse(loggerSpy.mock.calls.at(-1)?.[0] as string);
    expect(logPayload).toMatchObject({
      correlationId: 'test-correlation-id',
      eventType: 'registration',
      outcome: 'succeeded',
      userId: 'user-id',
    });
    expect(JSON.stringify(logPayload)).not.toContain('password');
    expect(JSON.stringify(logPayload)).not.toContain('token');
  });

  it('rejects duplicate registration', async () => {
    db.select.mockReturnValue(selectResult([{ id: 'existing-id' }]));

    await expect(
      service.register({ email: 'user@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in with a valid password and creates a session', async () => {
    db.select.mockReturnValue(
      selectResult([
        {
          id: 'user-id',
          email: 'user@example.com',
          passwordHash: 'stored-hash',
        },
      ]),
    );
    passwordService.verify.mockResolvedValue(true);
    db.insert.mockReturnValue({ values: jest.fn() });
    jwtService.signAsync.mockResolvedValue('access-token');

    const result = await service.login({
      email: ' USER@example.com ',
      password: 'password123',
    });

    expect(result.user).toEqual({ id: 'user-id', email: 'user@example.com' });
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBeTruthy();
    expect(db.insert).toHaveBeenCalledTimes(1);

    const logPayload = JSON.parse(loggerSpy.mock.calls[0][0] as string);
    expect(Object.keys(logPayload).sort()).toEqual([
      'correlationId',
      'eventType',
      'outcome',
      'timestamp',
      'userId',
    ]);
    expect(logPayload).toMatchObject({
      eventType: 'login',
      outcome: 'succeeded',
      userId: 'user-id',
    });
  });

  it('rejects an invalid password without revealing account details', async () => {
    db.select.mockReturnValue(
      selectResult([
        {
          id: 'user-id',
          email: 'user@example.com',
          passwordHash: 'stored-hash',
        },
      ]),
    );
    passwordService.verify.mockResolvedValue(false);

    await expect(
      service.login({ email: 'user@example.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    const logPayload = JSON.parse(loggerSpy.mock.calls[0][0] as string);
    expect(logPayload).toMatchObject({
      eventType: 'login',
      outcome: 'rejected',
      reason: 'invalid_credentials',
    });
    expect(JSON.stringify(logPayload)).not.toContain('wrong-password');
    expect(JSON.stringify(logPayload)).not.toContain('passwordHash');
    expect(Object.keys(logPayload).sort()).toEqual([
      'correlationId',
      'eventType',
      'outcome',
      'reason',
      'timestamp',
    ]);
  });

  it('rejects login when the account does not exist without verifying a password', async () => {
    db.select.mockReturnValue(selectResult([]));

    await expect(
      service.login({ email: 'missing@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(passwordService.verify).not.toHaveBeenCalled();
  });

  it('propagates registration database failures before creating a session', async () => {
    const databaseError = new Error('Registration query failed');
    db.select.mockReturnValue({
      from: () => ({
        where: () => ({
          limit: async () => {
            throw databaseError;
          },
        }),
      }),
    });

    await expect(
      service.register({ email: 'user@example.com', password: 'password123' }),
    ).rejects.toBe(databaseError);
    expect(passwordService.hash).not.toHaveBeenCalled();
  });

  it('rotates a valid refresh token and rejects the old token later', async () => {
    const session = {
      id: 'session-id',
      userId: 'user-id',
      tokenHash: 'stored-token-hash',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    };
    db.select
      .mockReturnValueOnce(selectResult([session]))
      .mockReturnValueOnce(
        selectResult([{ id: 'user-id', email: 'user@example.com' }]),
      );
    db.update.mockReturnValue({
      set: () => ({
        where: () => ({ returning: async () => [{ id: 'session-id' }] }),
      }),
    });
    db.insert.mockReturnValue({ values: jest.fn() });
    jwtService.signAsync.mockResolvedValue('new-access-token');

    const result = await service.refresh('old-refresh-token');

    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).not.toBe('old-refresh-token');
    expect(db.update).toHaveBeenCalled();

    db.select.mockReturnValue(
      selectResult([{ ...session, revokedAt: new Date() }]),
    );
    await expect(service.refresh('old-refresh-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    const logPayload = JSON.parse(loggerSpy.mock.calls.at(-1)?.[0] as string);
    expect(logPayload).toMatchObject({
      eventType: 'refresh',
      outcome: 'rejected',
      reason: 'revoked_refresh_token',
      userId: 'user-id',
    });
    expect(JSON.stringify(logPayload)).not.toContain('old-refresh-token');
    expect(Object.keys(logPayload).sort()).toEqual([
      'correlationId',
      'eventType',
      'outcome',
      'reason',
      'timestamp',
      'userId',
    ]);
  });

  it('rejects a refresh request without a refresh token', async () => {
    await expect(service.refresh(undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(db.select).not.toHaveBeenCalled();
  });

  it('rejects an unknown refresh token', async () => {
    db.select.mockReturnValue(selectResult([]));

    await expect(service.refresh('unknown-refresh-token')).rejects.toThrow(
      'Invalid refresh token',
    );
    expect(db.update).not.toHaveBeenCalled();
  });

  it('rejects an expired refresh session', async () => {
    db.select.mockReturnValue(
      selectResult([
        {
          id: 'session-id',
          userId: 'user-id',
          tokenHash: 'stored-token-hash',
          expiresAt: new Date(Date.now() - 1),
          revokedAt: null,
        },
      ]),
    );

    await expect(service.refresh('expired-refresh-token')).rejects.toThrow(
      'Invalid refresh token',
    );
    expect(db.update).not.toHaveBeenCalled();
  });

  it('rejects a refresh session whose user no longer exists', async () => {
    const session = {
      id: 'session-id',
      userId: 'missing-user-id',
      tokenHash: 'stored-token-hash',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    };
    db.select
      .mockReturnValueOnce(selectResult([session]))
      .mockReturnValueOnce(selectResult([]));

    await expect(service.refresh('orphaned-refresh-token')).rejects.toThrow(
      'Invalid refresh token',
    );
    expect(db.update).not.toHaveBeenCalled();
  });

  it('rejects refresh-token reuse when the session cannot be revoked', async () => {
    const session = {
      id: 'session-id',
      userId: 'user-id',
      tokenHash: 'stored-token-hash',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    };
    db.select
      .mockReturnValueOnce(selectResult([session]))
      .mockReturnValueOnce(
        selectResult([{ id: 'user-id', email: 'user@example.com' }]),
      );
    db.update.mockReturnValue({
      set: () => ({
        where: () => ({ returning: async () => [] }),
      }),
    });

    await expect(service.refresh('reused-refresh-token')).rejects.toThrow(
      'Invalid refresh token',
    );
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('revokes an active session during logout', async () => {
    db.update.mockReturnValue({
      set: () => ({
        where: () => ({
          returning: () =>
            Promise.resolve([{ id: 'session-id', userId: 'user-id' }]),
        }),
      }),
    });

    await expect(service.logout('refresh-token')).resolves.toBeUndefined();

    expect(db.update).toHaveBeenCalled();

    const logPayload = JSON.parse(loggerSpy.mock.calls[0][0] as string);
    expect(logPayload).toMatchObject({
      eventType: 'logout',
      outcome: 'completed',
      reason: 'session_revoked',
      userId: 'user-id',
    });
    expect(Object.keys(logPayload).sort()).toEqual([
      'correlationId',
      'eventType',
      'outcome',
      'reason',
      'timestamp',
      'userId',
    ]);
  });

  it('completes logout without a refresh token', async () => {
    await expect(service.logout(undefined)).resolves.toBeUndefined();

    expect(db.update).not.toHaveBeenCalled();
  });

  it('completes logout when the refresh token has no active session', async () => {
    db.update.mockReturnValue({
      set: () => ({
        where: () => ({ returning: async () => [] }),
      }),
    });

    await expect(
      service.logout('inactive-refresh-token'),
    ).resolves.toBeUndefined();

    expect(db.update).toHaveBeenCalledTimes(1);
  });

  it('cleans expired and revoked sessions without targeting active sessions', async () => {
    let cleanupPredicate: unknown;
    db.delete.mockReturnValue({
      where: (predicate: unknown) => {
        cleanupPredicate = predicate;
        return Promise.resolve();
      },
    });

    await service.cleanupExpiredSessions();
    await service.cleanupExpiredSessions();

    expect(db.delete).toHaveBeenCalledTimes(2);
    expect([...collectColumnNames(cleanupPredicate)]).toEqual(
      expect.arrayContaining(['expires_at', 'revoked_at']),
    );
  });

  it('does not serialize unexpected security metadata', () => {
    const logSecurityEvent = (
      service as unknown as {
        logSecurityEvent: (
          eventType: string,
          outcome: string,
          metadata: Record<string, string>,
        ) => void;
      }
    ).logSecurityEvent;

    logSecurityEvent.call(service, 'login', 'rejected', {
      reason: 'invalid_credentials',
      userId: 'user-id',
      password: 'must-not-be-logged',
    });

    const logPayload = JSON.parse(loggerSpy.mock.calls[0][0] as string);
    expect(Object.keys(logPayload).sort()).toEqual([
      'correlationId',
      'eventType',
      'outcome',
      'reason',
      'timestamp',
      'userId',
    ]);
    expect(JSON.stringify(logPayload)).not.toContain('must-not-be-logged');
  });

  it('includes correlationId in all security event logs', async () => {
    db.select.mockReturnValue(selectResult([]));
    passwordService.hash.mockResolvedValue('password-hash');
    db.insert.mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: async () => [{ id: 'user-id', email: 'user@example.com' }],
      }),
    });
    jwtService.signAsync.mockResolvedValue('access-token');

    await service.register({
      email: 'user@example.com',
      password: 'password123',
    });

    const logPayload = JSON.parse(loggerSpy.mock.calls.at(-1)?.[0] as string);
    expect(logPayload).toHaveProperty('correlationId', 'test-correlation-id');
    expect(logPayload).toHaveProperty('eventType', 'registration');
  });

  it('logs cleanup job completion with deleted session count', async () => {
    db.delete.mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: async () => [
          { id: 'session-1' },
          { id: 'session-2' },
          { id: 'session-3' },
        ],
      }),
    });

    await service.cleanupExpiredSessions();

    expect(loggerSpy).toHaveBeenCalled();
    const logPayload = JSON.parse(loggerSpy.mock.calls.at(-1)?.[0] as string);
    expect(logPayload).toMatchObject({
      message: 'Session cleanup completed',
      deletedCount: 3,
    });
    expect(logPayload).toHaveProperty('timestamp');
  });

  it('logs cleanup job error if deletion fails', async () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error');
    db.delete.mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest
          .fn()
          .mockRejectedValue(new Error('Database error') as never),
      }),
    });

    await service.cleanupExpiredSessions();

    expect(errorSpy).toHaveBeenCalled();
    const logPayload = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(logPayload).toMatchObject({
      message: 'Session cleanup failed',
    });
    expect(logPayload).toHaveProperty('error', 'Database error');
    expect(logPayload).toHaveProperty('timestamp');
    errorSpy.mockRestore();
  });
});
