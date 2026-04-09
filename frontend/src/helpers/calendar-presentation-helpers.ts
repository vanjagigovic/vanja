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

  export function getCalendarHeaderText(t: TFunction) {
    return {
      appTitle: t("appTitle"),
      appSubtitle: t("appSubtitle"),
      newEventLabel: t('newEvent'),
      viewTimeZoneLabel: t('viewTimeZone'),
    };
  }

  export function getCalendarControlText(t: TFunction){
    return{
        previuosLabel: t('previous'),
        todayLabel: t('Today'),
        nextLabel: t('nextLabel'),
        suggestionLabel: t('suggestion'),
        suggestionActionLabel: t('useSuggestedTime'),
    };
  }

