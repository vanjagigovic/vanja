import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateEventDto } from './dto/create-event-dto';
import { ListEventDto } from './dto/list-event-dto';
import { UpdateEventDto } from './dto/update-event-dto';
import {
  EventOccurrenceResponseDto,
  EventResponseDto,
} from './dto/event-response-dto';
import { EventsService } from './events.service';
import { ApiErrorResponseDto } from '../common/dto/api-error-response-dto';

@ApiTags('Events')
@Controller('events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({
    summary: 'List calendar events',
    description:
      'Returns all events for the authenticated user, or a date-range subset for the requested window.',
  })
  @ApiQuery({
    name: 'rangeStartUtc',
    required: false,
    type: String,
    description:
      'Inclusive range start instant in ISO 8601 format. Offset values are accepted.',
  })
  @ApiQuery({
    name: 'rangeEndUtc',
    required: false,
    type: String,
    description:
      'Exclusive range end instant in ISO 8601 format. Offset values are accepted.',
  })
  @ApiQuery({
    name: 'viewTimeZone',
    required: false,
    type: String,
    description: 'Time zone used to expand recurring occurrences.',
  })
  @ApiOkResponse({
    description: 'Events retrieved successfully.',
    type: [EventOccurrenceResponseDto],
  })
  @ApiBadRequestResponse({
    description: 'A date range was supplied incompletely or invalid.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    type: ApiErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected server error.',
    type: ApiErrorResponseDto,
  })
  findAll(
    @Query() query: ListEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an event by id' })
  @ApiParam({
    name: 'id',
    description: 'Event UUID.',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Event retrieved successfully.',
    type: EventResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Event not found.',
    type: ApiErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The event id is not a UUID.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    type: ApiErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected server error.',
    type: ApiErrorResponseDto,
  })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.findOne(user.id, id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a calendar event',
    description: 'Creates a new event for the authenticated user.',
  })
  @ApiBody({ type: CreateEventDto })
  @ApiCreatedResponse({
    description: 'Event created successfully.',
    type: EventResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The event overlaps an existing booking.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    type: ApiErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected server error.',
    type: ApiErrorResponseDto,
  })
  create(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.create(user.id, createEventDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing event' })
  @ApiParam({
    name: 'id',
    description: 'Event UUID to update.',
    type: String,
    format: 'uuid',
  })
  @ApiBody({ type: UpdateEventDto })
  @ApiOkResponse({
    description: 'Event updated successfully.',
    type: EventResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Event not found.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The event overlaps an existing booking.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    type: ApiErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected server error.',
    type: ApiErrorResponseDto,
  })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.update(user.id, id, updateEventDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event' })
  @ApiParam({
    name: 'id',
    description: 'Event UUID to delete.',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Event deleted successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Event not found.',
    type: ApiErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The event id is not a UUID.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    type: ApiErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected server error.',
    type: ApiErrorResponseDto,
  })
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.remove(user.id, id);
  }
}
