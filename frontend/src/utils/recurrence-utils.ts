import { DateTime } from 'luxon';

type MutableEventShape = {
  id?: string;
  title: string;
  startUtc: string;
  endUtc: string;
  repeatWeekly?: boolean;
  repeatUntilUtc?: string;
  timeZone: string;
};

export function expandRecurringEvent(event: MutableEventShape): MutableEventShape[] {
  if (!event.repeatWeekly || !event.repeatUntilUtc) {
    return [event];
  }

  const start = DateTime.fromISO(event.startUtc, { zone: 'utc' });
  const end = DateTime.fromISO(event.endUtc, { zone: 'utc' });
  const until = DateTime.fromISO(event.repeatUntilUtc, { zone: 'utc' });

  const duration = end.diff(start);

  const occurrences: MutableEventShape[] = [];

  let currentStart = start;

  while (currentStart <= until) {
    const currentEnd = currentStart.plus(duration);

    occurrences.push({
      ...event,
      startUtc: currentStart.toUTC().toISO(),
      endUtc: currentEnd.toUTC().toISO(),
      repeatWeekly: false,
    });

    currentStart = currentStart.plus({ weeks: 1 });
  }

  return occurrences;
}