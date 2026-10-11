import type { Config } from "tailwindcss";
import colors from "./colors.json" with { type: "json" };

const marketingColors = {
  surface: {
    base: colors.light["surface-base"],
    1: colors.light["surface-level-1"],
    2: colors.light["surface-level-2"],
    inverted: colors.light["surface-inverted"],
  },
  text: {
    high: colors.light["text-high-emphasis"],
    medium: colors.light["text-medium-emphasis"],
    low: colors.light["text-low-emphasis"],
    on: colors.light["text-on-color"],
  },
  action: {
    primary: colors.light["action-primary-default"],
    "primary-hover": colors.light["action-primary-hover"],
    "primary-pressed": colors.light["action-primary-pressed"],
    secondary: colors.light["action-secondary"],
    accent: colors.light["action-accent"],
  },
  feedback: {
    success: colors.light["feedback-success"],
    warning: colors.light["feedback-warning"],
    error: colors.light["feedback-error"],
    info: colors.light["feedback-info"],
  },
  chart: {
    1: colors.light["chart-1"],
    2: colors.light["chart-2"],
    3: colors.light["chart-3"],
    4: colors.light["chart-4"],
  },
};

export const partonTailwindTheme = marketingColors;

export default {
  theme: {
    extend: {
      colors: marketingColors,
      fontFamily: {
        display: ['"DM Sans"', '"Source Sans 3"', "system-ui", "sans-serif"],
        sans: ['"Source Sans 3"', '"DM Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
} satisfies Partial<Config>;
