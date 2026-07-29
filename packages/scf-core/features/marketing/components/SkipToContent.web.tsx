import { createElement } from 'react'

/**
 * Standard skip link: invisible until focused, so keyboard users can jump past
 * the nav instead of tabbing through it on every page. Styling lives in
 * `app/+html.tsx` (`.scaffald-skip-link`) — a `<style>` tag inside the
 * react-native-web tree breaks hydration.
 */
export function SkipToContent({ targetId }: { targetId: string }) {
  return createElement(
    'a',
    { href: `#${targetId}`, className: 'scaffald-skip-link' },
    'Skip to main content'
  )
}
