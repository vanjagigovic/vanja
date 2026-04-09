import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { addDays, addMonth } from "../utils/calendar-utils";
import type { CalendarViewMode } from "../types/types";

type UseCalendarNavigationParams = {
    currentView: CalendarViewMode;
    setCurrentDate: Dispatch<SetStateAction<Date>>;
};

export function useCalendarNavigation({
    currentView,
    setCurrentDate,
}: UseCalendarNavigationParams) {

    const goPrevious = useCallback(() => {
        setCurrentDate((previous: Date) => {
            if (currentView === "day") return addDays(previous, -1);
            if (currentView === "week") return addDays(previous, -7);
            return addMonth(previous, -1);
        });
    }, [currentView, setCurrentDate]);

    const goToday = useCallback(() => {
        setCurrentDate(new Date());
    }, [setCurrentDate]);

    const goNext = useCallback(() => {
        setCurrentDate((previous: Date) => {
            if (currentView === "day") return addDays(previous, 1);
            if (currentView === "week") return addDays(previous, 7);
            return addMonth(previous, 1);
        });
    }, [currentView, setCurrentDate]);

    return {
        goPrevious,
        goToday,
        goNext,
    };
}