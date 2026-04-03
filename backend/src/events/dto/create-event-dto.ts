/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsString, IsNotEmpty, IsDateString, IsIn } from 'class-validator';
import { EVENT_TYPES } from '../event-types';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsDateString()
  startUtc!: Date;

  @IsDateString()
  endUtc!: Date;

  @IsString()
  @IsNotEmpty()
  timeZone!: string;

  @IsString()
  @IsIn(EVENT_TYPES)
  eventType!: (typeof EVENT_TYPES)[number];
}
