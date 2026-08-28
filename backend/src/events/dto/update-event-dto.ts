/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsIn,
  IsBoolean,
  ValidateIf,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { EVENT_TYPES } from '../event-types';

export class UpdateEventDto {
  @ApiPropertyOptional({ example: 'Updated team sync' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional({
    example: '2026-08-26T09:30:00.000Z',
    description:
      'Event start instant in ISO 8601 format. Offset values are accepted and responses use UTC Z format.',
  })
  @IsOptional()
  @IsDateString()
  startUtc?: string;

  @ApiPropertyOptional({
    example: '2026-08-26T10:30:00.000Z',
    description:
      'Event end instant in ISO 8601 format. Offset values are accepted and responses use UTC Z format.',
  })
  @IsOptional()
  @IsDateString()
  endUtc?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiPropertyOptional({ example: 'Europe/London' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  timeZone?: string;

  @ApiPropertyOptional({ enum: EVENT_TYPES, example: 'work' })
  @IsOptional()
  @IsString()
  @IsIn(EVENT_TYPES)
  eventType?: (typeof EVENT_TYPES)[number];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  repeatWeekly?: boolean;

  @ApiPropertyOptional({
    example: '2026-09-30T00:00:00.000Z',
    nullable: true,
    description: 'Replacement recurrence boundary, or null to clear it.',
  })
  @ValidateIf(
    (object: UpdateEventDto) =>
      object.repeatWeekly === true && object.repeatUntilUtc !== undefined,
  )
  @IsOptional()
  @IsDateString()
  repeatUntilUtc?: string | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;
}
