import { Link } from 'expo-router'
import type { ReactNode } from 'react'
import type { StyleProp, TextStyle } from 'react-native'

export type MarketingLinkProps = {
  /** Route path, `#fragment`, or absolute URL. */
  href: string
  children: ReactNode
  style?: StyleProp<TextStyle>
  /** Open in a new tab (external destinations). */
  external?: boolean
  onPress?: () => void
  accessibilityLabel?: string
}

/**
 * Every navigable element on the marketing pages must go through this.
 *
 * expo-router's `Link` renders a real `<a href>` on web; a Pressable with
 * `router.push` renders a div, which crawlers cannot follow and which breaks
 * cmd-click, middle-click, "copy link address", and the status-bar preview.
 */
export function MarketingLink({
  href,
  children,
  style,
  external,
  onPress,
  accessibilityLabel,
}: MarketingLinkProps) {
  return (
    <Link
      href={href}
      style={style}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      {...(external ? { target: '_blank' as const, rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </Link>
  )
}
