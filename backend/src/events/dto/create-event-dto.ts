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
import { EVENT_TYPES } from '../event-types';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsDateString()
  startUtc!: string;

  @IsDateString()
  endUtc!: string;

  @IsString()
  @IsNotEmpty()
  timeZone!: string;

  @IsString()
  @IsIn(EVENT_TYPES)
  eventType!: (typeof EVENT_TYPES)[number];

  @IsOptional()
  @IsBoolean()
  repeatWeekly?: boolean;

  @ValidateIf((object: CreateEventDto) => object.repeatWeekly === true)
  @IsDateString()
  repeatUntilUtc?: string;

  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;
}
