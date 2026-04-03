export const EVENT_TYPES = [
  'work',
  'personal',
  'school',
  'holiday',
  'birthday',
  'gym',
  'travel',
  'other',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];
