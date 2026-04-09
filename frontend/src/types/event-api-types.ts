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
  timeZone: string;
  eventType: EventApiType;
  repeatWeekly: boolean;
  repeatUntilUtc?: string | null;
  reminderEnable: boolean;
  occurrenceId: string;
  baseEventId: string;
  reminderAtUct: string | null;
}

export interface CreateEventRequest {
  title: string;
  startUtc: string;
  endUtc: string;
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
  timeZone?: string;
  eventType?: EventApiType;
  repeatWeekly?: boolean;
  repeatUntilUtc?: string;
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
