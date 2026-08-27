import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { getCorrelationId, getUserId } from '../request-context';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
      status: (statusCode: number) => { json: (body: unknown) => void };
    }>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorBody = this.getPublicErrorBody(exception);
    const correlationId = getCorrelationId();
    const userId = getUserId();

    // Log error with context
    this.logError({
      timestamp: new Date().toISOString(),
      correlationId,
      method: request.method,
      path: request.path,
      status,
      userId,
      message:
        typeof errorBody.message === 'string'
          ? errorBody.message
          : Array.isArray(errorBody.message)
            ? errorBody.message.join('; ')
            : 'Unknown error',
    });

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...errorBody,
    });
  }

  private logError(context: {
    timestamp: string;
    correlationId?: string;
    method: string;
    path: string;
    status: number;
    userId?: string;
    message: string;
  }): void {
    const payload = {
      timestamp: context.timestamp,
      ...(context.correlationId && { correlationId: context.correlationId }),
      method: context.method,
      path: context.path,
      status: context.status,
      ...(context.userId && { userId: context.userId }),
      message: context.message,
    };

    if (context.status >= 500) {
      this.logger.error(payload);
    } else {
      this.logger.warn(payload);
    }
  }

  private getPublicErrorBody(exception: unknown) {
    if (!(exception instanceof HttpException)) {
      return {
        message: 'Internal Server Error',
        error: 'Internal Server Error',
      };
    }

    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return { message: exceptionResponse };
    }

    if (!this.isRecord(exceptionResponse)) {
      return { message: 'Request failed' };
    }

    const body: {
      message: string | string[];
      error?: string;
      suggestedTime?: { startUtc: string; endUtc: string } | null;
      conflict?: {
        eventId: string;
        occurrenceStartUtc: string;
        occurrenceEndUtc: string;
        title: string;
      };
    } = {
      message: this.getPublicMessage(exceptionResponse.message),
    };

    if (typeof exceptionResponse.error === 'string') {
      body.error = exceptionResponse.error;
    }

    if (this.isSuggestedTime(exceptionResponse.suggestedTime)) {
      body.suggestedTime = exceptionResponse.suggestedTime;
    }

    if (this.isConflict(exceptionResponse.conflict)) {
      body.conflict = exceptionResponse.conflict;
    }

    return body;
  }

  private getPublicMessage(message: unknown): string | string[] {
    if (typeof message === 'string') {
      return message;
    }

    if (
      Array.isArray(message) &&
      message.every((item): item is string => typeof item === 'string')
    ) {
      return message;
    }

    return 'Request failed';
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private isSuggestedTime(
    value: unknown,
  ): value is { startUtc: string; endUtc: string } {
    return (
      this.isRecord(value) &&
      typeof value.startUtc === 'string' &&
      typeof value.endUtc === 'string'
    );
  }

  private isConflict(value: unknown): value is {
    eventId: string;
    occurrenceStartUtc: string;
    occurrenceEndUtc: string;
    title: string;
  } {
    return (
      this.isRecord(value) &&
      typeof value.eventId === 'string' &&
      typeof value.occurrenceStartUtc === 'string' &&
      typeof value.occurrenceEndUtc === 'string' &&
      typeof value.title === 'string'
    );
  }
}
