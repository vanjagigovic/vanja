import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TFunction } from 'i18next';

import { eventsApi } from '../api/events-api';
import { runCalendarMutation } from '../helpers/calendar-events-helpers';
import { buildRangeForView, scheduleReminderNotifications } from '../utils/calendar-utils';
import { getApiErrorState, getErrorMessage } from '../helpers/client-state-helpers';
import type { CalendarViewMode, EventPayload } from '../types/types';

interface UseCalendarEventsParams {
  currentView: CalendarViewMode;
  currentDate: Date;
  viewTimeZone: string;
  t: TFunction;
  onAfterMutation?: () => void;
}

export function useCalendarEvents({
  currentView,
  currentDate,
  viewTimeZone,
  t,
  onAfterMutation,
}: UseCalendarEventsParams) {
  const queryClient = useQueryClient();

  const [actionError, setActionError] = useState('');
  const [suggestion, setSuggestion] = useState<{ startUtc: string; endUtc: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const range = useMemo(
    () => buildRangeForView(currentView, currentDate, viewTimeZone),
    [currentDate, currentView, viewTimeZone],
  );

  const handleApiError = useCallback((err: unknown) => {
    const apiErrorState = getApiErrorState(err);
    setActionError(apiErrorState.message);
    setSuggestion(apiErrorState.suggestedTime);
  }, []);

  const eventsQuery = useQuery({
    queryKey: [
      'calendar-events',
      currentView,
      range.rangeStartUtc,
      range.rangeEndUtc,
      viewTimeZone,
    ],
    queryFn: async () => {
      return eventsApi.list({
        rangeStartUtc: range.rangeStartUtc,
        rangeEndUtc: range.rangeEndUtc,
        viewTimeZone,
      });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: (payload: EventPayload) => eventsApi.create(payload),
  });

  const updateEventMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<EventPayload>;
    }) => eventsApi.update(id, payload),
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const events = eventsQuery.data ?? [];
  const loading = eventsQuery.isPending;

  const error =
    actionError ||
    (eventsQuery.error
      ? getErrorMessage(eventsQuery.error, 'Failed to load events')
      : '');

  useEffect(() => {
    scheduleReminderNotifications(events, viewTimeZone, t);
  }, [events, t, viewTimeZone]);

  const loadEvents = useCallback(async () => {
    setActionError('');
    await queryClient.invalidateQueries({
      queryKey: ['calendar-events'],
    });
  }, [queryClient]);

  const runMutation = useCallback(
    async (
      mutation: () => Promise<unknown>,
      successTranslationKey: 'eventCreated' | 'eventUpdated' | 'eventDeleted',
      options?: { rethrow?: boolean },
    ) => {
      setActionError('');

      await runCalendarMutation({
        mutation,
        loadEvents,
        setSuggestion,
        setSuccessMessage,
        t,
        successTranslationKey,
        onAfterMutation,
        onError: handleApiError,
        rethrow: options?.rethrow,
      });
    },
    [handleApiError, loadEvents, onAfterMutation, t],
  );

  const handleCreate = useCallback(
    async (payload: EventPayload) => {
      await runMutation(
        () => createEventMutation.mutateAsync(payload),
        'eventCreated',
        { rethrow: true },
      );
    },
    [createEventMutation, runMutation],
  );

  const handleUpdate = useCallback(
    async (id: string, payload: Partial<EventPayload>) => {
      await runMutation(
        () => updateEventMutation.mutateAsync({ id, payload }),
        'eventUpdated',
        { rethrow: true },
      );
    },
    [runMutation, updateEventMutation],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await runMutation(
        () => deleteEventMutation.mutateAsync(id),
        'eventDeleted',
      );
    },
    [deleteEventMutation, runMutation],
  );

  return {
    events,
    loading,
    error,
    suggestion,
    successMessage,
    setSuggestion,
    setSuccessMessage,
    loadEvents,
    handleCreate,
    handleUpdate,
    handleDelete,
  };
}