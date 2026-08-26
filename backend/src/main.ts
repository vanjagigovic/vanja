import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { env } from './config/env';

async function startApp() {
  // Use NestExpressApplication for Express-specific configuration
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', env.TRUST_PROXY);

  app.enableCors({
    origin: env.FRONTEND_URL,
    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT || 3001);
  console.info(`Backend is running on port ${process.env.PORT || 3001}`);
}
//startApp()
//Start NestJS app and handle any startup errors explicitly - ignoring ESLint warning
startApp().catch((err) => {
  console.error('Failed to start app:', err);
});
