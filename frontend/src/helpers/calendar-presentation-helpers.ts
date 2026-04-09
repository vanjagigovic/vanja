import type { TFunction } from "i18next";
import type { CalendarViewMode } from "../types/types";

export function getCalendarViewLabels(
  t: TFunction,
): Record<CalendarViewMode, string> {
  return {
    day: t("day"),
    week: t("week"),
    month: t("month"),
  };
}

  export function getCalendarControlText(t: TFunction){
    return{
        previuosLabel: t('previous'),
        todayLabel: t('today'),
        nextLabel: t('next'),
        suggestionLabel: t('suggestion'),
        suggestionActionLabel: t('useSuggestedTime'),
    };
  }

