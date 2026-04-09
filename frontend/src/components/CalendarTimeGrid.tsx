import { Box, Card, Typography } from "@mui/material";
import { DateTime } from "luxon";
import type { CalendarEvent } from "../types/types";
import { CalendarEventCard } from "./CalendarEventCard";
import { eventOccursOnDateInZone, formatDateKey, getEventBlockMetrics, getSlotStartUtc } from "../utils/calendar-utils";
import { CalendarTimeIndicator } from "./CalendarTimeIndicator";
import { timeGridHeaderRowSx, timeGridBodyRowSx, timeGridShellSx, timeGridDayHeaderCardSx, timeGridHourLabelSx, timeGridDayColumnSx, timeGridSlotCellSx, timeGridFocusBlockSx } from "../styles/calendarStyles";

interface CalendarTimeGridProps {
  days: Date[];
  events: CalendarEvent[];
  viewTimeZone: string;
  isMobile: boolean;
  isTablet: boolean;
  slotHeight: number;
  slotMinutes: number;
  slotPerDay: number;
  hoursPerDay: number;
  onOpenCreateForSlot: (startUtc: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
}

export function CalendarTimeGrid({
  days,
  events,
  viewTimeZone,
  isMobile,
  isTablet,
  slotHeight,
  slotMinutes,
  slotPerDay,
  hoursPerDay,
  onOpenCreateForSlot,
  onEditEvent,
}: CalendarTimeGridProps) {
  const isWeeklyView = days.length > 1;

  const gutterWidth = isMobile ? 56 : 88;

  const dayColumnWidth = isWeeklyView
    ? isMobile
      ? 92
      : isTablet
        ? 122
        : 132
    : isMobile
      ? 140
      : isTablet
        ? 160
        : 180;

  const eventPadding = isMobile ? 0.5 : 0.75;
  const todayKey = formatDateKey(new Date());
  const selectedDayKey = formatDateKey(
    DateTime.now().setZone(viewTimeZone).toJSDate()
  );

  const headerRowSx = timeGridHeaderRowSx(
    gutterWidth,
    dayColumnWidth,
    days.length
  );
  const bodyRowSx = timeGridBodyRowSx(
    gutterWidth,
    dayColumnWidth,
    days.length
  );

  return (
    <Box sx={timeGridShellSx}>
      {/* HEADER */}
      <Box sx={headerRowSx}>
        <Box />
        {days.map((day) => {
          return (
            <Card
              key={formatDateKey(day)}
              variant="outlined"
              sx={timeGridDayHeaderCardSx(formatDateKey(day) === todayKey, formatDateKey(day) === selectedDayKey)}
            >
              <Typography
                variant={isMobile || isWeeklyView ? "caption" : "subtitle2"}
              >
                {DateTime.fromJSDate(day)
                  .setZone(viewTimeZone)
                  .toFormat(
                    isMobile ? "ccc dd" : isWeeklyView ? "ccc dd" : "ccc dd LLL"
                  )}
              </Typography>
            </Card>
          );
        })}
      </Box>

      {/* BODY */}
      <Box sx={bodyRowSx}>
        {/* HOURS COLUMN */}
        <Box>
          {Array.from({ length: hoursPerDay }, (_, hour) => (
            <Box
              key={hour}
              sx={timeGridHourLabelSx(
                isMobile,
                slotHeight,
                hour >= 9 && hour <= 17
              )}
            >
              {String(hour).padStart(2, "0")}:00
            </Box>
          ))}
        </Box>

        {/* CURRENT TIME LINE */}
        <CalendarTimeIndicator
          timeZone={viewTimeZone}
          slotHeight={slotHeight}
          slotMinutes={slotMinutes}
          hoursPerDay={hoursPerDay}
          gutterWidth={gutterWidth}
        />

        {/* DAY COLUMNS */}
        {days.map((day) => {
          return (
            <Box
              key={formatDateKey(day)}
              sx={timeGridDayColumnSx(
                dayColumnWidth,
                slotHeight,
                slotPerDay,
                formatDateKey(day) === todayKey,
                formatDateKey(day) === selectedDayKey
              )}
            >
              {/* SLOTS */}
              {Array.from({ length: slotPerDay }, (_, slotIndex) => (
                <Box
                  key={`${formatDateKey(day)}-${slotIndex}`}
                  onClick={() =>
                    onOpenCreateForSlot(
                      getSlotStartUtc(
                        day,
                        slotIndex,
                        slotMinutes,
                        viewTimeZone
                      )
                    )
                  }
                  sx={timeGridSlotCellSx(slotIndex, slotHeight)}
                />
              ))}

              {/* FOCUS BLOCK */}
              <Box sx={timeGridFocusBlockSx(slotHeight)} />

              {/* EVENTS */}
              {events
                .filter((event) =>
                  eventOccursOnDateInZone(event, day, viewTimeZone)
                )
                .map((event) => {
                  const metrics = getEventBlockMetrics(
                    event,
                    day,
                    viewTimeZone
                  );

                  return (
                    <CalendarEventCard
                      key={event.occurrenceId}
                      event={event}
                      viewTimeZone={viewTimeZone}
                      isMobile={isMobile}
                      eventPadding={eventPadding}
                      slotMinutes={slotMinutes}
                      slotHeight={slotHeight}
                      metrics={metrics}
                      onClick={() => onEditEvent(event)}
                    />
                  );
                })}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}