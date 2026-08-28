export type CalendarViewMode = 'day' | 'week' | 'month';
export type EventType = 'work' | 'school' | 'travel' | 'gym' | 'personal' | 'holiday' | 'birthday' | 'other';

export interface CalendarEvent {
    id: string, 
    title: string,
    startUtc: string,
    endUtc: string,
    isAllDay: boolean,
    timeZone: string,
    eventType: EventType,
    repeatWeekly: boolean,
    reminderEnabled: boolean,
    repeatUntilUtc?: string | null,
    occurrenceId: string,
    baseEventId: string,
    reminderAtUtc: string | null;
}

export interface EventPayload {
    title: string,
    startUtc: string,
    endUtc: string,
    isAllDay: boolean,
    timeZone: string,
    eventType: EventType,
    repeatWeekly: boolean,
    reminderEnabled: boolean,
    repeatUntilUtc?: string
}