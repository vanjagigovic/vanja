import {
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status };
  const request = { url: '/test' };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('serializes only the public fields of a normal HttpException', () => {
    filter.catch(new NotFoundException('Resource not found'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      timestamp: expect.any(String),
      path: '/test',
      message: 'Resource not found',
      error: 'Not Found',
    });
    expect(json.mock.calls[0][0]).not.toHaveProperty('stack');
    expect(json.mock.calls[0][0]).not.toHaveProperty('name');
    expect(json.mock.calls[0][0]).not.toHaveProperty('options');
  });

  it('serializes a string HttpException response as the public message', () => {
    filter.catch(new HttpException('Event not found', 404), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      timestamp: expect.any(String),
      path: '/test',
      message: 'Event not found',
    });
  });

  it('uses the request-failed message for a non-record HttpException response', () => {
    const exception = new HttpException({}, 400);
    Object.defineProperty(exception, 'response', {
      configurable: true,
      value: null,
    });

    filter.catch(exception, host);

    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      timestamp: expect.any(String),
      path: '/test',
      message: 'Request failed',
    });
  });

  it('preserves validation messages as a string array without internal fields', () => {
    filter.catch(
      new BadRequestException({
        message: ['email must be an email'],
        error: 'Bad Request',
        statusCode: 400,
        options: { secret: 'hidden' },
      }),
      host,
    );

    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      timestamp: expect.any(String),
      path: '/test',
      message: ['email must be an email'],
      error: 'Bad Request',
    });
    expect(json.mock.calls[0][0]).not.toHaveProperty('options');
  });

  it('falls back when an object response has an invalid message value', () => {
    filter.catch(
      new BadRequestException({
        message: ['valid message', 42],
        error: 'Bad Request',
      }),
      host,
    );

    expect(json.mock.calls[0][0]).toMatchObject({
      statusCode: 400,
      path: '/test',
      message: 'Request failed',
      error: 'Bad Request',
    });
  });

  it('returns a generic response for unexpected errors', () => {
    filter.catch(
      Object.assign(new Error('database password=secret'), {
        stack: 'private stack',
        sql: 'SELECT secret',
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      timestamp: expect.any(String),
      path: '/test',
      message: 'Internal Server Error',
      error: 'Internal Server Error',
    });
    expect(json.mock.calls[0][0]).not.toHaveProperty('sql');
    expect(json.mock.calls[0][0]).not.toHaveProperty('stack');
  });

  it('preserves explicitly safe domain suggestion data', () => {
    filter.catch(
      new ConflictException({
        message: 'Event overlaps an existing booking',
        suggestedTime: {
          startUtc: '2099-01-01T10:00:00.000Z',
          endUtc: '2099-01-01T11:00:00.000Z',
        },
        internal: 'hidden',
      }),
      host,
    );

    expect(json.mock.calls[0][0]).toMatchObject({
      statusCode: 409,
      message: 'Event overlaps an existing booking',
      suggestedTime: {
        startUtc: '2099-01-01T10:00:00.000Z',
        endUtc: '2099-01-01T11:00:00.000Z',
      },
    });
    expect(json.mock.calls[0][0]).not.toHaveProperty('internal');
  });

  it('preserves safe conflict data and excludes invalid optional data', () => {
    filter.catch(
      new ConflictException({
        message: 'Event overlaps an existing booking',
        conflict: {
          eventId: 'event-id',
          occurrenceStartUtc: '2099-01-01T10:00:00.000Z',
          occurrenceEndUtc: '2099-01-01T11:00:00.000Z',
          title: 'Existing booking',
        },
        suggestedTime: { startUtc: 'not-a-date' },
        internal: 'hidden',
      }),
      host,
    );

    expect(json.mock.calls[0][0]).toMatchObject({
      statusCode: 409,
      path: '/test',
      message: 'Event overlaps an existing booking',
      conflict: {
        eventId: 'event-id',
        occurrenceStartUtc: '2099-01-01T10:00:00.000Z',
        occurrenceEndUtc: '2099-01-01T11:00:00.000Z',
        title: 'Existing booking',
      },
    });
    expect(json.mock.calls[0][0]).not.toHaveProperty('suggestedTime');
    expect(json.mock.calls[0][0]).not.toHaveProperty('internal');
  });

  it('does not expose details from database-style HttpExceptions', () => {
    filter.catch(
      new InternalServerErrorException({
        message: 'Internal Server Error',
        driverError: { detail: 'private database detail' },
      }),
      host,
    );

    expect(json.mock.calls[0][0]).toEqual({
      statusCode: 500,
      timestamp: expect.any(String),
      path: '/test',
      message: 'Internal Server Error',
    });
    expect(json.mock.calls[0][0]).not.toHaveProperty('driverError');
  });
});
