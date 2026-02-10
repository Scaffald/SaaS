/**
 * Typography component types
 *
 * Provides type definitions for Heading, Paragraph, Label, and Text components
 * for Heading, Paragraph, Label, and Text.
 */

import type { TextProps as RNTextProps, TextStyle } from 'react-native'

/**
 * Heading level type - H1 through H6
 */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

/**
 * Text alignment options
 */
export type TextAlign = 'auto' | 'left' | 'right' | 'center' | 'justify'

/**
 * Text color semantic options
 */
export type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'disabled'
  | 'error'
  | 'success'
  | 'warning'
  | 'inherit'
  | string

/**
 * Text size options
 */
export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

/**
 * Text weight options
 */
export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold'

/**
 * Base text props shared by all typography components
 */
export interface BaseTextProps extends Omit<RNTextProps, 'style'> {
  /** Text color - semantic name or custom color string */
  color?: TextColor
  /** Text alignment */
  align?: TextAlign
  /** Whether text should be selectable */
  selectable?: boolean
  /** Additional styles */
  style?: TextStyle
  /** Children content */
  children?: React.ReactNode
}

/**
 * Heading component props
 *
 * @example
 * // Default H1
 * <Heading level={1}>Page Title</Heading>
 *
 * // H3 with custom weight
 * <Heading level={3} weight="medium">Section Title</Heading>
 */
export interface HeadingProps extends BaseTextProps {
  /** Heading level 1-6 (determines semantic element and default size) */
  level: HeadingLevel
  /** Font weight override */
  weight?: TextWeight
  /** Use serif font family */
  serif?: boolean
}

/**
 * Individual heading level props (H1-H6)
 */
export interface H1Props extends Omit<HeadingProps, 'level'> {}
export interface H2Props extends Omit<HeadingProps, 'level'> {}
export interface H3Props extends Omit<HeadingProps, 'level'> {}
export interface H4Props extends Omit<HeadingProps, 'level'> {}
export interface H5Props extends Omit<HeadingProps, 'level'> {}
export interface H6Props extends Omit<HeadingProps, 'level'> {}

/**
 * Paragraph component props
 *
 * @example
 * // Default paragraph
 * <Paragraph>Body text content here.</Paragraph>
 *
 * // Large paragraph with medium weight
 * <Paragraph size="lg" weight="medium">Important text</Paragraph>
 */
export interface ParagraphProps extends BaseTextProps {
  /** Text size - xs, sm, md (default), lg, xl */
  size?: TextSize
  /** Font weight */
  weight?: TextWeight
  /** Use serif font family */
  serif?: boolean
}

/**
 * Label component props
 *
 * @example
 * // Form field label
 * <Label htmlFor="email">Email Address</Label>
 *
 * // Required label
 * <Label htmlFor="name" required>Full Name</Label>
 */
export interface LabelProps extends BaseTextProps {
  /** Associated form element ID (for web accessibility) */
  htmlFor?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Font weight */
  weight?: TextWeight
  /** Whether the field is required (shows asterisk) */
  required?: boolean
  /** Whether the label is disabled */
  disabled?: boolean
}

/**
 * Text component props - flexible text with size/weight variants
 * Flexible text with size/weight variants
 *
 * @example
 * // Small muted text
 * <Text size="sm" color="secondary">Helper text</Text>
 *
 * // Large bold text
 * <Text size="lg" weight="bold">Important</Text>
 */
export interface TextProps extends BaseTextProps {
  /** Font size - xs (12), sm (14), md (16), lg (18), xl (20), 2xl (22) */
  size?: TextSize
  /** Font weight */
  weight?: TextWeight
  /** Use serif font family */
  serif?: boolean
  /** Use monospace font family */
  mono?: boolean
}

/**
 * Caption component props - small helper/caption text
 *
 * @example
 * <Caption>Last updated 2 hours ago</Caption>
 */
export interface CaptionProps extends BaseTextProps {
  /** Font weight */
  weight?: TextWeight
}
