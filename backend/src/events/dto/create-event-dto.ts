/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsIn,
  IsOptional,
  IsBoolean,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { EVENT_TYPES } from '../event-types';

export class CreateEventDto {
  @ApiProperty({ example: 'Team sync', description: 'Event title.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    example: '2026-08-26T09:00:00.000Z',
    description:
      'Event start instant in ISO 8601 format. Offset values are accepted and responses use UTC Z format.',
  })
  @IsDateString()
  startUtc!: string;

  @ApiProperty({
    example: '2026-08-26T10:00:00.000Z',
    description:
      'Event end instant in ISO 8601 format. Offset values are accepted and responses use UTC Z format.',
  })
  @IsDateString()
  endUtc!: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Whether this is a date-only event using UTC midnight bounds.',
  })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiProperty({ example: 'Europe/London', description: 'Event time zone.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  timeZone!: string;

  @ApiProperty({
    enum: EVENT_TYPES,
    example: 'work',
    description: 'Event type.',
  })
  @IsString()
  @IsIn(EVENT_TYPES)
  eventType!: (typeof EVENT_TYPES)[number];

  @ApiPropertyOptional({
    default: false,
    description: 'Whether the event repeats weekly.',
  })
  @IsOptional()
  @IsBoolean()
  repeatWeekly?: boolean;

  @ApiPropertyOptional({
    example: '2026-09-30T00:00:00.000Z',
    description: 'Final recurrence date in ISO 8601 UTC format.',
  })
  @ValidateIf((object: CreateEventDto) => object.repeatWeekly === true)
  @IsDateString()
  repeatUntilUtc?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Whether reminders are enabled.',
  })
  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;
}
