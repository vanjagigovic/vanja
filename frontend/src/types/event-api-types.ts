export type EventApiType =
  | "work"
  | "school"
  | "travel"
  | "gym"
  | "personal"
  | "holiday"
  | "birthday"
  | "other";

export interface EventResponseDto {
  id: string;
  title: string;
  startUtc: string;
  endUtc: string;
  isAllDay: boolean;
  timeZone: string;
  eventType: EventApiType;
  repeatWeekly: boolean;
  repeatUntilUtc: string | null;
  reminderEnabled: boolean;
}

export interface EventOccurrenceResponseDto extends EventResponseDto {
  occurrenceId: string;
  baseEventId: string;
  reminderAtUtc: string | null;
}

export interface CreateEventRequest {
  title: string;
  startUtc: string;
  endUtc: string;
  isAllDay: boolean;
  timeZone: string;
  eventType: EventApiType;
  repeatWeekly?: boolean;
  repeatUntilUtc?: string;
  reminderEnabled?: boolean;
}

export interface UpdateEventRequest {
  title?: string;
  startUtc?: string;
  endUtc?: string;
  isAllDay?: boolean;
  timeZone?: string;
  eventType?: EventApiType;
  repeatWeekly?: boolean;
  repeatUntilUtc?: string | null;
  reminderEnabled?: boolean;  
}

export interface DeleteEventRequest {
    success: boolean;
}

export interface ListEventQuery {
    rangeStartUtc?: string;
    rangeEndUtc?:string;
    viewTimeZone?: string;
}
