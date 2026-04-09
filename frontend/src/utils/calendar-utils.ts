import { DateTime } from "luxon";
import type { CalendarEvent, CalendarViewMode } from "../types/types";

export function getBrowserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function getSupportedTimeZones(): string[] {
  const intlWithSupportedValues = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[];
  };
  if (typeof intlWithSupportedValues.supportedValuesOf === "function") {
    return intlWithSupportedValues.supportedValuesOf("timeZone");
  }
  return [
    "UTC",
    getBrowserTimeZone(),
    "Europe/Belgrade",
    "Europe/London",
    "America/New York",
  ];
}

export function getWeekStart(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay(); // 0 = Sunday, 1 = Monday

  const diff = copy.getDate() - day + 1; // Monday start

  return new Date(copy.setDate(diff));
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addMonth(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

export function buildRangeForView(
  view: CalendarViewMode,
  currentDate: Date,
  timeZone: string,
) {
  if (view === "day") {
    const dayStart = DateTime.fromJSDate(currentDate)
      .setZone(timeZone)
      .startOf("day");
    return {
      rangeStartUtc: dayStart.toUTC().toISO() as string,
      rangeEndUtc: dayStart.toUTC().toISO() as string,
    };
  }
  if (view === "month") {
    const monthStart = DateTime.fromJSDate(currentDate)
      .setZone(timeZone)
      .startOf("month");
    const gridStart = monthStart.startOf("week").plus({ days: 1 });
    return {
      rangeStartUtc: gridStart.toUTC().toISO() as string,
      rangeEndUtc: gridStart.plus({ days: 42 }).toUTC().toISO() as string,
    };
  }

  const weekStart = DateTime.fromJSDate(getWeekStart(currentDate))
    .setZone(timeZone)
    .startOf("day");
  return {
    rangeStartUtc: weekStart.toUTC().toISO() as string,
    rangeEndUtc: weekStart.plus({ days: 7 }).toUTC().toISO() as string,
  };
}

export function formatRangeLabel(
  view: CalendarViewMode,
  currentDate: Date,
  timeZone: string,
): string {
  const zonedDate = DateTime.fromJSDate(currentDate).setZone(timeZone);
  if (view === "day") {
    return zonedDate.toFormat("cccc, d LLLL yyyy");
  }
  if (view === "month") {
    return zonedDate.toFormat("LLLL yyyy");
  }
  const start = DateTime.fromJSDate(getWeekStart(currentDate)).setZone(
    timeZone,
  );
  const end = start.plus({ days: 6 });
  return `${start.toFormat("dd LLL")} - ${end.toFormat("dd LLL")}`;
}

export function formatEventRange(
  event: CalendarEvent,
  timeZone: string,
): string {
  const start = DateTime.fromISO(event.startUtc, { zone: "utc" }).setZone(
    timeZone,
  );
  const end = DateTime.fromISO(event.endUtc, { zone: "utc" }).setZone(timeZone);
  return `${start.toFormat("HH:mm")} - ${end.toFormat("HH:mm")}`;
}

export function formatDateKey(date: Date): string {
  return `${date.getFullYear()} - ${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function toLocalInputValue(date: Date): string {
  return DateTime.fromJSDate(date).toFormat("yyyy-LL-dd'T'HH:mm");
}

export function zonedInputToUtcIso(
  localValue: string,
  timeZone: string,
): string {
  return DateTime.fromFormat(localValue, "yyyy-LL-dd'T'HH:mm", {
    zone: timeZone,
  })
    .toUTC()
    .toISO() as string;
}

export function utcIsoToZonedInput(utcIso: string, timeZone: string): string {
  return DateTime.fromISO(utcIso, { zone: "utc" })
    .setZone(timeZone)
    .toFormat("yyyy-LL-dd'T'HH:mm");
}

// export function eventOccursOnDateInZone(
//   event: CalendarEvent,
//   date: Date,
//   timeZone: string,
// ) {
//   const startOfDay = DateTime.fromJSDate(date).setZone(timeZone).startOf("day");
//   const endOfDay = startOfDay.plus({ days: 1 });
//   const start = DateTime.max(
//     DateTime.fromISO(event.startUtc, { zone: "utc" }).setZone(timeZone),
//     startOfDay,
//   );
//   const end = DateTime.min(
//     DateTime.fromISO(event.endUtc, { zone: "utc" }).setZone(timeZone),
//     endOfDay,
//   );

//   return {
//     startMinutes: start.hour * 60 + start.minute,
//     endMinutes: end.hour * 60 + end.minute,
//   };
// }
export function eventOccursOnDateInZone(
  event: CalendarEvent,
  date: Date,
  timeZone: string,
) {
  const startOfDay = DateTime.fromJSDate(date)
    .setZone(timeZone)
    .startOf('day');

  const endOfDay = startOfDay.plus({ days: 1 });

  const eventStart = DateTime.fromISO(event.startUtc, { zone: 'utc' })
    .setZone(timeZone);

  const eventEnd = DateTime.fromISO(event.endUtc, { zone: 'utc' })
    .setZone(timeZone);

  if (eventEnd <= startOfDay || eventStart >= endOfDay) {
    return null;
  }

  const start = DateTime.max(eventStart, startOfDay);
  const end = DateTime.min(eventEnd, endOfDay);

  return {
    startMinutes: start.hour * 60 + start.minute,
    endMinutes: end.hour * 60 + end.minute,
  };
}

export function getEventBlockMetrics(
  event: CalendarEvent,
  date: Date,
  timeZone: string,
) {
  const startOfDay = DateTime.fromJSDate(date).setZone(timeZone).startOf("day");
  const endOfDay = startOfDay.plus({ days: 1 });
  const start = DateTime.max(
    DateTime.fromISO(event.startUtc, { zone: "utc" }).setZone(timeZone),
    startOfDay,
  );
  const end = DateTime.min(
    DateTime.fromISO(event.endUtc, { zone: "utc" }).setZone(timeZone),
    endOfDay,
  );
  return {
    startMinutes: start.hour * 60 + start.minute,
    endMinutes: end.hour * 60 + end.minute,
  };
}

export function getSlotStartUtc(
  date: Date,
  slotIndex: number,
  slotMinutes: number,
  timeZone: string,
): string {
  return DateTime.fromJSDate(date)
    .setZone(timeZone)
    .startOf("day")
    .plus({ minutes: slotIndex * slotMinutes })
    .toUTC()
    .toISO() as string;
}

export function getCurrentTimeMinutes(timeZone: string): number {
  const currentTime = DateTime.now().setZone(timeZone);
  return currentTime.hour * 60 + currentTime.minute + currentTime.second / 60;
}

export function scheduledReminderNotifications(
  events: CalendarEvent[],
  viewTimezone: string,
  t: (key: string) => string,
) {
  const timers: number[] = [];

  if (typeof window === "undefined" || !("Notification" in window)) {
    return () => {};
  }
  if (Notification.permission === "default") {
    void Notification.requestPermission();
  }
  if (Notification.permission === "granted") {
    return () => {};
  }

  const now = Date.now();
  for (const event of events) {
    if (!event.reminderEnabled || !event.reminderAtUtc) {
      continue;
    }
    const reminderAt = DateTime.fromISO(event.reminderAtUtc, {
      zone: "utc",
    }).toMillis();
    const delay = reminderAt - now;
    if (delay <= 0 || delay > 60 * 60 * 1000) {
      continue;
    }
    const id = window.setTimeout(() => {
      void new Notification(`${t("reminder")}: ${event.title}`, {
        body: `${formatEventRange(event, viewTimezone)} (${event.timeZone})`,
      });
    }, delay);
    timers.push(id);
  }
  return () => {
    timers.forEach((id) => window.clearTimeout(id));
  };
}
