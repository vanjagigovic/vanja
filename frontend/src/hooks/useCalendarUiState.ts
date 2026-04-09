import { useMemo, useState } from "react";
import {
  getBrowserTimeZone,
  getSupportedTimeZones,
} from "../utils/calendar-utils";
import type { CalendarViewMode } from "../types/types";
import { useCalendarNavigation } from "./useCalendarNavigation";
import { useCalendarModal } from "./useCalendarModal";

export function useCalendarUiState() {
  const [currentView, setCurrentView] = useState<CalendarViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewTimeZone, setViewTimeZone] = useState(getBrowserTimeZone);
  const timeZones = useMemo(() => getSupportedTimeZones(), []);
  const { goPrevious, goToday, goNext } = useCalendarNavigation({
    currentView,
    setCurrentDate,
  });
  const {
    modalState,
    openCreateDialog,
    openCreateForDay,
    openCreateForSlot,
    openEditDialog,
    closeModal,
  } = useCalendarModal({ viewTimeZone });

  return {
    currentView,
    setCurrentView,
    currentDate,
    setCurrentDate,
    viewTimeZone,
    setViewTimeZone,
    modalState,
    timeZones,
    goPrevious,
    goToday,
    goNext,
    openCreateDialog,
    openCreateForDay,
    openCreateForSlot,
    openEditDialog,
    closeModal,
  };
}
