import { useCallback, useState, useMemo } from "react";
import { runAsyncAction} from "../helpers/client-state-helpers";
import {getSupportedTimeZones} from "../utils/calendar-utils";
import { buildEventPayload, convertedZoneDateTime, getEventDialogDefaults } from "../helpers/event-dialog-helpers";
import type { CalendarEvent, EventPayload } from "../types/types";

interface UseEventDialogStateParams { 
    event: CalendarEvent | null;
    initialStartUtc?: string;
    initialEndUtc?: string;
    onSave: (payload: EventPayload) => Promise<void>;
    onDelete?: () => Promise<void>;
}

export function useEventDialogState({
    event,
    initialStartUtc,
    initialEndUtc,
    onSave,
    onDelete
}: UseEventDialogStateParams) {
    const defaults = getEventDialogDefaults({event, initialEndUtc, initialStartUtc});
    const [title, setTitle] = useState(defaults.title);
    const [timeZone, setTimeZone] = useState(defaults.defaultTimeZone);
    const [startLocal, setStartLocal] = useState(defaults.startLocal);
    const [endLocal, setEndLocal] = useState(defaults.endLocal);
    const [eventType, setEventType] = useState(defaults.eventType);
    const [repeatWeekly, setRepeatWeekly] = useState(defaults.repeatWeekly);
    const [repeatUntil, setRepeatUntil] = useState(defaults.repeatUntilUtc);
    const [reminderEnabled, setReminderEnabled] = useState(defaults.reminderEnable);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const timeZones = useMemo(() => getSupportedTimeZones(), []);

    const handleTimeZoneChanges = useCallback((nextZone: string) => {
        setStartLocal((currentValue: string) => convertedZoneDateTime(currentValue, timeZone, nextZone));
        setEndLocal((currentValue: string) => convertedZoneDateTime(currentValue, timeZone, nextZone));
        setRepeatUntil((currentValue: string)=> convertedZoneDateTime(currentValue, timeZone, nextZone));
        setTimeZone(nextZone);
    }, [timeZone]);

    const payload: EventPayload = buildEventPayload({
        title,
        timeZone,
        startLocal,
        endLocal,
        eventType,
        repeatWeekly,
        reminderEnabled,
        repeatUntil,
    });

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        await runAsyncAction({
            action: () => onSave(payload),
            setError,
            setSaving,
            fallbackMessage: 'Failed to save event',
        });
    }, [onSave, payload]);

    const handleDelete = useCallback(async () => {
        if(!onDelete){
            return;
        }

        await runAsyncAction({
            action: onDelete,
            setError,
            setSaving,
            fallbackMessage: 'Failed to delete event',
        });
    }, [onDelete]);

    return {
        title,
        setTitle,
        timeZone,
        setTimeZone: handleTimeZoneChanges,
        startLocal,
        setStartLocal,
        endLocal,
        setEndLocal,
        eventType,
        setEventType,
        repeatWeekly,
        setRepeatWeekly,
        repeatUntil,
        setRepeatUntil,
        reminderEnabled, 
        setReminderEnabled,
        error,
        saving,
        timeZones,
        handleSubmit,
        handleDelete,
        canSave: Boolean(title.trim()) && Boolean(startLocal) && Boolean(endLocal),
    };
}