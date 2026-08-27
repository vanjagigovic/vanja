import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TFunction } from "i18next";

import type { CalendarEvent, EventPayload } from "../types/types";
import { scheduleReminderNotifications } from "../utils/calendar-utils";
import { useCalendarEvents } from "./useCalendarEvents";

const mocks = vi.hoisted(() => ({
  eventsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  scheduleReminderNotifications: vi.fn(),
}));

vi.mock("../api/events-api", () => ({ eventsApi: mocks.eventsApi }));
vi.mock("../utils/calendar-utils", async () => {
  const actual = await vi.importActual<typeof import("../utils/calendar-utils")>(
    "../utils/calendar-utils",
  );

  return {
    ...actual,
    scheduleReminderNotifications: mocks.scheduleReminderNotifications,
  };
});

const currentDate = new Date("2026-04-10T15:30:00.000Z");
const viewTimeZone = "Europe/Belgrade";
const t = vi.fn((key: string) => key) as unknown as TFunction;

const event: CalendarEvent = {
  id: "event-id",
  title: "Planning session",
  startUtc: "2026-04-10T08:00:00.000Z",
  endUtc: "2026-04-10T09:00:00.000Z",
  timeZone: viewTimeZone,
  eventType: "work",
  repeatWeekly: false,
  repeatUntilUtc: null,
  reminderEnabled: false,
  occurrenceId: "occurrence-id",
  baseEventId: "event-id",
  reminderAtUtc: null,
};

const payload: EventPayload = {
  title: "Planning session",
  startUtc: "2026-04-10T08:00:00.000Z",
  endUtc: "2026-04-10T09:00:00.000Z",
  timeZone: viewTimeZone,
  eventType: "work",
  repeatWeekly: false,
  reminderEnabled: false,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => createElement(
    QueryClientProvider,
    { client: queryClient },
    children,
  );

  return { queryClient, ...renderHook(
    () =>
      useCalendarEvents({
        currentView: "week",
        currentDate,
        viewTimeZone,
        t,
      }),
    { wrapper },
  ) };
}

describe("useCalendarEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.eventsApi.list.mockResolvedValue([event]);
    mocks.scheduleReminderNotifications.mockReturnValue(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports loading and requests events for the selected view, date, and timezone", async () => {
    const request = deferred<CalendarEvent[]>();
    mocks.eventsApi.list.mockReturnValue(request.promise);

    const { result } = setup();

    expect(result.current.loading).toBe(true);
    expect(result.current.events).toEqual([]);

    await waitFor(() => {
      expect(mocks.eventsApi.list).toHaveBeenCalledWith({
        rangeStartUtc: "2026-04-05T22:00:00.000Z",
        rangeEndUtc: "2026-04-12T22:00:00.000Z",
        viewTimeZone,
      });
    });

    request.resolve([event]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.events).toEqual([event]);
    });
  });

  it("exposes a query error and uses the fallback for non-Error failures", async () => {
    mocks.eventsApi.list.mockRejectedValue({ status: 503 });

    const { result } = setup();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe("Failed to load events");
    });
  });

  it("creates an event, invalidates active event queries, and reports success", async () => {
    const created = { ...event, id: "created-id" };
    mocks.eventsApi.list.mockResolvedValueOnce([event]).mockResolvedValueOnce([created]);
    mocks.eventsApi.create.mockResolvedValue(created);
    const onAfterMutation = vi.fn();
    const { result } = setup();

    await waitFor(() => expect(result.current.events).toEqual([event]));
    await result.current.handleCreate(payload);

    await waitFor(() => {
      expect(result.current.successMessage).toBe("eventCreated");
      expect(result.current.events).toEqual([created]);
    });
    expect(mocks.eventsApi.create).toHaveBeenCalledWith(payload);
    expect(mocks.eventsApi.list).toHaveBeenCalledTimes(2);
    expect(onAfterMutation).not.toHaveBeenCalled();
  });

  it("updates an event with its id and partial payload", async () => {
    const updated = { ...event, title: "Updated planning" };
    mocks.eventsApi.list.mockResolvedValueOnce([event]).mockResolvedValueOnce([updated]);
    mocks.eventsApi.update.mockResolvedValue(updated);
    const { result } = setup();

    await waitFor(() => expect(result.current.events).toEqual([event]));
    await result.current.handleUpdate("event-id", { title: "Updated planning" });

    await waitFor(() => {
      expect(result.current.successMessage).toBe("eventUpdated");
      expect(result.current.events).toEqual([updated]);
    });
    expect(mocks.eventsApi.update).toHaveBeenCalledWith("event-id", {
      title: "Updated planning",
    });
  });

  it("deletes an event and reports the deletion success message", async () => {
    mocks.eventsApi.list.mockResolvedValueOnce([event]).mockResolvedValueOnce([]);
    mocks.eventsApi.delete.mockResolvedValue(undefined);
    const { result } = setup();

    await waitFor(() => expect(result.current.events).toEqual([event]));
    await result.current.handleDelete("event-id");

    await waitFor(() => {
      expect(result.current.successMessage).toBe("eventDeleted");
      expect(result.current.events).toEqual([]);
    });
    expect(mocks.eventsApi.delete).toHaveBeenCalledWith("event-id");
  });

  it("rethrows create and update failures without reporting success", async () => {
    const failure = new Error("Save failed");
    mocks.eventsApi.create.mockRejectedValue(failure);
    const { result } = setup();

    await waitFor(() => expect(result.current.events).toEqual([event]));
    await expect(result.current.handleCreate(payload)).rejects.toBe(failure);
    expect(result.current.successMessage).toBe("");

    mocks.eventsApi.update.mockRejectedValue(failure);
    await expect(result.current.handleUpdate("event-id", payload)).rejects.toBe(failure);
    expect(result.current.successMessage).toBe("");
  });

  it("swallows delete failures and leaves the success message empty", async () => {
    mocks.eventsApi.delete.mockRejectedValue(new Error("Delete failed"));
    const { result } = setup();

    await waitFor(() => expect(result.current.events).toEqual([event]));
    await expect(result.current.handleDelete("event-id")).resolves.toBeUndefined();

    expect(result.current.successMessage).toBe("");
    expect(result.current.events).toEqual([event]);
  });

  it("schedules reminders with the current events, timezone, and translator", async () => {
    const { result } = setup();

    await waitFor(() => expect(result.current.events).toEqual([event]));

    expect(scheduleReminderNotifications).toHaveBeenCalledWith(
      [event],
      viewTimeZone,
      t,
    );
  });

  it("reruns reminder scheduling when the query events change", async () => {
    mocks.eventsApi.list.mockResolvedValueOnce([event]).mockResolvedValueOnce([]);
    const { result } = setup();

    await waitFor(() => expect(result.current.events).toEqual([event]));
    const initialCalls = mocks.scheduleReminderNotifications.mock.calls.length;

    await result.current.loadEvents();

    await waitFor(() => expect(result.current.events).toEqual([]));
    expect(mocks.scheduleReminderNotifications.mock.calls.length).toBeGreaterThan(
      initialCalls,
    );
  });
});
