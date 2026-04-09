import { createTheme } from "@mui/material/styles";
import type { EventType } from "../types/types";

declare module "@mui/material/styles" {
  interface Theme {
    custom: {
      layout: {
        pageBackground: string;
        pageOverlayPrimary: string;
        pageOverlaySecondary: string;
      };
      glass: {
        toolbar: {
          background: string;
          border: string;
          shadow: string;
          blur: string;
        };
        surface: {
          background: string;
          border: string;
          shadow: string;
          blur: string;
        };
        input: {
          background: string;
          border: string;
          hoverBorder: string;
          focusBorder: string;
          shadow: string;
        };
        menu: {
          background: string;
          border: string;
          shadow: string;
          selectedBackground: string;
          selectedHoverBackground: string;
          hoverBackground: string;
        };
        overlay: { background: string; blur: string };
      };
      text: {
        hero: string;
        muted: string;
        subtle: string;
        accent: string;
        accentStrong: string;
      };
      borders: {
        subtle: string;
        default: string;
        strong: string;
        accent: string;
        danger: string;
      };
      fills: {
        navButton: string;
        todayButton: string;
        viewSwitcher: string;
        selectedSoft: string;
        focusBlock: string;
        sectionSoft: string;
        transparent: string;
      };
      gradients: {
        primaryAction: string;
        activeToggle: string;
        selectedHeader: string;
        selectedDaySurface: string;
        hoverSurface: string;
        dialogAccent: string;
        dangerSurface: string;
        dangerAction: string;
      };
      shadows: {
        soft: string;
        medium: string;
        strong: string;
        insetSoft: string;
        focusRing: string;
        focusRingStrong: string;
      };
      alerts: {
        error: { background: string; text: string; border: string };
        info: { background: string; text: string; border: string };
        success: { background: string; text: string };
        warning: { background: string; text: string; border: string };
      };
      eventTypeColors: Record<
        EventType,
        { background: string; text: string; border: string }
      >;
    };
  }
  interface ThemeOptions {
    custom?: Theme["custom"];
  }
}

export const appTheme = createTheme({
  palette: {
    primary: {
      main: "#7C5CFF",
      light: "#E9E3FF",
      dark: "#5B3DF0",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#00D4FF",
      light: "#D9F8FF",
      dark: "#00A6CC",
      contrastText: "#06222B",
    },
    background: { default: "#F6F5FF", paper: "#FFFFFF" },
    text: { primary: "#2A2450", secondary: "#6B628F" },
    divider: "#7C5CFF33",

    success: {
      main: "#22C55E",
      light: "#DCFCE7",
      dark: "#15803D",
      contrastText: "#052E16",
    },
    info: {
      main: "#38BDF8",
      light: "#E0F2FE",
      dark: "#0284C7",
      contrastText: "#082F49",
    },
    error: {
      main: "#FB7185",
      light: "#FFE4E6",
      dark: "#E11D48",
      contrastText: "#4A0B1A",
    },
  },

  shape: { borderRadius: 12 },

  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    h3: { fontWeight: 800, letterSpacing: "-0.04em" },
    h4: { fontWeight: 800, letterSpacing: "-0.03em" },
    h6: { fontWeight: 800, letterSpacing: "-0.02em" },
    button: { textTransform: "none", fontWeight: 800 },
  },

  custom: {
    layout: {
      pageBackground: "#F3F0FF",
      pageOverlayPrimary: "#A855F71F",
      pageOverlaySecondary: "#00D4FF26",
    },

    glass: {
      toolbar: {
        background: "#FFFFFFCC",
        border: "#7C5CFF33",
        shadow: "0 18px 50px #7C5CFF26",
        blur: "blur(16px)",
      },
      surface: {
        background: "#FFFFFFE6",
        border: "#7C5CFF22",
        shadow: "0 10px 30px #7C5CFF1A",
        blur: "blur(14px)",
      },
      input: {
        background: "#FFFFFFF2",
        border: "#7C5CFF33",
        hoverBorder: "#00D4FF66",
        focusBorder: "#7C5CFFAA",
        shadow: "0 10px 24px #7C5CFF14",
      },
      menu: {
        background: "linear-gradient(180deg, #FFFFFF 0%, #F6F3FF 100%)",
        border: "#7C5CFF33",
        shadow: "0 20px 50px #7C5CFF22",
        selectedBackground: "#7C5CFF22",
        selectedHoverBackground: "#7C5CFF33",
        hoverBackground: "#00D4FF22",
      },
      overlay: { background: "#2A245088", blur: "blur(12px)" },
    },

    text: {
      hero: "#1F1A3D",
      muted: "#7A6FA8",
      subtle: "#9A90C7",
      accent: "#7C5CFF",
      accentStrong: "#5B3DF0",
    },

    borders: {
      subtle: "#7C5CFF1A",
      default: "#7C5CFF33",
      strong: "#7C5CFF66",
      accent: "#00D4FF66",
      danger: "#FB718533",
    },

    fills: {
      navButton: "#FFFFFFE6",
      todayButton: "#FFFFFFF2",
      viewSwitcher: "#EFE9FF",
      selectedSoft: "#E9E3FF",
      focusBlock: "#A855F71A",
      sectionSoft: "#F7F5FF",
      transparent: "#FFFFFF00",
    },

    gradients: {
      primaryAction: "linear-gradient(135deg, #7C5CFF 0%, #00D4FF 100%)",
      activeToggle: "linear-gradient(135deg, #A855F7 0%, #00D4FF 100%)",
      selectedHeader: "linear-gradient(135deg, #7C5CFF33 0%, #00D4FF33 100%)",
      selectedDaySurface:
        "linear-gradient(180deg, #EDE7FF 0%, #E6FAFF 100%)",
      hoverSurface:
        "linear-gradient(180deg, #FFFFFF 0%, #F0FBFF 100%)",
      dialogAccent:
        "linear-gradient(135deg, #A855F733 0%, #00D4FF33 100%)",
      dangerSurface:
        "linear-gradient(180deg, #FFF1F2 0%, #FFE4E6 100%)",
      dangerAction:
        "linear-gradient(135deg, #FB7185 0%, #E11D48 100%)",
    },

    shadows: {
      soft: "0 6px 20px #7C5CFF1A",
      medium: "0 12px 30px #7C5CFF22",
      strong: "0 18px 45px #7C5CFF33",
      insetSoft: "inset 0 1px 0 #FFFFFFCC",
      focusRing: "0 0 0 3px #00D4FF33",
      focusRingStrong: "0 0 0 4px #7C5CFF44",
    },

    alerts: {
      error: { background: "#FFE4E6", text: "#9F1239", border: "#FB7185" },
      info: { background: "#E0F2FE", text: "#075985", border: "#38BDF8" },
      success: { background: "#DCFCE7", text: "#166534" },
      warning: { background: "#FFF7ED", text: "#9A3412", border: "#FDBA74" },
    },

    eventTypeColors: {
      work: { background: "#E0E7FF", text: "#3730A3", border: "#818CF8" },
      school: { background: "#E0F2FE", text: "#075985", border: "#38BDF8" },
      travel: { background: "#DBEAFE", text: "#1E3A8A", border: "#60A5FA" },
      gym: { background: "#DCFCE7", text: "#166534", border: "#4ADE80" },
      personal: { background: "#F3E8FF", text: "#6B21A8", border: "#C084FC" },
      holiday: { background: "#FFEDD5", text: "#9A3412", border: "#FDBA74" },
      birthday: { background: "#FFE4E6", text: "#9F1239", border: "#FB7185" },
      other: { background: "#F1F5F9", text: "#334155", border: "#94A3B8" },
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { backgroundColor: "#F6F5FF" } },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 10px 30px #7C5CFF1A",
          borderColor: "#7C5CFF22",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 10px 28px #7C5CFF22",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFFF5",
        },
      },
    },
  },
});