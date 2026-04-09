import { useCallback, useEffect, useState } from "react";
import type { TFunction } from "i18next";
import { eventsApi } from "../api/events-api";
import {
  getApiErrorState,
  getErrorMessage,
} from "../helpers/client-state-helpers";
import type {
  CalendarEvent,
  CalendarViewMode,
  EventPayload,
} from "../types/types";
import { runCalendarMutation } from "../helpers/calendar-events-helpers";
import {
  buildRangeForView,
  scheduledReminderNotifications,
} from "../utils/calendar-utils";

interface UseCalendarEventParams {
  currentView: CalendarViewMode;
  currentDate: Date;
  viewTimeZone: string;
  t: TFunction;
  onAfterMutation?: () => void;
}
console.log("FETCH CALLED");

export function useCalendarEvents({
  currentView,
  currentDate,
  viewTimeZone,
  t,
  onAfterMutation,
}: UseCalendarEventParams) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<{
    startUtc: string;
    endUtc: string;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const handleApiError = useCallback((err: unknown) => {
    const apiErrorState = getApiErrorState(err);
    setError(apiErrorState.message);
    if (apiErrorState.suggestedTime) {
      setSuggestion(apiErrorState.suggestedTime);
    }
    setDialogOpen(true);
    console.log("SUGGESTION FROM API:", apiErrorState.suggestedTime);
  }, []);


  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const range = buildRangeForView(currentView, currentDate, viewTimeZone);
      const result = await eventsApi.list(
        range.rangeStartUtc,
        range.rangeEndUtc,
        viewTimeZone,
      );
      // const expanded = result.flatMap(expandWeeklyEvent);
      // setEvents(expanded);
      setEvents(result);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load events"));
    } finally {
      setLoading(false);
    }
  }, [currentDate, currentView, viewTimeZone]);

  useEffect(() => {
    loadEvents();
  }, [currentView, loadEvents, viewTimeZone]);

  useEffect(
    () => scheduledReminderNotifications(events, viewTimeZone, t),
    [events, t, viewTimeZone],
  );

  const runMutiation = useCallback(
    async (
      mutation: () => Promise<unknown>,
      successTranslationKey: "eventCreated" | "eventUpdated" | "eventDeleted",
      options?: { rethrow?: boolean },
    ) => {
      await runCalendarMutation({
        mutation,
        loadEvents,
        setSuggestion,
        dialogOpen,
        setDialogOpen,
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
      await runMutiation(() => eventsApi.create(payload), "eventCreated", {
        rethrow: true,
      });
    },
    [runMutiation],
  );

  const handleUpdate = useCallback(
    async (id: string, payload: Partial<EventPayload>) => {
      await runMutiation(() => eventsApi.update(id, payload), "eventUpdated", {
        rethrow: true,
      });
    },
    [runMutiation],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await runMutiation(() => eventsApi.delete(id), "eventDeleted");
    },
    [runMutiation],
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
