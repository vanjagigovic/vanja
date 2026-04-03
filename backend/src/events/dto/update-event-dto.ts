/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsDate,
  IsNotEmpty,
  IsIn,
} from 'class-validator';
import { EVENT_TYPES } from '../event-types';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startUtc?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endUtc?: Date;

  @IsOptional()
  @IsString()
  timeZone?: string;

  @IsOptional()
  @IsString()
  @IsIn(EVENT_TYPES)
  eventType?: (typeof EVENT_TYPES)[number];
}
