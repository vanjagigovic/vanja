import { describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { OriginValidationMiddleware } from './origin-validation.middleware';

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
});
