/**
 * Typography components
 *
 * Export all typography components and types.
 * These replace Tamagui's H1-H6, Paragraph, and SizableText.
 */

// Main components
export { Heading, H1, H2, H3, H4, H5, H6 } from './Heading'
export { Paragraph } from './Paragraph'
export { Label } from './Label'
export { Text } from './Text'
export { Caption } from './Caption'

// Types
export type {
  HeadingProps,
  HeadingLevel,
  H1Props,
  H2Props,
  H3Props,
  H4Props,
  H5Props,
  H6Props,
  ParagraphProps,
  LabelProps,
  TextProps,
  CaptionProps,
  TextSize,
  TextWeight,
  TextColor,
  TextAlign,
  BaseTextProps,
} from './Typography.types'
