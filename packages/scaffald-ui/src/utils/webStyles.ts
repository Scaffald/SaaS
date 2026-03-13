import { Platform, type ViewStyle, type TextStyle } from 'react-native'

/**
 * Web-only CSS properties that are valid on web but absent from React Native's ViewStyle.
 * Extend this as new web-only props are needed.
 */
type WebOnlyCSSProperties = {
  position?: 'fixed' | 'sticky' | 'absolute' | 'relative' | 'static'
  outlineStyle?: string
  outlineWidth?: number
  outlineColor?: string
  transition?: string
  cursor?: string
  userSelect?: string
  overflow?: 'auto' | 'scroll' | 'hidden' | 'visible'
  overflowX?: 'auto' | 'scroll' | 'hidden' | 'visible'
  overflowY?: 'auto' | 'scroll' | 'hidden' | 'visible'
  textTransform?: string
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
  fontWeight?: string
  background?: string
  scrollbarWidth?: string
  scrollbarColor?: string
  zIndex?: string | number
  ':hover'?: Record<string, unknown>
}

/**
 * ViewStyle extended with web-only CSS properties.
 * Use for style objects that include web-specific props.
 */
export type WebViewStyle = ViewStyle & WebOnlyCSSProperties

/**
 * TextStyle extended with web-only CSS properties.
 * Use for text style objects that include web-specific props like fontWeight as string.
 */
export type WebTextStyle = TextStyle & WebOnlyCSSProperties

/**
 * Returns web-only styles on web, empty object on native.
 * Avoids `as any` casts for web CSS properties.
 *
 * @example
 * ```tsx
 * <View style={[styles.container, webStyle({ cursor: 'pointer', transition: 'opacity 0.2s' })]} />
 * ```
 */
export function webStyle(styles: WebOnlyCSSProperties): ViewStyle {
  if (Platform.OS === 'web') {
    return styles as ViewStyle
  }
  return {}
}
