import { DateTime } from 'luxon';
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
    isAllDay?: boolean;
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
            startLocal: event?.isAllDay
                ? utcIsoToDateInput(event.startUtc)
                : utcIsoToZonedInput(event?.startUtc || defaultStart, defaultTimeZone),
            endLocal: event?.isAllDay
                ? utcIsoToDateInput(event.endUtc, true)
                : defaultEnd ? utcIsoToZonedInput(defaultEnd, defaultTimeZone) : '',
            isAllDay: event?.isAllDay ?? false,
        eventType: event?.eventType || 'work',
        repeatWeekly: event?.repeatWeekly || false,
        repeatUntil: event?.repeatUntilUtc ? utcIsoToZonedInput(event.repeatUntilUtc, defaultTimeZone) : '',
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
        isAllDay = false,
        eventType,
        repeatWeekly,
        repeatUntil,
        reminderEnabled,
    } = values;
    return {
        title: title.trim(),
        startUtc: isAllDay ? dateInputToUtcIso(startLocal) : zonedInputToUtcIso(startLocal, timeZone),
        endUtc: isAllDay ? dateInputToUtcIso(endLocal, true) : zonedInputToUtcIso(endLocal, timeZone),
        isAllDay,
        timeZone,
        eventType,
        repeatWeekly,
        repeatUntilUtc: repeatWeekly && repeatUntil ? zonedInputToUtcIso(repeatUntil, timeZone) : undefined,
        reminderEnabled,
    }
}

function utcIsoToDateInput(utcIso: string, exclusiveEnd = false): string {
    return DateTime.fromISO(utcIso, { zone: 'utc' })
        .minus(exclusiveEnd ? { days: 1 } : {})
        .toFormat('yyyy-LL-dd');
}

function dateInputToUtcIso(dateValue: string, exclusiveEnd = false): string {
    return DateTime.fromFormat(dateValue, 'yyyy-LL-dd', { zone: 'utc' })
        .plus(exclusiveEnd ? { days: 1 } : {})
        .toUTC()
        .toISO() as string;
}
