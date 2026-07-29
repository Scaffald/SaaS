import { SITE_ORIGIN } from './public-content-loader'

/**
 * Default social card. Absolute URL is required — relative paths are ignored by
 * every major unfurler (LinkedIn, Slack, Facebook, iMessage).
 *
 * Regenerate after brand changes:
 *   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless \
 *     --window-size=1200,630 --screenshot=apps/scaffald/public/og-image.png \
 *     file://<repo>/docs/assets/og-image.html
 */
export const OG_IMAGE = {
  url: `${SITE_ORIGIN}/og-image.png`,
  width: 1200,
  height: 630,
  alt: 'Scaffald — connecting skilled trade workers to great employers',
  type: 'image/png',
} as const
