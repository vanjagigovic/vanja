import { Alert, Button } from "@mui/material";
import { DateTime } from "luxon";
import { errorAlertSx, infoAlertSx } from "../styles/alertStyles";
import { eventDialogSuggestedTimeButtonSx } from "../styles/eventStyles";

interface CalendarFeedbackProps {
  error: string;
  suggestion: { startUtc: string; endUtc: string } | null;
  suggestionLabel: string;
  suggestionActionLabel: string;
  viewTimeZone: string;
  isMobile: boolean;
  onUseSuggestedTime?: (suggestion: {
    startUtc: string;
    endUtc: string;
  }) => void;
}

export function CalendarFeedback({
  error,
  suggestion,
  suggestionLabel,
  suggestionActionLabel,
  viewTimeZone,
  isMobile,
  onUseSuggestedTime,
}: CalendarFeedbackProps) {
  const suggestionRange = suggestion
    ? `${DateTime.fromISO(suggestion.startUtc, { zone: "utc" }).setZone(viewTimeZone).toFormat("ff")} - ${DateTime.fromISO(suggestion.endUtc, { zone: "utc" }).setZone(viewTimeZone).toFormat("t")}`
    : "";

  return (
    <>
      {error ? (
        <Alert severity="error" sx={errorAlertSx}>
          {error}
        </Alert>
      ) : null}
      {suggestion ? (
        <Alert
          severity="info"
          sx={infoAlertSx}
          action={
            onUseSuggestedTime ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => onUseSuggestedTime(suggestion)}
                sx={eventDialogSuggestedTimeButtonSx(isMobile)}
              >
                {suggestionActionLabel}
              </Button>
            ) : null
          }
        >
          {suggestionLabel}: {suggestionRange}
        </Alert>
      ) : null}
    </>
  );
}
