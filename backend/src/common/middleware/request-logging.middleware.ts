import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import {
  generateCorrelationId,
  isValidCorrelationId,
} from '../utils/correlation-id.util';
import { getUserId, setRequestContext } from '../request-context';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const method = req.method;
    const path = req.path;

    // Get or generate correlation ID
    const correlationIdHeader = req.get('x-correlation-id');
    const correlationId =
      correlationIdHeader && isValidCorrelationId(correlationIdHeader)
        ? correlationIdHeader
        : generateCorrelationId();

    // Set correlation ID in request context
    setRequestContext({ correlationId });

    // Log request
    this.logger.debug({
      timestamp: new Date().toISOString(),
      correlationId,
      method,
      path,
      message: 'Incoming request',
    });

    res.once('finish', () => {
      const durationMs = Date.now() - startTime;
      const statusCode = res.statusCode;

      this.logger.debug({
        timestamp: new Date().toISOString(),
        correlationId,
        method,
        path,
        status: statusCode,
        durationMs,
        ...(getUserId() && { userId: getUserId() }),
        message: 'Request completed',
      });
    });

    next();
  }
}
