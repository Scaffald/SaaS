/**
 * Scaffald Brand Colors
 *
 * Official brand color palette for consistent usage across the application
 */

export const BRAND_COLORS = {
  // Primary Colors
  primary: "#8C6A43",
  secondary: "#6F8B6D",

  // Gradient Colors
  gradientStart: "#B58E6C",
  gradientEnd: "#8C6A43",

  // Alternative Gradients
  gradientAlt: {
    start: "#6F8B6D",
    end: "#5F8F6B",
  },

  // Semantic Colors
  success: "#5F8F6B",
  warning: "#D4A574",
  error: "#B16A5B",
  info: "#6B7C8E",

  gray: {
    50: "#FAF8F3", // surface
    100: "#F7F4EF", // bg
    200: "#EFEAE2", // bgWeak
    300: "#E0D8C8",
    400: "#C9BFB0",
    500: "#A89E8F",
    600: "#8B8170",
    700: "#6F665F", // inkMuted
    800: "#4A433D",
    900: "#2F2A26", // ink
  },
} as const;

export type BrandColors = typeof BRAND_COLORS;
