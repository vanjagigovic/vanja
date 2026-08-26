/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function selectResult(result: unknown) {
    return {
      from: () => ({ where: () => ({ limit: async () => result }) }),
    };
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
  });

  it('revokes an active session during logout', async () => {
    db.update.mockReturnValue({ set: () => ({ where: jest.fn() }) });

    await expect(service.logout('refresh-token')).resolves.toBeUndefined();

    expect(db.update).toHaveBeenCalled();
  });
});
