import { describe, expect, it } from "vitest";

import { appTheme } from "../theme/theme";
import {
  eventDialogPaperSx,
  eventDialogSuggestedTimeButtonSx,
  monthEventChipSx,
  timeGridEventCardSx,
  timeGridEventIconSx,
  timeGridEventTextSx,
  timeGridEventTitleSx,
  timeGridReminderIconSx,
} from "./eventStyles";

const colors = {
  background: "#112233",
  text: "#fefefe",
  border: "#445566",
};

describe("event style behavior", () => {
  it("calculates event card position and normal height from event metrics", () => {
    const styles = timeGridEventCardSx(colors, 0.75, {
      startMinutes: 90,
      endMinutes: 150,
    }, 30, 40) as Record<string, unknown>;

    expect(styles.top).toBe("122px");
    expect(styles.height).toBe("76px");
    expect(styles.bgcolor).toBe(colors.background);
    expect(styles.color).toBe(colors.text);
    expect(styles.borderColor).toBe(colors.border);
  });

  it("keeps very short event cards at the minimum usable height", () => {
    const styles = timeGridEventCardSx(colors, 0.5, {
      startMinutes: 600,
      endMinutes: 610,
    }, 30, 40) as Record<string, unknown>;

    expect(styles.top).toBe("802px");
    expect(styles.height).toBe("24px");
  });

  it("uses compact typography and chip sizing on mobile", () => {
    expect(timeGridEventTitleSx(true)).toEqual({ fontSize: 11 });
    expect(timeGridEventTitleSx(false)).toEqual({ fontSize: 12 });
    expect(timeGridEventTextSx(true)).toEqual({ fontSize: 10 });
    expect(timeGridEventTextSx(false)).toEqual({ fontSize: 12 });
    expect(timeGridEventIconSx(true)).toEqual({ fontSize: 14 });
    expect(timeGridEventIconSx(false)).toEqual({ fontSize: 16 });
    expect(timeGridReminderIconSx(true)).toEqual({ fontSize: 12 });
    expect(timeGridReminderIconSx(false)).toEqual({ fontSize: 14 });

    const mobileChip = monthEventChipSx(colors, true) as Record<string, unknown>;
    const desktopChip = monthEventChipSx(colors, false) as Record<string, unknown>;
    expect(mobileChip.height).toBe(24);
    expect(desktopChip.height).toBe(28);
    expect((mobileChip["& .MuiChip-label"] as Record<string, unknown>).fontSize).toBe(12);
    expect((desktopChip["& .MuiChip-label"] as Record<string, unknown>).fontSize).toBe(15);
  });

  it("uses a fullscreen-friendly dialog radius on mobile", () => {
    const mobileStyles = eventDialogPaperSx(true)(appTheme) as Record<string, unknown>;
    const desktopStyles = eventDialogPaperSx(false)(appTheme) as Record<string, unknown>;

    expect(mobileStyles.borderRadius).toBe(0);
    expect(desktopStyles.borderRadius).toBe("10px");
  });

  it("uses a smaller suggested-time action label on mobile", () => {
    const mobileStyles = eventDialogSuggestedTimeButtonSx(true)(appTheme) as Record<string, unknown>;
    const desktopStyles = eventDialogSuggestedTimeButtonSx(false)(appTheme) as Record<string, unknown>;

    expect(mobileStyles.fontSize).toBe(11);
    expect(desktopStyles.fontSize).toBe(12);
  });
});
