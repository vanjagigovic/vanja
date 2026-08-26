import {
  ForbiddenException,
  Injectable,
  type NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env';

@Injectable()
export class OriginValidationMiddleware implements NestMiddleware {
  use(request: Request, _response: Response, next: NextFunction) {
    const origin = request.get('origin');

    if (origin && origin !== env.FRONTEND_URL) {
      throw new ForbiddenException('Origin is not allowed');
    }

    next();
  }
}
