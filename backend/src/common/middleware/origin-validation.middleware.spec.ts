import { describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { parseEnv } from '../../config/env';
import {
  isAllowedOrigin,
  OriginValidationMiddleware,
} from './origin-validation.middleware';

const baseEnv = {
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/calendar',
  JWT_ACCESS_SECRET: 'a'.repeat(64),
  FRONTEND_URL: 'http://localhost:5175',
  PORT: '3001',
};

describe('OriginValidationMiddleware', () => {
  it('allows requests from the configured frontend origin', () => {
    const next = jest.fn() as unknown as NextFunction;
    const request = {
      get: () => 'http://localhost:5175',
    } as unknown as Request;

    new OriginValidationMiddleware().use(request, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects requests with a mismatched origin', () => {
    const next = jest.fn() as unknown as NextFunction;
    const request = {
      get: () => 'https://attacker.example',
    } as unknown as Request;

    expect(() =>
      new OriginValidationMiddleware().use(request, {} as Response, next),
    ).toThrow(ForbiddenException);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows requests without an Origin header for non-browser clients', () => {
    const next = jest.fn() as unknown as NextFunction;
    const request = { get: () => undefined } as unknown as Request;

    new OriginValidationMiddleware().use(request, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('allows same-origin Swagger requests in development', () => {
    const config = parseEnv({ ...baseEnv, NODE_ENV: 'development' });

    expect(isAllowedOrigin('http://localhost:3001', config)).toBe(true);
    expect(isAllowedOrigin('http://127.0.0.1:3001', config)).toBe(true);
  });

  it('rejects the backend origin in production', () => {
    const config = parseEnv({ ...baseEnv, NODE_ENV: 'production' });

    expect(isAllowedOrigin('http://localhost:3001', config)).toBe(false);
    expect(isAllowedOrigin('http://localhost:5175', config)).toBe(true);
  });

  it('rejects arbitrary origins in development and production', () => {
    const development = parseEnv({ ...baseEnv, NODE_ENV: 'development' });
    const production = parseEnv({ ...baseEnv, NODE_ENV: 'production' });

    expect(isAllowedOrigin('https://attacker.example', development)).toBe(
      false,
    );
    expect(isAllowedOrigin('https://attacker.example', production)).toBe(
      false,
    );
  });
});
