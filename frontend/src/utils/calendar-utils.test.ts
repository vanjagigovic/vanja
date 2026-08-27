import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DateTime } from "luxon";

import type { CalendarEvent } from "../types/types";
import {
  addDays,
  addMonth,
  buildRangeForView,
  eventOccursOnDateInZone,
  formatDateKey,
  formatEventRange,
  formatRangeLabel,
  getBrowserTimeZone,
  getCurrentTimeMinutes,
  getEventBlockMetrics,
  getSlotStartUtc,
  getSupportedTimeZones,
  getWeekStart,
  scheduleReminderNotifications,
  toLocalInputValue,
  utcIsoToZonedInput,
  zonedInputToUtcIso,
} from "./calendar-utils";

const UTC = "UTC";
const BELGRADE = "Europe/Belgrade";
const NEW_YORK = "America/New_York";

function dateAtUtc(value: string): Date {
  return new Date(value);
}

function eventAt(
  startUtc: string,
  endUtc: string,
  overrides: Partial<CalendarEvent> = {},
): CalendarEvent {
  return {
    id: "event-id",
    title: "Planning session",
    startUtc,
    endUtc,
    timeZone: UTC,
    eventType: "work",
    repeatWeekly: false,
    repeatUntilUtc: null,
    reminderEnabled: false,
    occurrenceId: "occurrence-id",
    baseEventId: "event-id",
    reminderAtUtc: null,
    ...overrides,
  };
}

describe("calendar date utilities", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe("timezone helpers", () => {
    it("returns the browser timezone when it is available", () => {
      const dateTimeFormat = vi.spyOn(Intl, "DateTimeFormat").mockImplementation(
        () => ({ resolvedOptions: () => ({ timeZone: BELGRADE }) }) as Intl.DateTimeFormat,
      );

      expect(getBrowserTimeZone()).toBe(BELGRADE);
      expect(dateTimeFormat).toHaveBeenCalled();
    });

    it("falls back to UTC when the browser does not report a timezone", () => {
      vi.spyOn(Intl, "DateTimeFormat").mockImplementation(
        () => ({ resolvedOptions: () => ({ timeZone: "" }) }) as Intl.DateTimeFormat,
      );

      expect(getBrowserTimeZone()).toBe(UTC);
    });

    it("uses the platform-supported timezone list when available", () => {
      const supported = [UTC, BELGRADE, NEW_YORK];
      const supportedValuesOf = vi
        .spyOn(Intl, "supportedValuesOf")
        .mockReturnValue(supported);

      expect(getSupportedTimeZones()).toEqual(supported);
      expect(supportedValuesOf).toHaveBeenCalledWith("timeZone");
    });

    it("uses the fallback timezone list when supportedValuesOf is unavailable", () => {
      const dateTimeFormat = vi.fn(
        () => ({ resolvedOptions: () => ({ timeZone: BELGRADE }) }) as Intl.DateTimeFormat,
      );
      vi.stubGlobal("Intl", { DateTimeFormat: dateTimeFormat });

      expect(getSupportedTimeZones()).toEqual([
        UTC,
        BELGRADE,
        BELGRADE,
        "Europe/London",
        NEW_YORK,
      ]);
    });
  });

  describe("date arithmetic", () => {
    it("starts weeks on Monday for both Sunday and Monday", () => {
      const sunday = dateAtUtc("2026-04-12T15:30:00.000Z");
      const monday = dateAtUtc("2026-04-13T15:30:00.000Z");

      expect(getWeekStart(sunday).getFullYear()).toBe(2026);
      expect(getWeekStart(sunday).getMonth()).toBe(3);
      expect(getWeekStart(sunday).getDate()).toBe(6);
      expect(getWeekStart(monday).getFullYear()).toBe(2026);
      expect(getWeekStart(monday).getMonth()).toBe(3);
      expect(getWeekStart(monday).getDate()).toBe(13);
    });

    it("adds positive and negative day amounts without mutating the input", () => {
      const original = dateAtUtc("2026-04-10T15:30:00.000Z");

      expect(addDays(original, 3)).toEqual(dateAtUtc("2026-04-13T15:30:00.000Z"));
      expect(addDays(original, -5)).toEqual(dateAtUtc("2026-04-05T15:30:00.000Z"));
      expect(original).toEqual(dateAtUtc("2026-04-10T15:30:00.000Z"));
    });

    it("clamps January 31 to February in leap and non-leap years", () => {
      expect(addMonth(new Date(2024, 0, 31), 1)).toEqual(new Date(2024, 1, 29));
      expect(addMonth(new Date(2025, 0, 31), 1)).toEqual(new Date(2025, 1, 28));
    });

    it("supports negative month movement and preserves valid month-end dates", () => {
      expect(addMonth(new Date(2026, 2, 31), -1)).toEqual(new Date(2026, 1, 28));
      expect(addMonth(new Date(2026, 3, 15), 1)).toEqual(new Date(2026, 4, 15));
    });
  });

  describe("view ranges and labels", () => {
    const currentDate = dateAtUtc("2026-04-10T15:30:00.000Z");

    it("builds a timezone-aware one-day range", () => {
      expect(buildRangeForView("day", currentDate, BELGRADE)).toEqual({
        rangeStartUtc: "2026-04-09T22:00:00.000Z",
        rangeEndUtc: "2026-04-10T22:00:00.000Z",
      });
    });

    it("builds a seven-day range from Monday for week view", () => {
      const range = buildRangeForView("week", currentDate, UTC);
      const rangeStart = DateTime.fromISO(range.rangeStartUtc);
      const rangeEnd = DateTime.fromISO(range.rangeEndUtc);

      expect(rangeEnd.diff(rangeStart, "days").days).toBe(7);
    });

    it("builds a 42-day month grid range", () => {
      expect(buildRangeForView("month", currentDate, UTC)).toEqual({
        rangeStartUtc: "2026-03-30T00:00:00.000Z",
        rangeEndUtc: "2026-05-11T00:00:00.000Z",
      });
    });

    it("formats day, week, and month labels", () => {
      expect(formatRangeLabel("day", currentDate, UTC)).toBe(
        "Friday, 10 April 2026",
      );
      expect(formatRangeLabel("week", currentDate, UTC)).toBe("05 Apr - 11 Apr");
      expect(formatRangeLabel("month", currentDate, UTC)).toBe("April 2026");
    });
  });

  describe("input and event formatting", () => {
    it("formats dates and event ranges in the requested timezone", () => {
      const date = dateAtUtc("2026-04-10T15:30:00.000Z");
      const event = eventAt(
        "2026-04-10T08:00:00.000Z",
        "2026-04-10T09:30:00.000Z",
      );

      expect(formatDateKey(date)).toBe("2026-04-10");
      expect(toLocalInputValue(date)).toBe(
        DateTime.fromJSDate(date).toFormat("yyyy-LL-dd'T'HH:mm"),
      );
      expect(formatEventRange(event, BELGRADE)).toBe("10:00 - 11:30");
    });

    it("converts local input to UTC and converts UTC back to local input", () => {
      const localValue = "2026-04-10T10:00";
      const utcValue = zonedInputToUtcIso(localValue, BELGRADE);

      expect(utcValue).toBe("2026-04-10T08:00:00.000Z");
      expect(utcIsoToZonedInput(utcValue, BELGRADE)).toBe(localValue);
      expect(utcIsoToZonedInput("2026-04-10T14:00:00.000Z", NEW_YORK)).toBe(
        "2026-04-10T10:00",
      );
    });
  });

  describe("event day overlap and placement", () => {
    const selectedDay = dateAtUtc("2026-04-10T12:00:00.000Z");

    it("includes events crossing midnight and events spanning the full day", () => {
      expect(
        eventOccursOnDateInZone(
          eventAt("2026-04-09T23:00:00.000Z", "2026-04-10T02:00:00.000Z"),
          selectedDay,
          UTC,
        ),
      ).toBe(true);
      expect(
        eventOccursOnDateInZone(
          eventAt("2026-04-09T23:00:00.000Z", "2026-04-11T02:00:00.000Z"),
          selectedDay,
          UTC,
        ),
      ).toBe(true);
    });

    it("excludes events outside the day and events ending at its start", () => {
      expect(
        eventOccursOnDateInZone(
          eventAt("2026-04-09T20:00:00.000Z", "2026-04-09T23:59:00.000Z"),
          selectedDay,
          UTC,
        ),
      ).toBe(false);
      expect(
        eventOccursOnDateInZone(
          eventAt("2026-04-09T22:00:00.000Z", "2026-04-10T00:00:00.000Z"),
          selectedDay,
          UTC,
        ),
      ).toBe(false);
    });

    it("uses timezone day boundaries when checking overlap", () => {
      const event = eventAt("2026-04-10T23:30:00.000Z", "2026-04-11T00:30:00.000Z");

      expect(eventOccursOnDateInZone(event, selectedDay, NEW_YORK)).toBe(true);
      expect(eventOccursOnDateInZone(event, selectedDay, BELGRADE)).toBe(false);
    });

    it("clips event metrics to the selected day", () => {
      expect(
        getEventBlockMetrics(
          eventAt("2026-04-09T22:00:00.000Z", "2026-04-10T02:00:00.000Z"),
          selectedDay,
          UTC,
        ),
      ).toEqual({ startMinutes: 0, endMinutes: 120 });
      expect(
        getEventBlockMetrics(
          eventAt("2026-04-10T10:15:00.000Z", "2026-04-10T11:45:00.000Z"),
          selectedDay,
          UTC,
        ),
      ).toEqual({ startMinutes: 615, endMinutes: 705 });
      expect(
        getEventBlockMetrics(
          eventAt("2026-04-09T23:00:00.000Z", "2026-04-11T01:00:00.000Z"),
          selectedDay,
          UTC,
        ),
      ).toEqual({ startMinutes: 0, endMinutes: 1440 });
    });
  });

  describe("slot and current-time calculations", () => {
    it("calculates slot starts at day zero and later slots in UTC", () => {
      const date = dateAtUtc("2026-04-10T15:45:00.000Z");

      expect(getSlotStartUtc(date, 0, 30, UTC)).toBe("2026-04-10T00:00:00.000Z");
      expect(getSlotStartUtc(date, 3, 30, UTC)).toBe("2026-04-10T01:30:00.000Z");
    });

    it("calculates slots from the selected timezone's local day", () => {
      const date = dateAtUtc("2026-04-10T15:45:00.000Z");

      expect(getSlotStartUtc(date, 3, 30, BELGRADE)).toBe(
        "2026-04-09T23:30:00.000Z",
      );
    });

    it("returns deterministic current-time minutes in the requested timezone", () => {
      vi.setSystemTime(new Date("2026-07-15T13:45:30.000Z"));

      expect(getCurrentTimeMinutes(UTC)).toBe(825.5);
      expect(getCurrentTimeMinutes(BELGRADE)).toBe(945.5);
      expect(getCurrentTimeMinutes(NEW_YORK)).toBe(585.5);
    });
  });
});

describe("scheduleReminderNotifications", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("does nothing when browser notifications are unavailable", () => {
    const cleanup = scheduleReminderNotifications([], UTC, () => "Reminder");

    expect(cleanup()).toBeUndefined();
  });

  it("returns a cleanup function during server-side rendering", () => {
    vi.stubGlobal("window", undefined);

    const cleanup = scheduleReminderNotifications([], UTC, () => "Reminder");

    expect(cleanup).toBeTypeOf("function");
    expect(cleanup()).toBeUndefined();
  });

  it("requests permission and does not schedule reminders until permission is granted", () => {
    vi.useFakeTimers();
    const requestPermission = vi.fn();
    const notification = { permission: "default", requestPermission };
    vi.stubGlobal("Notification", notification);
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: notification,
    });

    scheduleReminderNotifications([], UTC, () => "Reminder");

    expect(requestPermission).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not schedule reminders when notification permission is denied", () => {
    vi.useFakeTimers();
    const requestPermission = vi.fn();
    const notification = { permission: "denied", requestPermission };
    vi.stubGlobal("Notification", notification);
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: notification,
    });

    scheduleReminderNotifications(
      [
        eventAt("2026-04-10T11:00:00.000Z", "2026-04-10T12:00:00.000Z", {
          reminderEnabled: true,
          reminderAtUtc: "2026-04-10T10:30:00.000Z",
        }),
      ],
      UTC,
      () => "Reminder",
    );

    expect(requestPermission).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("schedules multiple valid reminders and ignores ineligible events", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T10:00:00.000Z"));
    const notification = Object.assign(vi.fn(), { permission: "granted" });
    vi.stubGlobal("Notification", notification);
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: notification,
    });

    const events = [
      eventAt("2026-04-10T11:00:00.000Z", "2026-04-10T12:00:00.000Z", {
        reminderEnabled: true,
        reminderAtUtc: "2026-04-10T10:15:00.000Z",
      }),
      eventAt("2026-04-10T11:30:00.000Z", "2026-04-10T12:30:00.000Z", {
        title: "Exactly one hour away",
        reminderEnabled: true,
        reminderAtUtc: "2026-04-10T11:00:00.000Z",
      }),
      eventAt("2026-04-10T11:00:00.000Z", "2026-04-10T12:00:00.000Z", {
        reminderEnabled: false,
        reminderAtUtc: "2026-04-10T10:20:00.000Z",
      }),
      eventAt("2026-04-10T11:00:00.000Z", "2026-04-10T12:00:00.000Z", {
        reminderEnabled: true,
        reminderAtUtc: null,
      }),
      eventAt("2026-04-10T11:00:00.000Z", "2026-04-10T12:00:00.000Z", {
        reminderEnabled: true,
        reminderAtUtc: "2026-04-10T09:59:59.000Z",
      }),
      eventAt("2026-04-10T11:00:00.000Z", "2026-04-10T12:00:00.000Z", {
        reminderEnabled: true,
        reminderAtUtc: "2026-04-10T11:00:01.000Z",
      }),
    ];

    const cleanup = scheduleReminderNotifications(events, UTC, () => "Reminder");

    expect(vi.getTimerCount()).toBe(2);
    cleanup();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("schedules eligible reminders and cleanup clears their timers", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T10:00:00.000Z"));
    const notificationConstructor = vi.fn();
    const notification = Object.assign(notificationConstructor, { permission: "granted" });
    vi.stubGlobal("Notification", notification);
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: notification,
    });

    const events = [
      eventAt("2026-04-10T11:00:00.000Z", "2026-04-10T12:00:00.000Z", {
        reminderEnabled: true,
        reminderAtUtc: "2026-04-10T10:30:00.000Z",
      }),
      eventAt("2026-04-10T11:00:00.000Z", "2026-04-10T12:00:00.000Z", {
        reminderEnabled: false,
        reminderAtUtc: "2026-04-10T10:15:00.000Z",
      }),
      eventAt("2026-04-10T11:00:00.000Z", "2026-04-10T12:00:00.000Z", {
        reminderEnabled: true,
        reminderAtUtc: "2026-04-10T12:00:00.000Z",
      }),
    ];

    const cleanup = scheduleReminderNotifications(events, BELGRADE, (key) => key);

    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(30 * 60 * 1000);
    expect(notification).toHaveBeenCalledWith(
      "reminder: Planning session",
      { body: "13:00 - 14:00 (UTC)" },
    );

    cleanup();
    expect(vi.getTimerCount()).toBe(0);
  });
});
