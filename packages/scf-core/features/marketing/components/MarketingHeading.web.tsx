import { fontFamily } from '@scaffald/ui/tokens'
import { createElement } from 'react'
import type { MarketingHeadingProps } from './MarketingHeading.types'
import { brand } from '../theme'

/**
 * React treats a handful of CSS properties as unitless, so a numeric
 * `lineHeight: 46` becomes `line-height: 46` — a 46× multiplier — rather than
 * 46px. Callers write React Native styles, where the number means pixels, so
 * normalise before handing the style to the DOM.
 */
const UNITLESS_LENGTHS = ['lineHeight'] as const

function toDomStyle(style: Record<string, unknown> = {}): Record<string, unknown> {
  const out = { ...style }
  for (const key of UNITLESS_LENGTHS) {
    if (typeof out[key] === 'number') out[key] = `${out[key]}px`
  }
  return out
}

/**
 * Real `<h1>`–`<h3>` on web.
 *
 * react-native-web maps `accessibilityRole="header"` to `<h1>` unconditionally,
 * which left every marketing page with a flat pile of h1s. Emitting the DOM
 * element directly is the only way to express hierarchy for crawlers and
 * screen readers.
 */
export function MarketingHeading({
  level,
  children,
  color = brand.ink,
  align,
  style,
}: MarketingHeadingProps) {
  return createElement(
    `h${level}`,
    {
      style: {
        // The UA stylesheet gives headings their own size and margin;
        // marketing typography is set explicitly by the caller instead.
        margin: 0,
        fontFamily: fontFamily.sans,
        fontWeight: 700,
        color,
        // Explicit so headings don't inherit stray centering from an ancestor;
        // `start` rather than `left` to stay correct under RTL.
        textAlign: align ?? 'start',
        ...toDomStyle(style),
      },
    },
    children
  )
}
