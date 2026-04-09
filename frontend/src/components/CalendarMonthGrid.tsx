import { Box, Card, Stack, Typography } from '@mui/material';
import { DateTime } from 'luxon';
import { CalendarEventChip } from './CalendarEventChip';
import { eventOccursOnDateInZone, formatDateKey } from '../utils/calendar-utils';
import {
  monthGridDayCardSx,
  monthGridDayContentSx,
  monthGridDayNumberSx,
  monthGridHeaderCardSx,
  monthGridRowSx,
  monthGridShellSx,
} from '../styles/calendarStyles';
import type { CalendarEvent } from '../types/types';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

interface CalendarMonthGridProps {
  cells: Date[];
  currentDate: Date;
  events: CalendarEvent[];
  viewTimeZone: string;
  isMobile: boolean;
  onOpenCreateForDay: (day: Date) => void;
  onEditEvent: (event: CalendarEvent) => void;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export function CalendarMonthGrid({
  cells,
  currentDate,
  events,
  viewTimeZone,
  isMobile,
  onOpenCreateForDay,
  onEditEvent,
}: CalendarMonthGridProps) {
  const todayKey = formatDateKey(new Date());
  const selectedDayKey = formatDateKey(currentDate);

  const weeks = chunkArray(cells, 7);

  return (
    <Box sx={monthGridShellSx}>
      <Box sx={monthGridRowSx}>
        {WEEKDAY_LABELS.map((label) => (
          <Card key={label} variant="outlined" sx={monthGridHeaderCardSx}>
            <Typography variant={isMobile ? 'caption' : 'subtitle2'}>
              {label}
            </Typography>
          </Card>
        ))}
      </Box>

      {weeks.map((week, weekIndex) => (
        <Box key={weekIndex} sx={monthGridRowSx}>
          {week.map((day) => {
            const dayKey = formatDateKey(day);
            const isToday = dayKey === todayKey;
            const isSelected = dayKey === selectedDayKey;
            const isOutsideMonth =
              day.getMonth() !== currentDate.getMonth();

            const dayEvents = events
              .filter((event) =>
                eventOccursOnDateInZone(event, day, viewTimeZone)
              )
              .slice(0, isMobile ? 2 : 3);

            return (
              <Card
                key={dayKey}
                variant="outlined"
                sx={monthGridDayCardSx(
                  isToday,
                  isSelected,
                  isOutsideMonth
                )}
                onClick={() => onOpenCreateForDay(day)}
              >
                <Typography
                  variant={isMobile ? 'caption' : 'subtitle2'}
                  sx={monthGridDayNumberSx(isOutsideMonth)}
                >
                  {DateTime.fromJSDate(day)
                    .setZone(viewTimeZone)
                    .day}
                </Typography>
                <Stack spacing={0.5} sx={monthGridDayContentSx}>
                  {dayEvents.map((event) => (
                    <CalendarEventChip
                      key={event.occurrenceId}
                      event={event}
                      isMobile={isMobile}
                      onClick={() => onEditEvent(event)}
                    />
                  ))}
                </Stack>
              </Card>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}