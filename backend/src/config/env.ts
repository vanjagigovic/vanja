import 'dotenv/config';
import { z } from 'zod';

export type AppEnv = {
  NODE_ENV: 'development' | 'test' | 'production';
  TRUST_PROXY: boolean;
  DATABASE_URL: string;
  PORT: number;
  FRONTEND_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS: number;
  JWT_REFRESH_TOKEN_EXPIRES_IN_SECONDS: number;
  REFRESH_TOKEN_COOKIE_NAME: string;
  AUTH_COOKIE_SECURE: boolean;
  AUTH_COOKIE_SAME_SITE: 'strict' | 'lax' | 'none';
};

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    TRUST_PROXY: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    DATABASE_URL: z.string().min(1),
    PORT: z.coerce.number().int().positive().default(3001),
    FRONTEND_URL: z.string().url().default('http://localhost:5175'),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(900),
    JWT_REFRESH_TOKEN_EXPIRES_IN_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(2592000),
    REFRESH_TOKEN_COOKIE_NAME: z.string().min(1).default('refresh_token'),
    AUTH_COOKIE_SECURE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    AUTH_COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),
  })
  .superRefine((config, context) => {
    if (config.NODE_ENV !== 'production') {
      if (
        config.AUTH_COOKIE_SAME_SITE === 'none' &&
        !config.AUTH_COOKIE_SECURE
      ) {
        context.addIssue({
          code: 'custom',
          path: ['AUTH_COOKIE_SECURE'],
          message: 'AUTH_COOKIE_SECURE must be true when SameSite=None is used',
        });
      }

      return;
    }

    if (config.JWT_ACCESS_SECRET.length < 64) {
      context.addIssue({
        code: 'custom',
        path: ['JWT_ACCESS_SECRET'],
        message:
          'JWT_ACCESS_SECRET must be at least 64 characters in production',
      });
    }

    if (
      /local-development|change-before-deployment|change-me|replace-me|secret|password/i.test(
        config.JWT_ACCESS_SECRET,
      )
    ) {
      context.addIssue({
        code: 'custom',
        path: ['JWT_ACCESS_SECRET'],
        message:
          'JWT_ACCESS_SECRET must not contain a predictable placeholder in production',
      });
    }

    if (!config.AUTH_COOKIE_SECURE) {
      context.addIssue({
        code: 'custom',
        path: ['AUTH_COOKIE_SECURE'],
        message: 'AUTH_COOKIE_SECURE must be true in production',
      });
    }

    if (config.AUTH_COOKIE_SAME_SITE === 'none' && !config.AUTH_COOKIE_SECURE) {
      context.addIssue({
        code: 'custom',
        path: ['AUTH_COOKIE_SECURE'],
        message: 'AUTH_COOKIE_SECURE must be true when SameSite=None is used',
      });
    }
  });

export const parseEnv = (source: NodeJS.ProcessEnv) =>
  envSchema.parse({
    NODE_ENV: source.NODE_ENV,
    TRUST_PROXY: source.TRUST_PROXY,
    DATABASE_URL: source.DATABASE_URL,
    PORT: source.PORT,
    FRONTEND_URL: source.FRONTEND_URL,
    JWT_ACCESS_SECRET: source.JWT_ACCESS_SECRET,
    JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS:
      source.JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    JWT_REFRESH_TOKEN_EXPIRES_IN_SECONDS:
      source.JWT_REFRESH_TOKEN_EXPIRES_IN_SECONDS,
    REFRESH_TOKEN_COOKIE_NAME: source.REFRESH_TOKEN_COOKIE_NAME,
    AUTH_COOKIE_SECURE:
      source.AUTH_COOKIE_SECURE ??
      (source.NODE_ENV === 'production' ? 'true' : undefined),
    AUTH_COOKIE_SAME_SITE: source.AUTH_COOKIE_SAME_SITE,
  });

export const env: AppEnv = parseEnv(process.env);
