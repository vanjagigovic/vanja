import { apiRequest } from "./api-client";
import type { DeleteEventRequest, EventResponseDto } from "../types/event-api-types";
import { buildEventDetailPath, buildEventsListPath, getEventsBasePath } from "../helpers/event-api-paths";

import { mapEventPayloadToCreateEventRequest, mapEventPayloadToUpdateEventRequest, mapEventResponseToCalendarEvent, mapEventResponsesToCalendarEvents } from "../helpers/event-api-mappers";
import type { CalendarEvent, EventPayload } from "../types/types";


export const eventsApi = { 
    list: async (rangeStartUtc?: string, rangeEndUtc?: string, viewTimeZone?: string) : Promise<CalendarEvent[]> => {
        const response = await apiRequest<EventResponseDto[]>(buildEventsListPath({rangeStartUtc, rangeEndUtc, viewTimeZone}));
        return mapEventResponsesToCalendarEvents(response);
    },
    create: async (payload: EventPayload): Promise<CalendarEvent> => {
        const response = await apiRequest<EventResponseDto>(getEventsBasePath(), {
            method: 'POST',
            body: JSON.stringify(mapEventPayloadToCreateEventRequest(payload)),
        });
        return mapEventResponseToCalendarEvent(response);
    },
    update: async (id:string, payload: Partial<EventPayload>): Promise<CalendarEvent> => {
        const response = await apiRequest<EventResponseDto>(buildEventDetailPath(id), {
            method: 'PATCH',
            body: JSON.stringify(mapEventPayloadToUpdateEventRequest(payload)),
        });
        return mapEventResponseToCalendarEvent(response);
    },
    delete: async (id: string) => apiRequest<DeleteEventRequest>(buildEventDetailPath(id),{
        method: 'DELETE',
    }),
};