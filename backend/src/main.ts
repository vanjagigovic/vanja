import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function startApp() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT || 3000);
  console.info(`Backend is running on port ${process.env.PORT || 3000}`);
}
//startApp()
//Start NestJS app and handle any startup errors explicitly - ignoring ESLint warning
startApp().catch((err) => {
  console.error('Failed to start app:', err);
});
