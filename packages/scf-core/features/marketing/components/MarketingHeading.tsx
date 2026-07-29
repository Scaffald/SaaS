import { Text } from '@scaffald/ui'
import type { TextStyle } from 'react-native'
import type { MarketingHeadingProps } from './MarketingHeading.types'
import { brand } from '../theme'

/**
 * Native fallback. Heading semantics on native are conveyed by the
 * accessibility role; see MarketingHeading.web.tsx for the DOM version that
 * emits a real h1/h2/h3.
 */
export function MarketingHeading({
  children,
  color = brand.ink,
  align,
  style,
}: MarketingHeadingProps) {
  return (
    <Text
      accessibilityRole="header"
      weight="bold"
      color={color}
      align={align}
      style={style as TextStyle}
    >
      {children}
    </Text>
  )
}
