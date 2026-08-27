import type { SxProps, Theme } from "@mui/material";
import type { SystemStyleObject } from "@mui/system";

type EventColors = {
  background: string;
  text: string;
  border: string;
};

type EventMetrics = {
  startMinutes: number;
  endMinutes: number;
};

type ThemeSx = (theme: Theme) => SystemStyleObject<Theme>;

export const timeGridEventCardSx = (
  colors: EventColors,
  eventPadding: number,
  metrics: EventMetrics,
  slotMinutes: number,
  slotHeight: number,
): SxProps<Theme> => ({
  position: "absolute",
  left: 10,
  right: 10,
  top: `${(metrics.startMinutes / slotMinutes) * slotHeight + 2}px`,
  height: `${Math.max(
    24,
    ((metrics.endMinutes - metrics.startMinutes) / slotMinutes) * slotHeight -
      4,
  )}px`,
  bgcolor: colors.background,
  color: colors.text,
  border: "1px solid",
  borderColor: colors.border,
  p: eventPadding,
  cursor: "pointer",
  overflow: "hidden",
  zIndex: 3,
  borderRadius: 1,
  boxShadow: (theme) => theme.custom.shadows.medium,
  backdropFilter: (theme) => theme.custom.glass.surface.blur,
});

export const timeGridEventTitleSx = (isMobile: boolean): SxProps<Theme> => ({
  fontSize: isMobile ? 11 : 12,
});

export const timeGridEventTextSx = (isMobile: boolean): SxProps<Theme> => ({
  fontSize: isMobile ? 10 : 12,
});

export const timeGridEventIconSx = (isMobile: boolean): SxProps<Theme> => ({
  fontSize: isMobile ? 14 : 16,
});

export const timeGridReminderIconSx = (isMobile: boolean): SxProps<Theme> => ({
  fontSize: isMobile ? 12 : 14,
});

export const monthEventChipSx = (
  colors: EventColors,
  isMobile: boolean,
): SxProps<Theme> => ({
  justifyContent: "flex-start",
  bgcolor: (theme) => theme.custom.fills.navButton,
  color: colors.text,
  border: "1px solid",
  borderColor: (theme) => theme.custom.borders.subtle,
  height: isMobile ? 24 : 28,
  borderRadius: 1,
  mb: 0.5,
  backdropFilter: (theme) => theme.custom.glass.surface.blur,

  "& .MuiChip-label": {
    px: 1,
    pl: 2.5,
    fontSize: isMobile ? 12 : 15,
    position: "relative",

    "&::before": {
      content: '""',
      position: "absolute",
      left: 8,
      top: "50%",
      transform: "translateY(-50%)",
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: colors.border,
      boxShadow: `0 0 0 4px ${colors.background}`,
    },
  },
});

export const eventDialogBackdropSx: SxProps<Theme> = (theme) => ({
  backdropFilter: theme.custom.glass.overlay.blur,
  backgroundColor: theme.custom.glass.overlay.background,
});

export const eventDialogPaperSx =
  (isMobile: boolean): ThemeSx =>
  (theme) => ({
    borderRadius: isMobile ? 0 : "10px",
    border: `1px solid ${theme.custom.glass.toolbar.border}`,
    background: theme.custom.glass.menu.background,
    backdropFilter: theme.custom.glass.surface.blur,
    boxShadow: theme.custom.shadows.strong,
    overflow: "hidden",
  });

export const eventDialogTitleSx: SxProps<Theme> = {
  px: { xs: 2.5, sm: 3 },
  pt: { xs: 2.5, sm: 3 },
  pb: 1,
};

export const eventDialogHeaderStackSpacing = 0.75;

export const eventDialogIconBadgeSx: SxProps<Theme> = (theme) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  height: 40,
  borderRadius: "10px",
  background: theme.custom.gradients.dialogAccent,
  color: theme.custom.text.accent,
});

export const eventDialogHeaderIconSx: SxProps<Theme> = {
  fontSize: 20,
};

export const eventDialogTitleTextSx: SxProps<Theme> = (theme) => ({
  display: "block",
  fontSize: { xs: "1.35rem", sm: "1.55rem" },
  fontWeight: 700,
  letterSpacing: "-0.03em",
  color: theme.custom.text.hero,
});

export const eventDialogContentSx: SxProps<Theme> = {
  px: { xs: 2.5, sm: 3 },
  pb: 0,
};

export const eventDialogFormSx = (isMobile: boolean): SxProps<Theme> => ({
  mt: 1,
  py: isMobile ? 0.5 : 0.5,
});

export const eventDialogFieldSx: SxProps<Theme> = (theme) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    background: theme.custom.glass.input.background,
    boxShadow: theme.custom.glass.input.shadow,

    "& fieldset": {
      borderColor: theme.custom.glass.input.border,
    },

    "&:hover fieldset": {
      borderColor: theme.custom.glass.input.hoverBorder,
    },

    "&.Mui-focused fieldset": {
      borderColor: theme.custom.glass.input.focusBorder,
    },
  },

  "& .MuiInputLabel-root": {
    color: theme.palette.text.secondary,
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: theme.custom.text.accent,
  },
});

export const eventDialogTypeMenuItemSx =
  (colors: EventColors): SxProps<Theme> =>
  (theme) => ({
    bgcolor: colors.background,
    color: colors.text,
    borderLeft: `4px solid ${colors.border}`,
    my: 0.25,
    borderRadius: "10px",
    boxShadow: theme.custom.shadows.insetSoft,

    "&.Mui-selected": {
      bgcolor: colors.background,
      color: colors.text,
    },

    "&.Mui-selected:hover": {
      bgcolor: colors.background,
      filter: "brightness(0.98)",
    },

    "&:hover": {
      bgcolor: colors.background,
      filter: "brightness(0.985)",
    },
  });

export const eventDialogTypeMenuItemContentSx: SxProps<Theme> = {
  display: "inline-flex",
  alignItems: "center",
  gap: 1,
};

export const eventDialogTypeMenuItemIconSx = (
  color: string,
): SxProps<Theme> => ({
  fontSize: 18,
  color,
});

export const eventDialogTimeZoneMenuItemSx: SxProps<Theme> = {
  borderRadius: "10px",
  my: 0.25,
};

export const eventDialogDateRowDirection = {
  xs: "column",
  sm: "row",
} as const;

export const eventDialogOptionsBoxSx: SxProps<Theme> = (theme) => ({
  p: 1.5,
  borderRadius: "10px",
  background: theme.custom.fills.sectionSoft,
  border: `1px solid ${theme.custom.borders.subtle}`,
});

export const eventDialogOptionsStackSpacing = 1.25;

export const eventDialogFormControlLabelSx: SxProps<Theme> = (theme) => ({
  m: 0,

  "& .MuiFormControlLabel-label": {
    color: theme.palette.text.primary,
    fontWeight: 600,
  },
});

export const eventDialogActionsSx: SxProps<Theme> = (theme) => ({
  px: { xs: 2.5, sm: 3 },
  py: { xs: 2.5, sm: 2.5 },
  flexDirection: { xs: "column", sm: "row" },
  alignItems: "stretch",
  gap: 1.25,
  borderTop: `1px solid ${theme.custom.borders.subtle}`,
});

export const eventDialogSecondaryButtonSx: SxProps<Theme> = (theme) => ({
  minHeight: 44,
  px: 2,
  borderRadius: "10px",
  color: theme.palette.text.primary,
  borderColor: theme.custom.borders.default,
  background: theme.custom.fills.navButton,
});

export const eventDialogPrimaryButtonSx: SxProps<Theme> = (theme) => ({
  minHeight: 44,
  px: 2.5,
  borderRadius: "10px",
  background: theme.custom.gradients.primaryAction,
  color: theme.palette.primary.contrastText,
  boxShadow: theme.custom.shadows.strong,

  "&.Mui-disabled": {
    color: theme.palette.primary.contrastText,
  },
});

export const eventDialogDangerButtonSx: SxProps<Theme> = (theme) => ({
  minHeight: 44,
  px: 2,
  borderRadius: "10px",
  color: theme.palette.error.dark,
  borderColor: theme.custom.borders.danger,
  background: theme.palette.error.light,
});

export const eventDialogDeleteConfirmPaperSx: SxProps<Theme> = (theme) => ({
  borderRadius: "10px",
  border: `1px solid ${theme.custom.borders.danger}`,
  background: theme.custom.gradients.dangerSurface,
  boxShadow: theme.custom.shadows.strong,
});

export const eventDialogDeleteConfirmTitleSx: SxProps<Theme> = (theme) => ({
  px: 3,
  pt: 3,
  pb: 1.25,
  color: theme.palette.error.contrastText,
  fontWeight: 700,
});

export const eventDialogDeleteConfirmContentSx: SxProps<Theme> = {
  px: 3,
};

export const eventDialogDeleteConfirmAlertSx: SxProps<Theme> = (theme) => ({
  borderRadius: "10px",
  bgcolor: theme.custom.alerts.warning.background,
  color: theme.custom.alerts.warning.text,
  border: `1px solid ${theme.custom.alerts.warning.border}`,
});

export const eventDialogDeleteConfirmActionsSx: SxProps<Theme> = {
  px: 3,
  py: 2.5,
  flexDirection: { xs: "column", sm: "row" },
  alignItems: "stretch",
  gap: 1.25,
};

export const eventDialogDeleteConfirmButtonSx: SxProps<Theme> = (theme) => ({
  ...eventDialogDangerButtonSx(theme),
  color: theme.palette.error.contrastText,
  background: theme.custom.gradients.dangerAction,
});

export const eventDialogSuggestedTimeButtonSx =
  (isMobile: boolean): ThemeSx =>
  (theme) => ({
    border: `1px solid ${theme.custom.borders.strong}`,
    px: 1.25,
    py: 0.25,
    borderRadius: "6px",
    fontSize: isMobile ? 11 : 12,
  });
