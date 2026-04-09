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
      main: "#8B7CFF",
      light: "#E4DEFF",
      dark: "#6F5CF4",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#6CCBFF",
      light: "#E2F6FF",
      dark: "#47AEE6",
      contrastText: "#11324A",
    },
    background: { default: "#F7F6FF", paper: "#FFFFFF" },
    text: { primary: "#352F5F", secondary: "#7A739A" },
    divider: "#8B7CFF24",
    success: {
      main: "#7DCCB4",
      light: "#E6FAF2",
      dark: "#58AA91",
      contrastText: "#1E4A3C",
    },
    info: {
      main: "#6CCBFF",
      light: "#EAF7FF",
      dark: "#3EAEDD",
      contrastText: "#173B57",
    },
    error: {
      main: "#E38AB4",
      light: "#FDEBF4",
      dark: "#C06490",
      contrastText: "#5C2040",
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    h3: { fontWeight: 700, letterSpacing: "-0.04em" },
    h4: { fontWeight: 700, letterSpacing: "-0.03em" },
    h6: { fontWeight: 700, letterSpacing: "-0.02em" },
    button: { textTransform: "none", fontWeight: 700 },
  },
  custom: {
    layout: {
      pageBackground: "#F3F1FF",
      pageOverlayPrimary: "#C77DFF1A",
      pageOverlaySecondary: "#6CCBFF29",
    },
    glass: {
      toolbar: {
        background: "#FFFFFFB8",
        border: "#8B7CFF1F",
        shadow: "0 16px 40px #7864FF1A",
        blur: "blur(14px)",
      },
      surface: {
        background: "#FFFFFFCC",
        border: "#8B7CFF1A",
        shadow: "0 4px 20px #7864FF14",
        blur: "blur(12px)",
      },
      input: {
        background: "#FFFFFFD1",
        border: "#8B7CFF1F",
        hoverBorder: "#6CCBFF52",
        focusBorder: "#8B7CFF6B",
        shadow: "0 8px 18px #7864FF0F",
      },
      menu: {
        background: "linear-gradient(180deg, #FFFFFFF0 0%, #F6F3FFFA 100%)",
        border: "#8B7CFF24",
        shadow: "0 16px 36px #7864FF24",
        selectedBackground: "#8B7CFF1F",
        selectedHoverBackground: "#8B7CFF2E",
        hoverBackground: "#6CCBFF1A",
      },
      overlay: { background: "#655C9A38", blur: "blur(10px)" },
    },
    text: {
      hero: "#352F5F",
      muted: "#8C85AA",
      subtle: "#938BB3",
      accent: "#6F5CF4",
      accentStrong: "#5F4EF0",
    },
    borders: {
      subtle: "#8B7CFF14",
      default: "#8B7CFF1F",
      strong: "#8B7CFF47",
      accent: "#8B7CFF57",
      danger: "#E38AB42E",
    },
    fills: {
      navButton: "#FFFFFFBD",
      todayButton: "#FFFFFFC2",
      viewSwitcher: "#F5F2FFDB",
      selectedSoft: "#F1EDFFEF",
      focusBlock: "#C77DFF14",
      sectionSoft: "#F8F6FFEB",
      transparent: "#FFFFFF00",
    },
    gradients: {
      primaryAction: "linear-gradient(135deg, #8B7CFF 0%, #6CCBFF 100%)",
      activeToggle: "linear-gradient(135deg, #8B7CFF 0%, #C77DFF 100%)",
      selectedHeader: "linear-gradient(135deg, #8B7CFF2E 0%, #6CCBFF2E 100%)",
      selectedDaySurface:
        "linear-gradient(180deg, #EAE4FFF2 0%, #F3FAFFFA 100%)",
      hoverSurface: "linear-gradient(180deg, #FFFFFFFA 0%, #F5EFFFF5 100%)",
      dialogAccent: "linear-gradient(135deg, #8B7CFF29 0%, #6CCBFF33 100%)",
      dangerSurface: "linear-gradient(180deg, #FFFFFFF7 0%, #FDF4F8FA 100%)",
      dangerAction: "linear-gradient(135deg, #E38AB4 0%, #C06490 100%)",
    },
    shadows: {
      soft: "0 4px 18px #7864FF0F",
      medium: "0 8px 20px #7864FF14",
      strong: "0 12px 28px #8B7CFF38",
      insetSoft: "inset 0 1px 0 #FFFFFF99",
      focusRing: "0 0 0 3px #8B7CFF24",
      focusRingStrong: "0 0 0 3px #8B7CFF29",
    },
    alerts: {
      error: { background: "#F8ECF1", text: "#5E3650", border: "#E7C8D5" },
      info: { background: "#E3F0FF", text: "#1F4F84", border: "#BFD8F6" },
      success: { background: "#3D7EDB", text: "#F7FBFF" },
      warning: { background: "#FFF6FA", text: "#7A3656", border: "#F0C9D9" },
    },
    eventTypeColors: {
      work: { background: "#E7EEFF", text: "#26458A", border: "#8CA8F6" },
      school: { background: "#E6F7FF", text: "#1D5C85", border: "#6CCBFF" },
      travel: { background: "#EAF4FF", text: "#2B5C9A", border: "#8AB6FF" },
      gym: { background: "#E8FBF4", text: "#216A58", border: "#7DCCB4" },
      personal: { background: "#F4EAFF", text: "#6A3E92", border: "#C77DFF" },
      holiday: { background: "#FFF1E8", text: "#9A5A2F", border: "#FFB37A" },
      birthday: { background: "#FDEBF4", text: "#9A3F6A", border: "#E38AB4" },
      other: { background: "#F3F4F8", text: "#5E647A", border: "#B6BED3" },
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { backgroundColor: "#F7F6FF" } },
    },
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: "0 4px 20px #7864FF14", borderColor: "#8B7CFF1A" },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, boxShadow: "0 8px 22px #8B7CFF29" },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { backgroundColor: "#FFFFFFC7" } },
    },
  },
});
