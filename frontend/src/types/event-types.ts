import {
  WorkOutline,
  SchoolOutlined,
  FlightTakeoff,
  FitnessCenter,
  Person,
  BeachAccess,
  Cake,
  MoreHoriz,
  type SvgIconComponent,
} from "@mui/icons-material";
import type { Theme } from "@mui/material/styles";

export const EVENT_TYPES = [
  "work",
  "school",
  "travel",
  "gym",
  "personal",
  "holiday",
  "birthday",
  "other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_ICONS: Record<EventType, SvgIconComponent> = {
   work: WorkOutline,
  school: SchoolOutlined,
  travel: FlightTakeoff,
  gym: FitnessCenter,
  personal: Person,
  holiday: BeachAccess,
  birthday: Cake,
  other: MoreHoriz,
};

export function getEventTypeColors(theme: Theme, type: EventType){
    return theme.custom.eventTypeColors[type];
}
