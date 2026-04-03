import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../db/db.module';
import { CreateEventDto } from './dto/create-event-dto';
import { UpdateEventDto } from './dto/update-event-dto';

@Injectable()
export class EventsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase,
  ) {}
  async findAll() {
    return await this.db.select().from('events');
  }

  async findOne(id: string) {
    return await this.db.select().from('events').where('id', id).first();
  }

  async create(createEventDto: CreateEventDto): Promise<void> {
    await this.db.insert('events').values(createEventDto);
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<void> {
    await this.db.update('events').set(updateEventDto).where('id', id);
  }

  async remove(id: string): Promise<void> {
    await this.db.delete('events').where('id', id);
  }
}
