import {
  ForbiddenException,
  Injectable,
  type NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { env, type AppEnv } from '../../config/env';

export function isAllowedOrigin(origin: string | undefined, config: AppEnv) {
  if (!origin || origin === config.FRONTEND_URL) {
    return true;
  }

  if (config.NODE_ENV === 'production') {
    return false;
  }

  return [
    `http://localhost:${config.PORT}`,
    `http://127.0.0.1:${config.PORT}`,
  ].includes(origin);
}

@Injectable()
export class OriginValidationMiddleware implements NestMiddleware {
  use(request: Request, _response: Response, next: NextFunction) {
    const origin = request.get('origin');

    if (!isAllowedOrigin(origin, env)) {
      throw new ForbiddenException('Origin is not allowed');
    }

    next();
  }
}
