/**
 * Card component styles
 * Style factory functions for card components
 */

import type { ImageStyle, ViewStyle } from "react-native";
import { Platform } from "react-native";
import { colors } from "../../tokens/colors";
import { spacing } from "../../tokens/spacing";
import { borderRadius } from "../../tokens/borders";
import { boxShadows, shadows } from "../../tokens/shadows";
import type {
  CardElevation,
  CardPadding,
  CardRadius,
  CardVariant,
} from "./Card.types";
import type { ResolvedThemeMode } from "../../tokens/colors";

// ============================================================================
// Types
// ============================================================================

/** Shadow style properties for React Native */
interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface CardStyleConfig {
  container: ViewStyle;
  pressed?: ViewStyle;
  disabled?: ViewStyle;
}

export interface CardHeaderStyleConfig {
  header: ViewStyle;
  headerText: ViewStyle;
  subtitle: ViewStyle;
  headerAction: ViewStyle;
}

export interface CardContentStyleConfig {
  content: ViewStyle;
}

export interface CardFooterStyleConfig {
  footer: ViewStyle;
  footerInner: ViewStyle;
}

export interface CardMediaStyleConfig {
  media: ImageStyle;
}

// ============================================================================
// Constants
// ============================================================================

const PADDING_MAP: Record<CardPadding, number> = {
  none: 0,
  sm: spacing[8],
  md: spacing[12],
  lg: spacing[16],
  xl: spacing[24],
  '2xl': spacing[32],
};

const RADIUS_MAP: Record<CardRadius, number> = {
  sm: borderRadius.m,      // 6
  md: borderRadius.l,      // 8
  lg: borderRadius.xxl,    // 12
  xl: borderRadius.xxxl,   // 16
  '2xl': 20,               // modest large
  '3xl': borderRadius.xxxxl, // 24
};

const SHADOW_MAP: Record<CardElevation, ShadowStyle> = {
  sm: shadows.xs as ShadowStyle,
  md: shadows.s as ShadowStyle,
  lg: shadows.m as ShadowStyle,
  soft: shadows.soft as ShadowStyle,
};

const BOX_SHADOW_MAP: Record<CardElevation, string> = {
  sm: boxShadows.xs,
  md: boxShadows.s,
  lg: boxShadows.m,
  soft: boxShadows.soft,
};

// ============================================================================
// Style Factory Functions
// ============================================================================

/**
 * Get card styles based on variant, padding, radius, elevation, and state
 */
export function getCardStyles(
  variant: CardVariant,
  padding: CardPadding,
  radius: CardRadius,
  elevation: CardElevation,
  isPressed: boolean,
  disabled: boolean,
  theme: ResolvedThemeMode = 'light',
): CardStyleConfig {
  // Light: white card surface. Dark: bg.dark.muted (#2f2820) so inputs (bg.dark.subtle)
  // sit one shade darker — creating the inset effect the design requires.
  const baseBg = theme === 'dark' ? colors.bg.dark.muted : colors.bg.light.default
  const baseStyle: ViewStyle = {
    backgroundColor: baseBg,
    borderRadius: RADIUS_MAP[radius],
    padding: PADDING_MAP[padding],
    overflow: "hidden",
  };

  // Variant-specific styles (surface = elevated for form/auth use)
  let container: ViewStyle;
  switch (variant) {
    case "surface":
    case "elevated": {
      container = {
        ...baseStyle,
        // On web use boxShadow only to avoid "shadow* deprecated" console error
        ...(Platform.OS === "web"
          ? { boxShadow: BOX_SHADOW_MAP[elevation] }
          : SHADOW_MAP[elevation]),
      };
      break;
    }
    case "outlined":
      container = {
        ...baseStyle,
        borderWidth: 1,
        borderColor: colors.border[theme].default,
      };
      break;
    case "filled":
      container = {
        ...baseStyle,
        backgroundColor: colors.bg[theme].subtle,
      };
      break;
    case "glass":
      container = {
        ...baseStyle,
        backgroundColor: 'rgba(251, 248, 243, 0.82)', // neutral[50] warm @ 82%
        borderWidth: 1,
        borderColor: 'rgba(237, 221, 201, 0.55)', // neutral[300]-ish @ 55%
      };
      // Web-only: add backdrop blur
      if (Platform.OS === "web") {
        (container as Record<string, unknown>).backdropFilter = 'blur(14px)';
        (container as Record<string, unknown>).WebkitBackdropFilter = 'blur(14px)';
      }
      break;
    default:
      container = baseStyle;
  }

  // Pressed state
  const pressed: ViewStyle | undefined = isPressed && !disabled
    ? {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    }
    : undefined;

  // Disabled state
  const disabledStyle: ViewStyle | undefined = disabled
    ? {
      opacity: 0.6,
    }
    : undefined;

  return {
    container,
    pressed,
    disabled: disabledStyle,
  };
}

/**
 * Get card header styles
 */
export function getCardHeaderStyles(): CardHeaderStyleConfig {
  return {
    header: {
      padding: spacing[16],
      paddingBottom: spacing[8],
    },
    headerText: {
      flex: 1,
    },
    subtitle: {
      marginTop: spacing[4],
    },
    headerAction: {
      marginLeft: spacing[12],
    },
  };
}

/**
 * Get card content styles based on padding
 */
export function getCardContentStyles(
  padding: CardPadding,
): CardContentStyleConfig {
  return {
    content: {
      padding: PADDING_MAP[padding],
    },
  };
}

/**
 * Get card footer styles based on alignment
 */
export function getCardFooterStyles(
  align: "left" | "center" | "right" | "space-between",
): CardFooterStyleConfig {
  const alignMap: Record<string, ViewStyle["justifyContent"]> = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
    "space-between": "space-between",
  };

  return {
    footer: {
      padding: spacing[16],
      paddingTop: spacing[8],
      borderTopWidth: 1,
      borderTopColor: colors.border.light.subtle,
    },
    footerInner: {
      flexDirection: "row",
      justifyContent: alignMap[align],
      alignItems: "center",
      gap: spacing[8],
    },
  };
}

/**
 * Get card media styles based on height
 */
export function getCardMediaStyles(height: number): CardMediaStyleConfig {
  return {
    media: {
      width: "100%" as unknown as number, // 100% works on web, cast for RN types
      height,
    },
  };
}
