import { apiRequest } from "./api-client";
import type { DeleteEventRequest, EventResponseDto } from "../types/event-api-types";
import { buildEventDetailPath, buildEventsListPath, getEventsBasePath } from "../helpers/event-api-paths";

import { mapEventPayloadToCreateEventRequest, mapEventPayloadToUpdateEventRequest, mapEventResponseToCalendarEvent, mapEventResponsesToCalendarEvents } from "../helpers/event-api-mappers";
import type { CalendarEvent, EventPayload } from "../types/types";

type ListEventsParams = {
    rangeStartUtc?: string;
    rangeEndUtc?: string;
    viewTimeZone?: string;
}

export const eventsApi = { 
    list: async (params: ListEventsParams = {}) : Promise<CalendarEvent[]> => {
        const response = await apiRequest<EventResponseDto[]>(buildEventsListPath(params));
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