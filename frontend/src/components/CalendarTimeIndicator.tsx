import { useEffect, useState, useMemo } from "react";
import { Box } from "@mui/material";
import { getCurrentTimeMinutes } from "../utils/calendar-utils";
import { currentTimeIndicatorSx, currentTimeIndicatorDotSx, currentTimeIndicatorLineSx } from "../styles/calendarStyles";

interface CalendarTimeIndicatorProps {
  timeZone: string;
  slotHeight: number;
  slotMinutes: number;
  hoursPerDay: number;
  gutterWidth: number;
}

export function CalendarTimeIndicator({
  timeZone,
  slotHeight,
  slotMinutes,
  hoursPerDay,
  gutterWidth,
}: CalendarTimeIndicatorProps) {
  const [currentMinutes, setCurrentMinutes] = useState(() =>
    getCurrentTimeMinutes(timeZone),
  );

  useEffect(() => {
    let intervalId: number;

    const updateCurrentMinutes = () => {
      setCurrentMinutes(getCurrentTimeMinutes(timeZone));
    };

    updateCurrentMinutes();

    const now = new Date();
    const millisecondsUntilNextMinute = Math.max(
      0,
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds(),
    );

    const timeoutId = window.setTimeout(() => {
      updateCurrentMinutes();
      intervalId = window.setInterval(updateCurrentMinutes, 60_000);
    }, millisecondsUntilNextMinute);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [timeZone]);

  const topOffset = useMemo(
    () => (currentMinutes / slotMinutes) * slotHeight,
    [currentMinutes, slotHeight, slotMinutes],
  );

  const isVisible = currentMinutes >= 0 && currentMinutes < hoursPerDay * 60;
  
  if (!isVisible) {
    return null;
  }

  return (
    <Box sx={currentTimeIndicatorSx(topOffset, gutterWidth)}>
      <Box sx={currentTimeIndicatorDotSx} />
      <Box sx={currentTimeIndicatorLineSx} />
    </Box>
  );
}
