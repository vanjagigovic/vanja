import { useCallback, useMemo, useState } from 'react';
import { runAsyncAction } from '../helpers/client-state-helpers';
import { getSupportedTimeZones } from '../utils/calendar-utils';
import {
  buildEventPayload,
  convertedZoneDateTime,
  getEventDialogDefaults,
} from '../helpers/event-dialog-helpers';
import type { CalendarEvent, EventPayload } from '../types/types';

type EventDialogFieldErrors = {
  title?: string;
  startLocal?: string;
  endLocal?: string;
  repeatUntil?: string;
};

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
  onDelete,
}: UseEventDialogStateParams) {
  const defaults = getEventDialogDefaults({
    event,
    initialStartUtc,
    initialEndUtc,
  });

  const [title, setTitle] = useState(defaults.title);
  const [timeZone, setTimeZone] = useState(defaults.defaultTimeZone);
  const [startLocal, setStartLocal] = useState(defaults.startLocal);
  const [endLocal, setEndLocal] = useState(defaults.endLocal);
  const [eventType, setEventType] = useState(defaults.eventType);
  const [repeatWeekly, setRepeatWeekly] = useState(defaults.repeatWeekly);
  const [repeatUntil, setRepeatUntil] = useState(defaults.repeatUntil);
  const [reminderEnabled, setReminderEnabled] = useState(
    defaults.reminderEnabled,
  );

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<EventDialogFieldErrors>({});

  const timeZones = useMemo(() => getSupportedTimeZones(), []);

  const validateRequiredFields = useCallback((): EventDialogFieldErrors => {
    const nextErrors: EventDialogFieldErrors = {};

    if (!title.trim()) {
      nextErrors.title = 'Title is required';
    }

    if (!startLocal) {
      nextErrors.startLocal = 'Start date is required';
    }

    if (!endLocal) {
      nextErrors.endLocal = 'End date is required';
    }

    if (repeatWeekly && !repeatUntil) {
      nextErrors.repeatUntil = 'Repeat-until date is required';
    }

    return nextErrors;
  }, [title, startLocal, endLocal, repeatWeekly, repeatUntil]);

  const handleTimeZoneChange = useCallback(
    (nextZone: string) => {
      setStartLocal((currentValue: string) =>
        convertedZoneDateTime(currentValue, timeZone, nextZone),
      );
      setEndLocal((currentValue: string) =>
        convertedZoneDateTime(currentValue, timeZone, nextZone),
      );
      setRepeatUntil((currentValue: string) =>
        convertedZoneDateTime(currentValue, timeZone, nextZone),
      );

      setTimeZone(nextZone);
    },
    [timeZone],
  );

  const payload: EventPayload = buildEventPayload({
    title,
    timeZone,
    startLocal,
    endLocal,
    eventType,
    repeatWeekly,
    repeatUntil,
    reminderEnabled,
  });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const nextErrors = validateRequiredFields();

      if (Object.keys(nextErrors).length > 0) {
        setFieldErrors(nextErrors);
        setError('Please fill in all required fields');
        return;
      }

      setFieldErrors({});

      await runAsyncAction({
        action: () => onSave(payload),
        setError,
        setSaving,
        fallbackMessage: 'Failed to save event',
      });
    },
    [onSave, payload, validateRequiredFields],
  );

  const handleDelete = useCallback(async () => {
    if (!onDelete) {
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
    setTimeZone: handleTimeZoneChange,
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
    fieldErrors,
    saving,
    timeZones,
    handleSubmit,
    handleDelete,
    canSave: !saving,
  };
}