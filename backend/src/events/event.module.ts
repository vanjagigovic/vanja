import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { DbModule } from '../db/db.module';

@Module({
  imports: [DbModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
