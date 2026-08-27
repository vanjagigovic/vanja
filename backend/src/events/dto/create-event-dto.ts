/* eslint-disable @typescript-eslint/no-unsafe-call */
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
import { EVENT_TYPES } from '../event-types';

export class CreateEventDto {
  @ApiProperty({ example: 'Team sync', description: 'Event title.' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    example: '2026-08-26T09:00:00.000Z',
    description: 'Event start time in ISO 8601 UTC format.',
  })
  @IsDateString()
  startUtc!: string;

  @ApiProperty({
    example: '2026-08-26T10:00:00.000Z',
    description: 'Event end time in ISO 8601 UTC format.',
  })
  @IsDateString()
  endUtc!: string;

  @ApiProperty({ example: 'Europe/London', description: 'Event time zone.' })
  @IsString()
  @IsNotEmpty()
  timeZone!: string;

  @ApiProperty({ enum: EVENT_TYPES, example: 'work', description: 'Event type.' })
  @IsString()
  @IsIn(EVENT_TYPES)
  eventType!: (typeof EVENT_TYPES)[number];

  @ApiPropertyOptional({ default: false, description: 'Whether the event repeats weekly.' })
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

  @ApiPropertyOptional({ default: false, description: 'Whether reminders are enabled.' })
  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;
}
