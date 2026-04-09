import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SetStateAction } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import {
  formatDateKey,
  getBrowserTimeZone,
  getSupportedTimeZones,
} from '../utils/calendar-utils';

import type { CalendarViewMode } from '../types/types';

import { useCalendarNavigation } from './useCalendarNavigation';
import { useCalendarModal } from './useCalendarModal';

const DEFAULT_VIEW: CalendarViewMode = 'month';

function getRouteView(view?: string): CalendarViewMode {
  if (view === 'day' || view === 'week' || view === 'month') {
    return view;
  }

  return DEFAULT_VIEW;
}

function getRouteDate(value?: string): Date {
  if (!value) {
    return new Date();
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return new Date();
  }

  const nextDate = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );

  if (Number.isNaN(nextDate.getTime())) {
    return new Date();
  }

  return nextDate;
}

export function useCalendarUiState() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ view?: string; date?: string }>();

  const currentView = getRouteView(params.view);
  const currentDate = getRouteDate(params.date);

  const [viewTimeZone, setViewTimeZone] = useState(getBrowserTimeZone());
  const timeZones = useMemo(() => getSupportedTimeZones(), []);

  const buildCalendarPath = useCallback((view: CalendarViewMode, date: Date) => {
    return `/calendar/${view}/${formatDateKey(date)}`;
  }, []);

  useEffect(() => {
    const nextPath = buildCalendarPath(currentView, currentDate);

    if (location.pathname !== nextPath) {
      navigate(nextPath, { replace: true });
    }
  }, [
    buildCalendarPath,
    currentDate,
    currentView,
    location.pathname,
    navigate,
  ]);

  const setCurrentView = useCallback(
    (nextView: CalendarViewMode) => {
      navigate(buildCalendarPath(nextView, currentDate));
    },
    [buildCalendarPath, currentDate, navigate],
  );

  const setCurrentDate = useCallback(
    (value: SetStateAction<Date>) => {
      const nextDate =
        typeof value === 'function' ? value(currentDate) : value;

      navigate(buildCalendarPath(currentView, nextDate));
    },
    [buildCalendarPath, currentDate, currentView, navigate],
  );

  const { goPrevious, goNext, goToday } = useCalendarNavigation({
    currentView,
    setCurrentDate,
  });

  const {
    modalState,
    openCreateDialog,
    openCreateForSlot,
    openCreateForDay,
    openEditDialog,
    closeModal,
  } = useCalendarModal({ viewTimeZone });

  return {
    currentView,
    setCurrentView,
    currentDate,
    viewTimeZone,
    setViewTimeZone,
    modalState,
    timeZones,
    goPrevious,
    goNext,
    goToday,
    openCreateDialog,
    openCreateForSlot,
    openCreateForDay,
    openEditDialog,
    closeModal,
  };
}