/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsIn,
  IsBoolean,
  ValidateIf,
  IsDateString,
} from 'class-validator';
import { EVENT_TYPES } from '../event-types';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsDateString()
  startUtc?: string;

  @IsOptional()
  @IsDateString()
  endUtc?: string;

  @IsOptional()
  @IsString()
  timeZone?: string;

  @IsOptional()
  @IsString()
  @IsIn(EVENT_TYPES)
  eventType?: (typeof EVENT_TYPES)[number];

  @IsOptional()
  @IsBoolean()
  repeatWeekly?: boolean;

  @ValidateIf(
    (object: UpdateEventDto) =>
      object.repeatWeekly === true && object.repeatUntilUtc !== undefined,
  )
  @IsOptional()
  @IsDateString()
  repeatUntilUtc?: string;

  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;
}
