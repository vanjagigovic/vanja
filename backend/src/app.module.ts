import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EventsModule } from './events/event.module';
import { AuthModule } from './auth/auth.module';
import { AuthController } from './auth/auth.controller';
import { OriginValidationMiddleware } from './common/middleware/origin-validation.middleware';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';

@Module({
  imports: [ScheduleModule.forRoot(), AuthModule, EventsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggingMiddleware)
      .forRoutes('*')
      .apply(OriginValidationMiddleware)
      .forRoutes(AuthController);
  }
}
