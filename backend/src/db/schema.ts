// import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const eventsTable = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  startUtc: timestamp('start_time', { withTimezone: true }).notNull(),
  endUtc: timestamp('end_time', { withTimezone: true }).notNull(),
  timeZone: text('time_zone').notNull(),
  eventType: text('event_type').notNull(),
  cretatedAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
