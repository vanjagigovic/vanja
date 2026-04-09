import { useCallback, useState } from "react";
import { DateTime } from "luxon";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import {
  EVENT_TYPE_ICONS,
  EVENT_TYPES,
  getEventTypeColors,
} from "../types/event-types";

import {
  getDialogMotion,
  pressableMotionProps,
  quickMotionTransition,
} from "../helpers/motion-presets";

import { errorAlertSx } from "../styles/alertStyles";
import * as eventStyles from "../styles/eventStyles";

import type { CalendarEvent, EventPayload } from "../types/types";

import { useEventDialogState } from "../hooks/useEventDialogState";

interface EventDialogProps {
  event: CalendarEvent | null;
  initialStartUtc?: string;
  initialEndUtc?: string;
  onClose: () => void;
  onSave: (payload: EventPayload) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function EventDialog({
  event,
  initialStartUtc,
  initialEndUtc,
  onClose,
  onSave,
  onDelete,
}: EventDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [closeDirection, setCloseDirection] = useState<
    "left" | "right" | "center"
  >("center");

  const closeWithAnimation = useCallback(
    async (direction: "left" | "right") => {
      if (isClosing) return;

      setCloseDirection(direction);
      setIsClosing(true);

      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 220);
      });

      onClose();
    },
    [isClosing, onClose],
  );

  const handleDialogSave = useCallback(
    async (payload: EventPayload) => {
      await onSave(payload);
      await closeWithAnimation("right");
    },
    [closeWithAnimation, onSave],
  );

  const handleDialogDelete = useCallback(async () => {
    if (!onDelete) return;

    await onDelete();
    setConfirmingDelete(false);
    await closeWithAnimation("right");
  }, [closeWithAnimation, onDelete]);

  const {
    title,
    setTitle,
    timeZone,
    setTimeZone,
    startLocal,
    setStartLocal,
    endLocal,
    setEndLocal,
    eventType,
    setEventType,
    repeatWeekly,
    setRepeatWeekly,
    repeatUntil,
    setRepeatUntil,
    reminderEnabled,
    setReminderEnabled,
    error,
    fieldErrors,
    saving,
    timeZones,
    handleSubmit,
    handleDelete,
    canSave,
  } = useEventDialogState({
    event,
    initialStartUtc,
    initialEndUtc,
    onSave: handleDialogSave,
    onDelete: handleDialogDelete,
  });

  const parsePickerValue = useCallback(
    (value: string) => {
      if (!value) return null;

      const parsed = DateTime.fromFormat(value, "yyyy-LL-dd'T'HH:mm", {
        zone: timeZone,
      });

      return parsed.isValid ? parsed : null;
    },
    [timeZone],
  );

  const formatPickerValue = useCallback(
    (value: DateTime | null) => {
      if (!value || !value.isValid) return "";

      return value.setZone(timeZone).toFormat("yyyy-LL-dd'T'HH:mm");
    },
    [timeZone],
  );

  function handleDeleteClick() {
    setConfirmingDelete(true);
  }

  function handleCancelDelete() {
    setConfirmingDelete(false);
  }

  function handleCancel() {
    if (saving || isClosing) return;

    void closeWithAnimation("left");
  }

  async function handleConfirmDelete() {
    await handleDelete();
  }

  return (
    <Dialog
      open
      onClose={saving || isClosing ? undefined : handleCancel}
      fullWidth
      maxWidth="sm"
      fullScreen={isMobile}
      BackdropProps={{
        sx: eventStyles.eventDialogBackdropSx,
      }}
      PaperProps={{
        component: motion.div,
        sx: eventStyles.eventDialogPaperSx(isMobile),
        initial: { opacity: 0, y: 16, scale: 0.985 },
        animate: isClosing
          ? getDialogMotion(closeDirection, true)
          : {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: quickMotionTransition,
            },
      }}
    >
      <DialogTitle sx={eventStyles.eventDialogTitleSx}>
        <Stack spacing={eventStyles.eventDialogHeaderStackSpacing}>
          <Box sx={eventStyles.eventDialogIconBadgeSx}>
            {(() => {
              const Icon = EVENT_TYPE_ICONS[eventType];
              return <Icon sx={eventStyles.eventDialogHeaderIconSx} />;
            })()}
          </Box>

          <Box component="span" sx={eventStyles.eventDialogTitleTextSx}>
            {event ? t("editEvent") : t("createEvent")}
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={eventStyles.eventDialogContentSx}>
        <LocalizationProvider dateAdapter={AdapterLuxon} adapterLocale="en">
          <Stack
            component="form"
            spacing={2}
            sx={eventStyles.eventDialogFormSx(isMobile)}
            onSubmit={handleSubmit}
          >
            <TextField
              label={t("title")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              error={Boolean(fieldErrors.title)}
              helperText={fieldErrors.title}
              sx={eventStyles.eventDialogFieldSx}
            />

            <FormControl fullWidth sx={eventStyles.eventDialogFieldSx}>
              <InputLabel>{t("eventType")}</InputLabel>

              <Select
                label={t("eventType")}
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
              >
                {EVENT_TYPES.map((type) => {
                  const Icon = EVENT_TYPE_ICONS[type];
                  const colors = getEventTypeColors(theme, type);

                  return (
                    <MenuItem
                      key={type}
                      value={type}
                      sx={eventStyles.eventDialogTypeMenuItemSx(colors)}
                    >
                      <Box sx={eventStyles.eventDialogTypeMenuItemContentSx}>
                        <Icon
                          sx={eventStyles.eventDialogTypeMenuItemIconSx(
                            colors.text,
                          )}
                        />
                        <span>{type}</span>
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={eventStyles.eventDialogFieldSx}>
              <InputLabel>{t("timeZone")}</InputLabel>

              <Select
                label={t("timeZone")}
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
              >
                {timeZones.map((zone) => (
                  <MenuItem
                    key={zone}
                    value={zone}
                    sx={eventStyles.eventDialogTimeZoneMenuItemSx}
                  >
                    {zone}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack
              direction={eventStyles.eventDialogDateRowDirection}
              spacing={2}
            >
              <DateTimePicker
                label={t("start")}
                value={parsePickerValue(startLocal)}
                onChange={(value) => setStartLocal(formatPickerValue(value))}
                timezone={timeZone}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: Boolean(fieldErrors.startLocal),
                    helperText: fieldErrors.startLocal,
                    sx: eventStyles.eventDialogFieldSx,
                  },
                }}
              />

              <DateTimePicker
                label={t("end")}
                value={parsePickerValue(endLocal)}
                onChange={(value) => setEndLocal(formatPickerValue(value))}
                timezone={timeZone}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: Boolean(fieldErrors.endLocal),
                    helperText: fieldErrors.endLocal,
                    sx: eventStyles.eventDialogFieldSx,
                  },
                }}
              />
            </Stack>

            <Box sx={eventStyles.eventDialogOptionsBoxSx}>
              <Stack spacing={eventStyles.eventDialogOptionsStackSpacing}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={repeatWeekly}
                      onChange={(e) => setRepeatWeekly(e.target.checked)}
                    />
                  }
                  label={t("repeatWeekly")}
                  sx={eventStyles.eventDialogFormControlLabelSx}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={reminderEnabled}
                      onChange={(e) => setReminderEnabled(e.target.checked)}
                    />
                  }
                  label={t("reminderEnabled")}
                  sx={eventStyles.eventDialogFormControlLabelSx}
                />
              </Stack>
            </Box>

            {repeatWeekly ? (
              <DateTimePicker
                label={t("repeatUntil")}
                value={parsePickerValue(repeatUntil)}
                onChange={(value) => setRepeatUntil(formatPickerValue(value))}
                timezone={timeZone}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: Boolean(fieldErrors.repeatUntil),
                    helperText: fieldErrors.repeatUntil,
                    sx: eventStyles.eventDialogFieldSx,
                  },
                }}
              />
            ) : null}

            {error ? (
              <Alert severity="error" sx={errorAlertSx}>
                {error}
              </Alert>
            ) : null}
          </Stack>
        </LocalizationProvider>
      </DialogContent>

      <DialogActions sx={eventStyles.eventDialogActionsSx}>
        {onDelete ? (
          <Button
            component={motion.button}
            {...pressableMotionProps}
            variant="outlined"
            color="error"
            sx={eventStyles.eventDialogDangerButtonSx}
            onClick={handleDeleteClick}
            disabled={saving}
            fullWidth={isMobile}
          >
            {t("delete")}
          </Button>
        ) : null}

        <Button
          component={motion.button}
          {...pressableMotionProps}
          variant="outlined"
          sx={eventStyles.eventDialogSecondaryButtonSx}
          onClick={handleCancel}
          disabled={saving || isClosing}
          fullWidth={isMobile}
        >
          {t("cancel")}
        </Button>

        <Button
          component={motion.button}
          {...pressableMotionProps}
          variant="contained"
          sx={eventStyles.eventDialogPrimaryButtonSx}
          onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}
          disabled={!canSave}
          fullWidth={isMobile}
        >
          {t("save")}
        </Button>
      </DialogActions>

      <Dialog
        open={confirmingDelete}
        onClose={saving ? undefined : handleCancelDelete}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: eventStyles.eventDialogDeleteConfirmPaperSx,
        }}
      >
        <DialogTitle sx={eventStyles.eventDialogDeleteConfirmTitleSx}>
          {t("confirmDeleteTitle")}
        </DialogTitle>

        <DialogContent sx={eventStyles.eventDialogDeleteConfirmContentSx}>
          <Alert
            severity="warning"
            sx={eventStyles.eventDialogDeleteConfirmAlertSx}
          >
            {t("confirmDeleteMessage")}
          </Alert>
        </DialogContent>

        <DialogActions sx={eventStyles.eventDialogDeleteConfirmActionsSx}>
          <Button
            component={motion.button}
            {...pressableMotionProps}
            variant="outlined"
            sx={eventStyles.eventDialogSecondaryButtonSx}
            onClick={handleCancelDelete}
            disabled={saving}
            fullWidth={isMobile}
          >
            {t("cancel")}
          </Button>

          <Button
            component={motion.button}
            {...pressableMotionProps}
            color="error"
            variant="contained"
            sx={eventStyles.eventDialogDeleteConfirmButtonSx}
            onClick={() => void handleConfirmDelete()}
            disabled={saving}
            fullWidth={isMobile}
          >
            {t("confirmDelete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
