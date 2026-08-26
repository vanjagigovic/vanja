import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { EventsModule } from './events/event.module';
import { AuthModule } from './auth/auth.module';
import { AuthController } from './auth/auth.controller';
import { OriginValidationMiddleware } from './common/middleware/origin-validation.middleware';

@Module({
  imports: [AuthModule, EventsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(OriginValidationMiddleware).forRoutes(AuthController);
  }
}
