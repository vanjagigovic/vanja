import type { ListEventQuery } from "../types/event-api-types";

const EVENT_BASE_PATH = "/events";

export function buildEventsListPath({
  rangeStartUtc,
  rangeEndUtc,
  viewTimeZone,
}: ListEventQuery): string {
  const params = new URLSearchParams();

  if (rangeStartUtc) {
    params.set("rangeStartUtc", rangeStartUtc);
  }
  if (rangeEndUtc) {
    params.set("rangeEndUtc", rangeEndUtc);
  }
  if (viewTimeZone) {
    params.set("viewTimeZone", viewTimeZone);
  }
  const query = params.toString();
  return query ? `${EVENT_BASE_PATH}?${query}` : EVENT_BASE_PATH;
}

export function buildEventDetailPath(id: string): string {
  return `${EVENT_BASE_PATH}/${id}`;
}

export function getEventsBasePath(): string {
  return EVENT_BASE_PATH;
}
