/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

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
  @IsNotEmpty()
  eventType!: string;
}
