import type { SxProps, Theme } from '@mui/material';

export const errorAlertSx: SxProps<Theme> = (theme) => ({
  bgcolor: theme.custom.alerts.error.background,
  color: theme.custom.alerts.error.text,
  border: `1px solid ${theme.custom.alerts.error.border}`,
});

export const infoAlertSx: SxProps<Theme> = (theme) => ({
  bgcolor: theme.custom.alerts.info.background,
  color: theme.custom.alerts.info.text,
  border: `1px solid ${theme.custom.alerts.info.border}`,
});

export const successSnackbarAlertSx: SxProps<Theme> = (theme) => ({
  width: '100%',
  bgcolor: theme.custom.alerts.success.background,
  color: theme.custom.alerts.success.text,
});