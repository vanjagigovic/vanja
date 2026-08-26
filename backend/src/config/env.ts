/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import 'dotenv/config';
import { z } from 'zod';

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
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),
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
  });

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  TRUST_PROXY: process.env.TRUST_PROXY,
  DATABASE_URL: process.env.DATABASE_URL!,
  PORT: process.env.PORT,
  FRONTEND_URL: process.env.FRONTEND_URL,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS:
    process.env.JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  JWT_REFRESH_TOKEN_EXPIRES_IN_SECONDS:
    process.env.JWT_REFRESH_TOKEN_EXPIRES_IN_SECONDS,
  REFRESH_TOKEN_COOKIE_NAME: process.env.REFRESH_TOKEN_COOKIE_NAME,
  AUTH_COOKIE_SECURE: process.env.AUTH_COOKIE_SECURE,
  AUTH_COOKIE_SAME_SITE: process.env.AUTH_COOKIE_SAME_SITE,
});
