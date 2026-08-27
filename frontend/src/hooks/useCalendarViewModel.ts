import { useMemo } from "react";
import { DateTime } from "luxon";
import {
  addDays,
  formatRangeLabel,
  getWeekStart,
} from "../utils/calendar-utils";
import type { CalendarViewMode } from "../types/types";

interface UseCalendarViewModelParams {
  currentView: CalendarViewMode;
  currentDate: Date;
  viewTimeZone: string;
}

export function useCalendarViewModel({
  currentView,
  currentDate,
  viewTimeZone,
}: UseCalendarViewModelParams) {
  const rangeLabel = useMemo(
    () => formatRangeLabel(currentView, currentDate, viewTimeZone),
    [currentView, currentDate, viewTimeZone],
  );

  const visibleDays = useMemo(() => {
    if (currentView === "day") {
      return [currentDate];
    }
    if (currentView === "week") {
      return Array.from({ length: 7 }, (_, index) =>
        addDays(getWeekStart(currentDate, viewTimeZone), index),
      );
    }

    return [] as Date[];
  }, [currentDate, currentView, viewTimeZone]);

  const monthCells = useMemo(() => {
    if (currentView !== "month") {
      return [] as Date[];
    }

    const monthStart = DateTime.fromJSDate(currentDate)
      .setZone(viewTimeZone)
      .startOf("month")
      .toJSDate();
    const firstCell = getWeekStart(monthStart, viewTimeZone);
    return Array.from({ length: 42 }, (_, index) => addDays(firstCell, index));
  }, [currentDate, currentView, viewTimeZone]);
  // console.log("currentView:", currentView);
  // console.log("visibleDays:", visibleDays);
  // console.log("monthCells:", monthCells);

  return {
    rangeLabel,
    visibleDays,
    monthCells,
    isMonthView: currentView === "month",
    isWeekView: currentView === "week",
    isDayView: currentView === "day",
  };
}
