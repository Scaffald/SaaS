import type { ReactNode } from 'react'

export type MarketingHeadingProps = {
  /** Semantic heading level. Renders a real h1/h2/h3 on web. */
  level: 1 | 2 | 3
  children: ReactNode
  color?: string
  align?: 'left' | 'center' | 'right'
  /** Typography (size, lineHeight, letterSpacing, spacing) is caller-owned. */
  style?: Record<string, unknown>
}
