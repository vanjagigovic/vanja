import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListEventDto {
  @ApiPropertyOptional({
    example: '2026-08-01T00:00:00.000Z',
    description:
      'Inclusive range start instant in ISO 8601 format. Offset values are accepted.',
  })
  @IsOptional()
  @IsDateString()
  rangeStartUtc?: string;

  @ApiPropertyOptional({
    example: '2026-08-31T23:59:59.999Z',
    description:
      'Exclusive range end instant in ISO 8601 format. Offset values are accepted.',
  })
  @IsOptional()
  @IsDateString()
  rangeEndUtc?: string;

  @ApiPropertyOptional({
    example: 'Europe/London',
    description: 'Time zone used to expand recurring occurrences.',
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  viewTimeZone?: string;
}
