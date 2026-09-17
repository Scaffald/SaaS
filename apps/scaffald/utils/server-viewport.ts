import type { ServerViewport } from '@scaffald/ui'
import type { LoaderFunction } from 'expo-server'

/**
 * Which layout the server should render for a request (#782).
 *
 * `useResponsive` cannot measure a window on the server, so without a hint it
 * renders every page as a 1280px desktop — and a phone then re-lays out the
 * whole page at hydration (CLS ≈ 1) while React regenerates the tree because
 * its shape changed. The only server-side place that can see the request is a
 * route loader, so loaders return `viewport` from here and the root layout
 * hands it to `ServerViewportProvider`.
 *
 * Detection is deliberately coarse. `Sec-CH-UA-Mobile` is the honest signal
 * where Chromium sends it; the user-agent sniff is the fallback for everything
 * else. A wrong guess costs one re-layout — exactly what every visitor pays
 * today — so a guess is never worse than the default.
 */
export type ViewportClass = 'phone' | 'tablet' | 'desktop'

/** Snapshots per class, chosen to sit squarely inside a breakpoint band. */
export const VIEWPORT_SNAPSHOTS: Record<ViewportClass, ServerViewport> = {
  phone: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
  desktop: { width: 1280, height: 900 },
}

const PHONE_UA =
  /\b(iPhone|iPod|Android.+Mobile|Windows Phone|Mobile Safari|Opera Mini|BlackBerry|BB10)\b/i
const TABLET_UA = /\b(iPad|Android(?!.*Mobile)|Tablet|Silk|Kindle|PlayBook)\b/i
/** iPadOS 13+ reports itself as a Mac; the touch-point count is the tell, but only on the client. */

export function classifyViewport(
  headers: Headers | Record<string, string | undefined>
): ViewportClass {
  const get = (name: string): string | undefined =>
    headers instanceof Headers
      ? (headers.get(name) ?? undefined)
      : (headers[name] ?? headers[name.toLowerCase()])

  const chMobile = get('sec-ch-ua-mobile')
  if (chMobile === '?1') return 'phone'

  const ua = get('user-agent') ?? ''
  if (PHONE_UA.test(ua)) return 'phone'
  if (TABLET_UA.test(ua)) return 'tablet'
  return 'desktop'
}

/** What a loader returns so the root layout can pick the server snapshot. */
export type ViewportLoaderData = { viewport: ViewportClass }

/**
 * For routes with no data of their own: a loader whose only job is the hint.
 * Spread `viewportFromRequest(request)` into loaders that return other data.
 */
export const viewportFromRequest = (
  request: { headers: Headers } | undefined
): ViewportLoaderData => ({
  viewport: request ? classifyViewport(request.headers) : 'desktop',
})

export const viewportLoader: LoaderFunction<ViewportLoaderData> = (request) =>
  viewportFromRequest(request)
