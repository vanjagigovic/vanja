/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ListEventDto {
  @IsOptional()
  @IsDateString()
  rangeStartUtc?: string;

  @IsOptional()
  @IsDateString()
  rangeEndUtc?: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  viewTimeZone?: string;
}
