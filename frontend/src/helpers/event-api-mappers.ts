
import type { EventOccurrenceResponseDto, EventResponseDto, CreateEventRequest, UpdateEventRequest } from "../types/event-api-types";
import type { CalendarEvent, EventPayload } from "../types/types";

export function mapEventResponseToCalendarEvent(
  dto: EventResponseDto,
): CalendarEvent {
  return {
    id: dto.id,
    title: dto.title,
    startUtc: dto.startUtc,
    endUtc: dto.endUtc,
    timeZone: dto.timeZone,
    eventType: dto.eventType,
    repeatWeekly: dto.repeatWeekly,
    repeatUntilUtc: dto.repeatUntilUtc,
    reminderEnabled: dto.reminderEnabled,
    occurrenceId: dto.id,
    baseEventId: dto.id,
    reminderAtUtc: null,
  };
}

export function mapEventOccurrenceResponseToCalendarEvent(
  dto: EventOccurrenceResponseDto,
): CalendarEvent {
  return {
    ...mapEventResponseToCalendarEvent(dto),
    occurrenceId: dto.occurrenceId,
    baseEventId: dto.baseEventId,
    reminderAtUtc: dto.reminderAtUtc,
  };
}

export function mapEventResponsesToCalendarEvents(
  dtos: EventOccurrenceResponseDto[],
): CalendarEvent[] {
  return dtos.map(mapEventOccurrenceResponseToCalendarEvent);
}

export function mapEventPayloadToCreateEventRequest(
  payload: EventPayload,
): CreateEventRequest {
  return {
    title: payload.title,
    startUtc: payload.startUtc,
    endUtc: payload.endUtc,
    timeZone: payload.timeZone,
    eventType: payload.eventType,
    repeatWeekly: payload.repeatWeekly,
    repeatUntilUtc: payload.repeatUntilUtc,
    reminderEnabled: payload.reminderEnabled,
  };
}

export function mapEventPayloadToUpdateEventRequest(
  payload: Partial<EventPayload>,
): UpdateEventRequest {
  return {
    title: payload.title,
    startUtc: payload.startUtc,
    endUtc: payload.endUtc,
    timeZone: payload.timeZone,
    eventType: payload.eventType,
    repeatWeekly: payload.repeatWeekly,
    repeatUntilUtc: payload.repeatUntilUtc,
    reminderEnabled: payload.reminderEnabled,
  };
}
