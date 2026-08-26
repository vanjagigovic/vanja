import { EVENT_TYPES } from '../event-types';

export class EventResponseDto {
  id!: string;
  title!: string;
  startUtc!: string;
  endUtc!: string;
  timeZone!: string;
  eventType!: (typeof EVENT_TYPES)[number];
  repeatWeekly!: boolean;
  repeatUntilUtc!: string | null;
  reminderEnabled!: boolean;
}

export class EventOccurrenceResponseDto extends EventResponseDto {
  occurrenceId!: string;
  baseEventId!: string;
  reminderAtUtc!: string | null;
}
