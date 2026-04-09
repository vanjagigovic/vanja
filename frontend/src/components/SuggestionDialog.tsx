import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import { DateTime } from "luxon";

interface SuggestionDialogProps {
  open: boolean;
  error: string;
  suggestion: { startUtc: string; endUtc: string } | null;
  viewTimeZone: string;
  onClose: () => void;
  onApply?: (s: { startUtc: string; endUtc: string }) => void;
}

export function SuggestionDialog({
  open,
  error,
  suggestion,
  viewTimeZone,
  onClose,
  onApply,
}: SuggestionDialogProps) {
  const formatted =
    suggestion
      ? `${DateTime.fromISO(suggestion.startUtc, { zone: "utc" })
          .setZone(viewTimeZone)
          .toFormat("ff")} - ${DateTime.fromISO(suggestion.endUtc, { zone: "utc" })
          .setZone(viewTimeZone)
          .toFormat("t")}`
      : "";

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Event conflict</DialogTitle>

      <DialogContent>
        <p>{error}</p>

        {suggestion && (
          <p style={{ marginTop: 12 }}>
            Suggested time: <b>{formatted}</b>
          </p>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>

        {suggestion && onApply && (
          <Button
            variant="contained"
            onClick={() => onApply(suggestion)}
          >
            Use suggested time
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}