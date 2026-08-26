/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
      status: (statusCode: number) => { json: (body: unknown) => void };
    }>();
    const request = ctx.getRequest<{ url: string }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorBody = this.getPublicErrorBody(exception);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...errorBody,
    });
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
