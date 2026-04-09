import type { TFunction } from "i18next";
export type CalendarMutationSuccessKey =
  | "eventCreated"
  | "eventUpdated"
  | "eventDeleted";

interface RunCalendarMutationOptions {
  mutation: () => Promise<unknown>;
  loadEvents: () => Promise<unknown>;
  dialogOpen: boolean,
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSuggestion: (value: { startUtc: string; endUtc: string } | null) => void;
  setSuccessMessage: (value: string) => void;
  t: TFunction;
  successTranslationKey: CalendarMutationSuccessKey;
  onAfterMutation?: () => void;
  onError: (error: unknown) => void;
  rethrow?: boolean;
}

export async function runCalendarMutation(options: RunCalendarMutationOptions) {
  const {
    mutation,
    loadEvents,
    setSuggestion,
    setSuccessMessage,
    t,
    successTranslationKey,
    onAfterMutation,
    onError,
    rethrow,
  } = options;

  try {
    await mutation();
    setSuggestion(null);
    await loadEvents();
    setSuccessMessage(t(successTranslationKey));
    onAfterMutation?.();
  } catch (error) {
    onError(error);
    if (rethrow) {
      throw error;
    }
  }
}
