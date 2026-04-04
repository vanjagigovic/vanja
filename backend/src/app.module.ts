import { Module } from '@nestjs/common';
import { EventsModule } from './events/event.module';

@Module({
  imports: [EventsModule],
})
export class AppModule {}
