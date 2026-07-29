import { createElement } from 'react'
import type { ReactNode } from 'react'

/**
 * Politely announces status changes (form submitting/sent/failed) to screen
 * readers. Visually hidden rather than `display: none`, which would stop it
 * being announced at all.
 */
export function LiveRegion({ children }: { children: ReactNode }) {
  return createElement(
    'div',
    {
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': true,
      style: {
        position: 'absolute',
        width: 1,
        height: 1,
        margin: -1,
        padding: 0,
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        whiteSpace: 'nowrap',
        border: 0,
      },
    },
    children
  )
}
