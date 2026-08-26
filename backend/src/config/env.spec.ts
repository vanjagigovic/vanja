import { describe, expect, it } from '@jest/globals';
import { parseEnv } from './env';

const baseEnv = {
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/calendar',
  JWT_ACCESS_SECRET: 'a'.repeat(64),
};

describe('cookie environment validation', () => {
  it('allows lax cookies without Secure in development', () => {
    const config = parseEnv({
      ...baseEnv,
      NODE_ENV: 'development',
      AUTH_COOKIE_SAME_SITE: 'lax',
      AUTH_COOKIE_SECURE: 'false',
    });

    expect(config.AUTH_COOKIE_SECURE).toBe(false);
    expect(config.AUTH_COOKIE_SAME_SITE).toBe('lax');
  });

  it('allows secure cookies with lax SameSite', () => {
    const config = parseEnv({
      ...baseEnv,
      NODE_ENV: 'development',
      AUTH_COOKIE_SAME_SITE: 'lax',
      AUTH_COOKIE_SECURE: 'true',
    });

    expect(config.AUTH_COOKIE_SECURE).toBe(true);
  });

  it('allows SameSite=None only with Secure', () => {
    const config = parseEnv({
      ...baseEnv,
      NODE_ENV: 'development',
      AUTH_COOKIE_SAME_SITE: 'none',
      AUTH_COOKIE_SECURE: 'true',
    });

    expect(config.AUTH_COOKIE_SAME_SITE).toBe('none');
    expect(config.AUTH_COOKIE_SECURE).toBe(true);
  });

  it('rejects SameSite=None without Secure', () => {
    expect(() =>
      parseEnv({
        ...baseEnv,
        NODE_ENV: 'development',
        AUTH_COOKIE_SAME_SITE: 'none',
        AUTH_COOKIE_SECURE: 'false',
      }),
    ).toThrow(/AUTH_COOKIE_SECURE must be true when SameSite=None is used/);
  });

  it('defaults Secure to true in production', () => {
    const config = parseEnv({
      ...baseEnv,
      NODE_ENV: 'production',
      AUTH_COOKIE_SAME_SITE: 'lax',
    });

    expect(config.AUTH_COOKIE_SECURE).toBe(true);
  });

  it('rejects an explicit insecure cookie in production', () => {
    expect(() =>
      parseEnv({
        ...baseEnv,
        NODE_ENV: 'production',
        AUTH_COOKIE_SAME_SITE: 'lax',
        AUTH_COOKIE_SECURE: 'false',
      }),
    ).toThrow(/AUTH_COOKIE_SECURE must be true in production/);
  });
});
