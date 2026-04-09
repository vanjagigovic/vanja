import { ApiError } from "../api/api-client";

type SuggestedTime = { startUtc: string; endUtc: string };

type ApiErrorDetalis = {
  suggestedTime?: SuggestedTime;
} | null;

export function getErrorMessage(
  error: unknown,
  fallBackMessage: string,
): string {
  return error instanceof Error ? error.message : fallBackMessage;
}

export function getApiErrorState(error: unknown): {
  message: string;
  suggestedTime: SuggestedTime | null;
} {
  if (error instanceof ApiError) {
    const details = error.details as ApiErrorDetalis;
    return {
      message: error.message,
      suggestedTime: details?.suggestedTime ?? null,
    };
  }
  return {
    message: getErrorMessage(error, "Request faild"),
    suggestedTime: null,
  };
}

export async function runAsyncAction(options: {
  action: () => Promise<void>;
  setError: (value: string) => void;
  setSaving?: (value: boolean) => void;
  fallbackMessage: string;
  onError?: (error: unknown) => void;
}) {
  const { action, setError, setSaving, fallbackMessage, onError } = options;

  setSaving?.(true);
  setError("");

  try {
    await action();
    return true;
  } catch (error) {
    setError(getErrorMessage(error, fallbackMessage));
    setSaving?.(false);
    onError?.(error);
    return false;
  }
}
