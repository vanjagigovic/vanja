import { utcIsoToZonedInput, zonedInputToUtcIso } from '../utils/calendar-utils';
import type { CalendarEvent, EventPayload, EventType } from '../types/types';

interface EventDialogDefaultParams {
    event: CalendarEvent | null;
    initialStartUtc?: string;
    initialEndUtc?: string;
}

interface EventDialogFormValues {
    title: string;
    startLocal: string;
    endLocal: string;
    timeZone: string;
    eventType: EventType;
    repeatWeekly: boolean;
    repeatUntil: string;
    reminderEnabled: boolean;
}

export function getEventDialogDefaults({ event, initialStartUtc, initialEndUtc }: EventDialogDefaultParams) {
    const defaultTimeZone = event?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const defaultStart = initialStartUtc || new Date().toISOString();
    const defaultEnd = event?.endUtc || initialEndUtc || '';

    return {
        defaultTimeZone,
        title: event?.title || '',
        startLocal: utcIsoToZonedInput(event?.startUtc || defaultStart, defaultTimeZone),
        endLocal: defaultEnd ? utcIsoToZonedInput(defaultEnd, defaultTimeZone) : '',
        eventType: event?.eventType || 'work',
        repeatWeekly: event?.repeatWeekly || false,
        repeatUntil: event?.reminderAtUtc ? utcIsoToZonedInput(event?.reminderAtUtc, defaultTimeZone) : '',
        reminderEnabled: event?.reminderEnabled || false,
    };
}

export function convertedZoneDateTime(localValue: string, fromTimeZone: string, toTimeZone: string): string {
    if (!localValue) {
        return localValue;
    }
    const utcValue = zonedInputToUtcIso(localValue, fromTimeZone);
    return utcIsoToZonedInput(utcValue, toTimeZone);
}

export function buildEventPayload(values: EventDialogFormValues): EventPayload {
    const {
        title,
        timeZone,
        startLocal,
        endLocal,
        eventType,
        repeatWeekly,
        repeatUntil,
        reminderEnabled,
    } = values;
    return {
        title: title.trim(),
        startUtc: zonedInputToUtcIso(startLocal, timeZone),
        endUtc: zonedInputToUtcIso(endLocal, timeZone),
        timeZone,
        eventType,
        repeatWeekly,
        repeatUntilUtc: repeatWeekly && repeatUntil ? zonedInputToUtcIso(repeatUntil, timeZone) : undefined,
        reminderEnabled,
    }
}
