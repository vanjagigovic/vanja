import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SuggestedTimeDto {
  @ApiProperty({ example: '2026-08-26T11:00:00.000Z' })
  startUtc!: string;

  @ApiProperty({ example: '2026-08-26T12:00:00.000Z' })
  endUtc!: string;
}

class ConflictDetailsDto {
  @ApiProperty({
    format: 'uuid',
    example: 'b2d91ae4-0000-0000-0000-000000000001',
  })
  eventId!: string;

  @ApiProperty({ example: '2026-08-26T10:00:00.000Z' })
  occurrenceStartUtc!: string;

  @ApiProperty({ example: '2026-08-26T11:00:00.000Z' })
  occurrenceEndUtc!: string;

  @ApiProperty({ example: 'Existing booking' })
  title!: string;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: '2026-08-27T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '/events' })
  path!: string;

  @ApiProperty({
    oneOf: [
      { type: 'string', example: 'Request failed' },
      {
        type: 'array',
        items: { type: 'string' },
        example: ['title should not be empty'],
      },
    ],
  })
  message!: string | string[];

  @ApiPropertyOptional({ example: 'Bad Request' })
  error?: string;

  @ApiPropertyOptional({ type: SuggestedTimeDto })
  suggestedTime?: SuggestedTimeDto;

  @ApiPropertyOptional({ type: ConflictDetailsDto })
  conflict?: ConflictDetailsDto;
}
