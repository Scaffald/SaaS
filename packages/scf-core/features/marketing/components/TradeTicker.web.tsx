import { createElement } from 'react'
import { brand, layout } from '../theme'

/**
 * Scrolling strip of trade names under the hero.
 *
 * Raw DOM plus a CSS keyframe rather than Animated: the animation runs on the
 * compositor, costs no JS, and the markup is readable in the server-rendered
 * HTML. The keyframes (and the `prefers-reduced-motion` fallback, where this
 * degrades to a static wrapped list) live in `app/+html.tsx` — a `<style>` tag
 * inside the react-native-web tree breaks hydration.
 */
export function TradeTicker({ trades }: { trades: string[] }) {
  // Duplicated so the -50% translation loops seamlessly.
  const sequence = [...trades, ...trades]

  return createElement(
    'div',
    {
      style: {
        borderTop: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(2,45,56,0.5)',
        paddingTop: 16,
        paddingBottom: 16,
      },
    },
    createElement(
      'div',
      {
        className: 'scaffald-marquee-viewport',
        style: {
          overflow: 'hidden',
          maxWidth: layout.maxWidth,
          margin: '0 auto',
          paddingLeft: layout.gutter,
          paddingRight: layout.gutter,
        },
        // The list repeats purely for visual effect; one copy is enough for AT.
        'aria-label': `Trades on Scaffald: ${trades.join(', ')}`,
        role: 'img',
      },
      createElement(
        'div',
        { className: 'scaffald-marquee-track', 'aria-hidden': true },
        sequence.map((trade, i) =>
          createElement(
            'span',
            {
              key: `${trade}-${i}`,
              style: {
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                paddingLeft: 12,
                paddingRight: 12,
                fontSize: 14,
                fontWeight: 500,
                color: brand.tealSoft,
              },
            },
            createElement('span', { style: { color: brand.teal } }, '•'),
            trade
          )
        )
      )
    )
  )
}
