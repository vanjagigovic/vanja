import type { TFunction } from "i18next";

export type CalendarMutationSuccessKey =
  | "eventCreated"
  | "eventUpdated"
  | "eventDeleted";

interface RunCalendarMutationOptions {
  mutation: () => Promise<unknown>;
  loadEvents: () => Promise<unknown>;
  setSuccessMessage: (value: string) => void;
  t: TFunction;
  successTranslationKey: CalendarMutationSuccessKey;
  onAfterMutation?: () => void;
  rethrow?: boolean;
}

export async function runCalendarMutation(options: RunCalendarMutationOptions) {
  const {
    mutation,
    loadEvents,
    setSuccessMessage,
    t,
    successTranslationKey,
    onAfterMutation,
    rethrow,
  } = options;

  try {
    await mutation();
    await loadEvents();
    setSuccessMessage(t(successTranslationKey));
    onAfterMutation?.();
  } catch (error) {
    if (rethrow) {
      throw error;
    }
  }
}
