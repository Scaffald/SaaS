/**
 * Web font loading is handled by CSS `@font-face` in GlobalWebStyles, pointing
 * at self-hosted WOFF2 files in `public/fonts`.
 *
 * Two reasons not to use expo-font here:
 *  - it registers TTFs, which are ~2.6x the transfer size of WOFF2;
 *  - it loads them from JS after hydration, so the server-rendered text paints
 *    in a fallback face and visibly reflows. `font-display: swap` on a
 *    preloaded WOFF2 avoids the reflow.
 *
 * Returning `true` immediately means the layout never gates render on fonts.
 */
export function useAppFonts(): [boolean] {
  return [true]
}
