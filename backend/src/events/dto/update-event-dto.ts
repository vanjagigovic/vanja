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
import { EVENT_TYPES } from '../event-types';

export class UpdateEventDto {
  @ApiPropertyOptional({ example: 'Updated team sync' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional({ example: '2026-08-26T09:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  startUtc?: string;

  @ApiPropertyOptional({ example: '2026-08-26T10:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  endUtc?: string;

  @ApiPropertyOptional({ example: 'Europe/London' })
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

  @ApiPropertyOptional({ example: '2026-09-30T00:00:00.000Z' })
  @ValidateIf(
    (object: UpdateEventDto) =>
      object.repeatWeekly === true && object.repeatUntilUtc !== undefined,
  )
  @IsOptional()
  @IsDateString()
  repeatUntilUtc?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;
}
