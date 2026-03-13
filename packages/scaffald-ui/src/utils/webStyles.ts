import { Platform, type ViewStyle, type TextStyle } from 'react-native'

/**
 * Web-only CSS properties that are valid on web but absent from React Native's ViewStyle.
 *
 * IMPORTANT: This type intentionally excludes properties that already exist in RN's
 * ViewStyle/TextStyle (position, overflow, zIndex, fontWeight, textTransform) to avoid
 * intersection-narrowing issues. For those, use Platform.OS === 'web' guards with
 * `as ViewStyle` casts at the specific usage site.
 */
type WebOnlyCSSProperties = {
  outlineStyle?: string
  outlineWidth?: number
  outlineColor?: string
  transition?: string
  cursor?: string
  userSelect?: string
  overflowX?: 'auto' | 'scroll' | 'hidden' | 'visible'
  overflowY?: 'auto' | 'scroll' | 'hidden' | 'visible'
  whiteSpace?: string
  wordBreak?: string
  boxShadow?: string
  backdropFilter?: string
  WebkitBackdropFilter?: string
  animation?: string
  animationName?: string
  animationDuration?: string
  animationTimingFunction?: string
  animationIterationCount?: string | number
  textOverflow?: string
  listStyleType?: string
  background?: string
  scrollbarWidth?: string
  scrollbarColor?: string
  ':hover'?: Record<string, unknown>
}

/**
 * ViewStyle extended with web-only CSS properties.
 * Use for style objects that include web-specific props like cursor, transition, etc.
 *
 * For web-only values of shared RN properties (position: 'fixed', overflow: 'auto'),
 * use Platform.OS === 'web' guards and spread with `as ViewStyle`.
 */
export type WebViewStyle = ViewStyle & WebOnlyCSSProperties

/**
 * TextStyle extended with web-only CSS properties.
 */
export type WebTextStyle = TextStyle & WebOnlyCSSProperties

/**
 * Returns web-only styles on web, empty object on native.
 * Avoids `as any` casts for web CSS properties.
 *
 * For web-only values of overlapping RN properties (position: 'fixed', overflow: 'auto'),
 * this function also accepts those — they'll be cast to ViewStyle internally.
 *
 * @example
 * ```tsx
 * <View style={[styles.container, webStyle({ cursor: 'pointer', transition: 'opacity 0.2s' })]} />
 * <View style={[styles.base, webStyle({ position: 'fixed', overflow: 'auto' })]} />
 * ```
 */
export function webStyle(
  styles: WebOnlyCSSProperties & {
    position?: 'fixed' | 'sticky' | 'absolute' | 'relative' | 'static'
    overflow?: 'auto' | 'scroll' | 'hidden' | 'visible'
    zIndex?: string | number
    fontWeight?: string
    textTransform?: string
  }
): ViewStyle {
  if (Platform.OS === 'web') {
    return styles as ViewStyle
  }
  return {}
}
