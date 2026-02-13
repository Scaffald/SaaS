/**
 * Card component types
 * Card is a container component for grouping related content
 */

import type { ReactNode } from "react";
import type { ImageStyle, StyleProp, ViewStyle } from "react-native";

/**
 * Card variant determines the visual style.
 * Use "surface" for form containers (elevated with shadow); same as elevated.
 */
export type CardVariant = "elevated" | "surface" | "outlined" | "filled";

/**
 * Card padding size
 */
export type CardPadding = "none" | "sm" | "md" | "lg" | "xl";

/**
 * Card border radius size
 */
export type CardRadius = "sm" | "md" | "lg" | "xl";

/**
 * Card elevation level (for elevated variant)
 */
export type CardElevation = "sm" | "md" | "lg";

/**
 * Card component props
 */
export interface CardProps {
  /** Card content */
  children: ReactNode;
  /** Visual variant */
  variant?: CardVariant;
  /** Internal padding */
  padding?: CardPadding;
  /** Border radius */
  radius?: CardRadius;
  /** Elevation level (only for 'elevated' variant) */
  elevation?: CardElevation;
  /** Whether the card is pressable/interactive */
  pressable?: boolean;
  /** Callback when card is pressed (requires pressable=true) */
  onPress?: () => void;
  /** Callback when press is released */
  onPressOut?: () => void;
  /** Callback when press starts */
  onPressIn?: () => void;
  /** Whether the card is disabled (only affects pressable cards) */
  disabled?: boolean;
  /** Additional styles */
  style?: StyleProp<ViewStyle>;
  /** Test ID for testing */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

/**
 * CardHeader component props
 */
export interface CardHeaderProps {
  /** Header content (optional when title/action provided) */
  children?: ReactNode;
  /** Title text (alternative to children) */
  title?: string;
  /** Subtitle text */
  subtitle?: string;
  /** Action element (e.g., button, icon) */
  action?: ReactNode;
  /** Additional styles */
  style?: StyleProp<ViewStyle>;
}

/**
 * CardContent component props
 */
export interface CardContentProps {
  /** Content */
  children: ReactNode;
  /** Additional padding adjustment */
  padding?: CardPadding;
  /** Additional styles */
  style?: StyleProp<ViewStyle>;
}

/**
 * CardFooter component props
 */
export interface CardFooterProps {
  /** Footer content */
  children: ReactNode;
  /** Horizontal alignment of footer content */
  align?: "left" | "center" | "right" | "space-between";
  /** Additional styles */
  style?: StyleProp<ViewStyle>;
}

/**
 * CardMedia component props (for images/media)
 */
export interface CardMediaProps {
  /** Image source URI */
  source: { uri: string } | number;
  /** Alt text for accessibility */
  alt?: string;
  /** Media height */
  height?: number;
  /** Position of media within card */
  position?: "top" | "bottom";
  /** Additional styles */
  style?: StyleProp<ImageStyle>;
}
