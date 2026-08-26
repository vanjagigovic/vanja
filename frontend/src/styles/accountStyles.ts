import type { SxProps, Theme } from "@mui/material";

export const accountMenuButtonSx: SxProps<Theme> = (theme) => ({
  width: 44,
  height: 44,
  borderRadius: "10px",
  color: theme.custom.text.accent,
  bgcolor: theme.custom.fills.navButton,
  border: `1px solid ${theme.custom.borders.subtle}`,
  boxShadow: theme.custom.shadows.medium,
  "&:hover": {
    bgcolor: theme.custom.fills.selectedSoft,
    boxShadow: theme.custom.shadows.strong,
  },
  "&:focus-visible": {
    boxShadow: theme.custom.shadows.focusRingStrong,
  },
});

export const accountAvatarSx: SxProps<Theme> = (theme) => ({
  width: 30,
  height: 30,
  bgcolor: theme.custom.fills.transparent,
  color: "inherit",
});

export const accountMenuSx: SxProps<Theme> = (theme) => ({
  "& .MuiPaper-root": {
    borderRadius: "10px",
    border: `1px solid ${theme.custom.glass.menu.border}`,
    background: theme.custom.glass.menu.background,
    boxShadow: theme.custom.glass.menu.shadow,
  },
});

export const accountIdentityItemSx: SxProps<Theme> = (theme) => ({
  color: theme.palette.text.secondary,
  cursor: "default",
  opacity: 1,
});
