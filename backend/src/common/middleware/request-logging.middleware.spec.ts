import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
  afterEach,
} from '@jest/globals';
import { RequestLoggingMiddleware } from './request-logging.middleware';
import * as requestContext from '../request-context';

type LogPayload = {
  message: string;
  method?: string;
  path?: string;
  correlationId?: string;
  status?: number;
  durationMs?: number;
  userId?: string;
  timestamp?: string;
};

type RequestDouble = {
  method: string;
  path: string;
  get: (name: string) => string | undefined;
};
type FinishListener = (event: 'finish', listener: () => void) => void;
type ResponseDouble = {
  statusCode: number;
  once: jest.MockedFunction<FinishListener>;
};
type LoggerSpy = {
  mock: {
    calls: unknown[][];
  };
  mockClear: () => void;
  mockRestore: () => void;
};

describe('RequestLoggingMiddleware', () => {
  let middleware: RequestLoggingMiddleware;
  let mockRequest: RequestDouble;
  let mockResponse: ResponseDouble;
  let loggerSpy: LoggerSpy;

  beforeEach(() => {
    middleware = new RequestLoggingMiddleware();
    mockRequest = {
      method: 'GET',
      path: '/test',
      get: jest.fn<RequestDouble['get']>().mockReturnValue(undefined),
    };
    mockResponse = {
      statusCode: 200,
      once: jest.fn(),
    };
    loggerSpy = jest.spyOn(Logger.prototype, 'debug') as unknown as LoggerSpy;
  });

  afterEach(() => {
    loggerSpy.mockRestore();
  });

  it('generates a correlation ID if not provided', (done) => {
    const setContextSpy = jest.spyOn(requestContext, 'setRequestContext');

    middleware.use(
      mockRequest as unknown as Request,
      mockResponse as unknown as Response,
      () => {
        const callArgs = setContextSpy.mock.calls[0];
        expect(callArgs[0].correlationId).toBeDefined();
        expect(callArgs[0].correlationId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );
        setContextSpy.mockRestore();
        done();
      },
    );
  });

  it('uses provided valid correlation ID from header', (done) => {
    const providedId = '550e8400-e29b-41d4-a716-446655440000';
    const mockRequest: RequestDouble = {
      method: 'GET',
      path: '/test',
      get: jest.fn<RequestDouble['get']>().mockReturnValue(providedId),
    };
    const mockResponse: ResponseDouble = {
      statusCode: 200,
      once: jest.fn(),
    };
    const setContextSpy = jest.spyOn(requestContext, 'setRequestContext');

    middleware.use(
      mockRequest as Request,
      mockResponse as unknown as Response,
      () => {
        const callArgs = setContextSpy.mock.calls[0];
        expect(callArgs[0].correlationId).toBe(providedId);
        setContextSpy.mockRestore();
        done();
      },
    );
  });

  it('logs incoming request with method and path', (done) => {
    loggerSpy.mockClear();
    const mockRequest: RequestDouble = {
      method: 'POST',
      path: '/api/events',
      get: jest.fn<RequestDouble['get']>().mockReturnValue(undefined),
    };
    const mockResponse: ResponseDouble = {
      statusCode: 200,
      once: jest.fn(),
    };

    middleware.use(
      mockRequest as Request,
      mockResponse as unknown as Response,
      () => {
        const debugCalls = loggerSpy.mock.calls as unknown as [LogPayload][];
        const incomingLog = debugCalls.find(([logData]) => {
          return logData.message === 'Incoming request';
        });

        expect(incomingLog).toBeDefined();
        if (incomingLog) {
          const logData = incomingLog[0];
          expect(logData).toHaveProperty('method', 'POST');
          expect(logData).toHaveProperty('path', '/api/events');
          expect(logData).toHaveProperty('correlationId');
          expect(logData).toHaveProperty('timestamp');
        }
        done();
      },
    );
  });

  it('logs outgoing response', (done) => {
    loggerSpy.mockClear();
    const mockRequest: RequestDouble = {
      method: 'POST',
      path: '/api/items',
      get: jest.fn<RequestDouble['get']>().mockReturnValue(undefined),
    };
    const mockResponse = {
      statusCode: 200,
      once: jest.fn(),
    } as ResponseDouble;
    const userIdSpy = jest
      .spyOn(requestContext, 'getUserId')
      .mockReturnValue('user-123');

    middleware.use(
      mockRequest as Request,
      mockResponse as unknown as Response,
      () => {
        const finishHandler = mockResponse.once.mock.calls[0][1];
        expect(finishHandler).toBeDefined();
        finishHandler();
        setImmediate(() => {
          const debugCalls = loggerSpy.mock.calls as unknown as [LogPayload][];
          const responseLog = debugCalls.find(
            ([logData]) => logData.message === 'Request completed',
          );
          expect(responseLog).toBeDefined();
          expect(responseLog?.[0]).toMatchObject({
            status: 200,
            userId: 'user-123',
            message: 'Request completed',
          });
          userIdSpy.mockRestore();
          done();
        });
      },
    );
  });

  it('calls next() to proceed with request chain', () => {
    const mockRequest: RequestDouble = {
      method: 'GET',
      path: '/test',
      get: jest.fn<RequestDouble['get']>().mockReturnValue(undefined),
    };
    const mockResponse: ResponseDouble = {
      statusCode: 200,
      once: jest.fn(),
    };
    const mockNext = jest.fn() as unknown as NextFunction;

    middleware.use(
      mockRequest as Request,
      mockResponse as unknown as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalled();
  });
});
