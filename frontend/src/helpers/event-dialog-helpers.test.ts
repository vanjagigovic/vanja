import { afterEach, describe, expect, it, vi } from "vitest";
import { DateTime } from "luxon";

import type { CalendarEvent } from "../types/types";
import {
  buildEventPayload,
  convertedZoneDateTime,
  getEventDialogDefaults,
} from "./event-dialog-helpers";

const UTC = "UTC";
const BELGRADE = "Europe/Belgrade";
const NEW_YORK = "America/New_York";

function event(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "event-id",
    title: "  Team planning  ",
    startUtc: "2026-04-10T08:00:00.000Z",
    endUtc: "2026-04-10T09:30:00.000Z",
    isAllDay: false,
    timeZone: BELGRADE,
    eventType: "work",
    repeatWeekly: true,
    repeatUntilUtc: "2026-06-26T08:00:00.000Z",
    reminderEnabled: true,
    occurrenceId: "occurrence-id",
    baseEventId: "event-id",
    reminderAtUtc: "2026-04-10T07:30:00.000Z",
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("getEventDialogDefaults", () => {
  it("maps an existing event into local dialog values", () => {
    expect(getEventDialogDefaults({ event: event() })).toEqual({
      defaultTimeZone: BELGRADE,
      title: "  Team planning  ",
      startLocal: "2026-04-10T10:00",
      endLocal: "2026-04-10T11:30",
      eventType: "work",
      repeatWeekly: true,
      repeatUntil: "2026-06-26T10:00",
      reminderEnabled: true,
      isAllDay: false,
    });
  });

  it("uses initial create times and the browser timezone", () => {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || UTC;

    expect(
      getEventDialogDefaults({
        event: null,
        initialStartUtc: "2026-04-10T14:00:00.000Z",
        initialEndUtc: "2026-04-10T15:00:00.000Z",
      }),
    ).toEqual({
      defaultTimeZone: browserTimeZone,
      title: "",
      startLocal: DateTime.fromISO("2026-04-10T14:00:00.000Z", { zone: UTC })
        .setZone(browserTimeZone)
        .toFormat("yyyy-LL-dd'T'HH:mm"),
      endLocal: DateTime.fromISO("2026-04-10T15:00:00.000Z", { zone: UTC })
        .setZone(browserTimeZone)
        .toFormat("yyyy-LL-dd'T'HH:mm"),
      eventType: "work",
      repeatWeekly: false,
      repeatUntil: "",
      reminderEnabled: false,
      isAllDay: false,
    });
  });

  it("uses a deterministic current start and leaves end empty when create times are absent", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T14:05:00.000Z"));
    vi.spyOn(Intl, "DateTimeFormat").mockImplementation(
      () => ({ resolvedOptions: () => ({ timeZone: UTC }) }) as Intl.DateTimeFormat,
    );

    expect(getEventDialogDefaults({ event: null })).toMatchObject({
      defaultTimeZone: UTC,
      startLocal: "2026-04-10T14:05",
      endLocal: "",
      repeatUntil: "",
    });
  });

  it("falls back to defaults for false, null, and empty event values", () => {
    expect(
      getEventDialogDefaults({
        event: event({
          title: "",
          eventType: undefined as never,
          repeatWeekly: false,
          reminderEnabled: false,
          reminderAtUtc: null,
          repeatUntilUtc: null,
        }),
      }),
    ).toMatchObject({
      title: "",
      eventType: "work",
      repeatWeekly: false,
      repeatUntil: "",
      reminderEnabled: false,
    });
  });
});

describe("convertedZoneDateTime", () => {
  it("returns empty values unchanged", () => {
    expect(convertedZoneDateTime("", UTC, BELGRADE)).toBe("");
  });

  it("preserves the instant while changing the displayed timezone", () => {
    expect(convertedZoneDateTime("2026-04-10T10:00", BELGRADE, NEW_YORK)).toBe(
      "2026-04-10T04:00",
    );
    expect(convertedZoneDateTime("2026-01-10T10:00", NEW_YORK, BELGRADE)).toBe(
      "2026-01-10T16:00",
    );
  });
});

describe("buildEventPayload", () => {
  it("trims the title and converts all enabled recurrence fields to UTC", () => {
    expect(
      buildEventPayload({
        title: "  Team planning  ",
        startLocal: "2026-04-10T10:00",
        endLocal: "2026-04-10T11:30",
        timeZone: BELGRADE,
        eventType: "travel",
        repeatWeekly: true,
        repeatUntil: "2026-06-26T10:00",
        reminderEnabled: true,
      }),
    ).toEqual({
      title: "Team planning",
      startUtc: "2026-04-10T08:00:00.000Z",
      endUtc: "2026-04-10T09:30:00.000Z",
      isAllDay: false,
      timeZone: BELGRADE,
      eventType: "travel",
      repeatWeekly: true,
      repeatUntilUtc: "2026-06-26T08:00:00.000Z",
      reminderEnabled: true,
    });
  });

  it("omits repeatUntilUtc when repetition is disabled or its value is empty", () => {
    const values = {
      title: "Single event",
      startLocal: "2026-04-10T10:00",
      endLocal: "2026-04-10T11:00",
      timeZone: UTC,
      eventType: "personal" as const,
      reminderEnabled: false,
    };

    expect(
      buildEventPayload({ ...values, repeatWeekly: false, repeatUntil: "2026-06-26T10:00" }),
    ).toEqual({
      title: "Single event",
      startUtc: "2026-04-10T10:00:00.000Z",
      endUtc: "2026-04-10T11:00:00.000Z",
      isAllDay: false,
      timeZone: UTC,
      eventType: "personal",
      repeatWeekly: false,
      repeatUntilUtc: undefined,
      reminderEnabled: false,
    });
    expect(
      buildEventPayload({ ...values, repeatWeekly: true, repeatUntil: "" }),
    ).toMatchObject({ repeatWeekly: true, repeatUntilUtc: undefined });
  });

  it("keeps an all-day date stable across timezone changes", () => {
    const allDayEvent = event({
      isAllDay: true,
      startUtc: "2026-04-10T00:00:00.000Z",
      endUtc: "2026-04-12T00:00:00.000Z",
    });

    expect(getEventDialogDefaults({ event: allDayEvent })).toMatchObject({
      isAllDay: true,
      startLocal: "2026-04-10",
      endLocal: "2026-04-11",
    });
    expect(
      buildEventPayload({
        title: "Date range",
        startLocal: "2026-04-10",
        endLocal: "2026-04-11",
        isAllDay: true,
        timeZone: NEW_YORK,
        eventType: "holiday",
        repeatWeekly: false,
        repeatUntil: "",
        reminderEnabled: false,
      }),
    ).toMatchObject({
      startUtc: "2026-04-10T00:00:00.000Z",
      endUtc: "2026-04-12T00:00:00.000Z",
      isAllDay: true,
    });
  });
});
