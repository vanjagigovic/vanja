import { Card, Stack, Typography, useTheme } from "@mui/material";
import { EVENT_TYPE_ICONS, getEventTypeColors } from "../types/event-types";
import type { CalendarEvent } from "../types/types";
import { motion } from "framer-motion";
import { NotificationsActiveOutlined } from "@mui/icons-material";
import { eventMotionProps } from "../helpers/motion-presets";
import {
  timeGridEventCardSx,
  timeGridEventIconSx,
  timeGridEventTitleSx,
  timeGridEventTextSx,
  timeGridReminderIconSx,
} from "../styles/eventStyles";
import { formatEventRange } from "../utils/calendar-utils";

interface CalendarEventCardProps {
  event: CalendarEvent;
  viewTimeZone: string;
  isMobile: boolean;
  eventPadding: number;
  slotMinutes: number;
  slotHeight: number;
  metrics: { startMinutes: number; endMinutes: number };
  onClick: () => void;
}

export function CalendarEventCard({
  event,
  viewTimeZone,
  isMobile,
  eventPadding,
  slotMinutes,
  slotHeight,
  metrics,
  onClick,
}: CalendarEventCardProps) {
  const theme = useTheme();
  const Icon = EVENT_TYPE_ICONS[event.eventType];
  const colors = getEventTypeColors(theme, event.eventType);

  return (
    <Card
      component={motion.div}
      {...eventMotionProps}
      onClick={onClick}
      sx={timeGridEventCardSx(
        colors,
        eventPadding,
        metrics,
        slotMinutes,
        slotHeight,
      )}
    >
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Icon sx={timeGridEventIconSx(isMobile)} />
        <Typography
          variant="caption"
          fontWeight={700}
          noWrap
          sx={timeGridEventTitleSx(isMobile)}
        >
          {event.title}
        </Typography>
      </Stack>
      <Typography
        variant="caption"
        display="block"
        noWrap
        sx={timeGridEventTextSx(isMobile)}
      >
        {formatEventRange(event, viewTimeZone)}
      </Typography>
      <Stack direction="row" spacing={0.5} alignItems="center">
        {event.reminderEnabled ? (
          <NotificationsActiveOutlined sx={timeGridReminderIconSx(isMobile)} />
        ) : null}
        <Typography variant="caption" noWrap sx={timeGridEventTextSx(isMobile)}>
          {event.timeZone}
        </Typography>
      </Stack>
    </Card>
  );
}
