import { EVENT_TYPES } from '../event-types';
import { ApiProperty } from '@nestjs/swagger';

export class EventResponseDto {
  @ApiProperty({ format: 'uuid', example: 'b2d91ae4-...' })
  id!: string;
  @ApiProperty({ example: 'Team sync' })
  title!: string;
  @ApiProperty({ example: '2026-08-26T09:00:00.000Z' })
  startUtc!: string;
  @ApiProperty({ example: '2026-08-26T10:00:00.000Z' })
  endUtc!: string;
  @ApiProperty({ example: false })
  isAllDay!: boolean;
  @ApiProperty({ example: 'Europe/London' })
  timeZone!: string;
  @ApiProperty({ enum: EVENT_TYPES, example: 'work' })
  eventType!: (typeof EVENT_TYPES)[number];
  @ApiProperty({ example: false })
  repeatWeekly!: boolean;
  @ApiProperty({ nullable: true, example: null })
  repeatUntilUtc!: string | null;
  @ApiProperty({ example: false })
  reminderEnabled!: boolean;
}

export class EventOccurrenceResponseDto extends EventResponseDto {
  @ApiProperty({ example: 'event-uuid:2026-08-26T09:00:00.000Z' })
  occurrenceId!: string;
  @ApiProperty({ format: 'uuid', example: 'b2d91ae4-...' })
  baseEventId!: string;
  @ApiProperty({ nullable: true, example: null })
  reminderAtUtc!: string | null;
}
