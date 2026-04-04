import { sql } from 'drizzle-orm';
import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  check,
  boolean,
} from 'drizzle-orm/pg-core';

export const eventsTable = pgTable(
  'events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    startUtc: timestamp('start_time', { withTimezone: true }).notNull(),
    endUtc: timestamp('end_time', { withTimezone: true }).notNull(),
    timeZone: text('time_zone').notNull(),
    eventType: text('event_type').notNull(),
    reminderEnabled: boolean('reminder_enabled').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    repeatWeekly: boolean('repeat_weekly').default(false).notNull(),
    repeatUntilUtc: timestamp('repeat_until_utc', { withTimezone: true }),
  },
  (table) => ({
    startUtcIndex: index('events_start_utc_idx').on(table.startUtc),
    repeatUntilUtcIndex: index('events_repeat_until_utc_idx').on(
      table.repeatUntilUtc,
    ),
    activeRangeIndex: index('events_active_range_idx').on(
      table.startUtc,
      table.endUtc,
      table.repeatUntilUtc,
    ),
    validTimeRange: check(
      'events_valid_time_range_chk',
      sql`${table.endUtc} > ${table.startUtc}`,
    ),
    validRepeateBoundary: check(
      'events_valid_repeat_boundary_chk',
      sql`${table.repeatUntilUtc} IS NULL OR ${table.repeatUntilUtc} >= ${table.startUtc}`,
    ),
  }),
);

export type EventRecord = typeof eventsTable.$inferSelect;
export type NewEventRecord = typeof eventsTable.$inferInsert;
