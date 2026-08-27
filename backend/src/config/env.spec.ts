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

  it('applies defaults and parses numeric and boolean environment values', () => {
    const config = parseEnv(baseEnv);

    expect(config.NODE_ENV).toBe('development');
    expect(config.TRUST_PROXY).toBe(false);
    expect(config.PORT).toBe(3001);
    expect(config.JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS).toBe(900);
    expect(config.JWT_REFRESH_TOKEN_EXPIRES_IN_SECONDS).toBe(2592000);
    expect(config.REFRESH_TOKEN_COOKIE_NAME).toBe('refresh_token');
    expect(config.AUTH_COOKIE_SECURE).toBe(false);
    expect(config.AUTH_COOKIE_SAME_SITE).toBe('lax');
  });

  it('rejects configuration when required environment variables are missing', () => {
    expect(() => parseEnv({})).toThrow();
  });

  it('rejects production secrets shorter than 64 characters', () => {
    expect(() =>
      parseEnv({
        ...baseEnv,
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'a'.repeat(63),
      }),
    ).toThrow(/JWT_ACCESS_SECRET must be at least 64 characters in production/);
  });

  it.each(['change-me', 'local-development-secret', 'password-placeholder'])(
    'rejects predictable production secret values: %s',
    (secret) => {
      expect(() =>
        parseEnv({
          ...baseEnv,
          NODE_ENV: 'production',
          JWT_ACCESS_SECRET: secret.padEnd(64, 'x'),
        }),
      ).toThrow(
        /JWT_ACCESS_SECRET must not contain a predictable placeholder in production/,
      );
    },
  );

  it('rejects production SameSite=None when Secure is explicitly disabled', () => {
    expect(() =>
      parseEnv({
        ...baseEnv,
        NODE_ENV: 'production',
        AUTH_COOKIE_SECURE: 'false',
        AUTH_COOKIE_SAME_SITE: 'none',
      }),
    ).toThrow(/AUTH_COOKIE_SECURE must be true in production/);
  });
});
