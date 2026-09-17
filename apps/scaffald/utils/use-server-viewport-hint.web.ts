import { ServerDataLoaderContext } from 'expo-router/build/loaders/ServerDataLoaderContext'
import { use, useState } from 'react'
import { type ViewportClass, VIEWPORT_SNAPSHOTS } from './server-viewport'
import type { ServerViewport } from '@scaffald/ui'

/**
 * The viewport hint the current request's route loader produced, read from
 * wherever expo-router keeps loader data for the render in progress (#782).
 *
 * Route loaders are the only server-side code that sees the request, and
 * `useLoaderData()` only answers for the route that owns the loader. The root
 * layout needs the hint before any of that renders, so this reads the same two
 * places `useLoaderData` does — the `ServerDataLoaderContext` expo-router
 * provides around the whole tree on the server, and the
 * `__EXPO_ROUTER_LOADER_DATA__` global its inline script sets for the client's
 * hydration render — and takes the hint from whichever loader ran.
 *
 * Read once, in a state initialiser: the global is deleted on the first
 * loader invalidation in dev, and after hydration the store's measured width
 * is what `useResponsive` uses anyway, so the hint must not change under a
 * mounted tree.
 *
 * `expo-router/build/...` is not a public path. It is pinned by the SDK
 * version (56) and its shape is asserted below, so an upgrade that moves it
 * fails the typecheck rather than silently rendering desktop for everyone.
 */
type LoaderDataMap = Record<string, unknown> | null | undefined

function hintFrom(map: LoaderDataMap): ViewportClass | undefined {
  if (!map) return undefined
  for (const value of Object.values(map)) {
    const viewport = (value as { viewport?: unknown } | null)?.viewport
    if (viewport === 'phone' || viewport === 'tablet' || viewport === 'desktop') return viewport
  }
  return undefined
}

export function useServerViewportHint(): ServerViewport | undefined {
  const serverMap = use(ServerDataLoaderContext) as LoaderDataMap
  const [snapshot] = useState<ServerViewport | undefined>(() => {
    const clientMap =
      typeof window !== 'undefined'
        ? ((globalThis as { __EXPO_ROUTER_LOADER_DATA__?: LoaderDataMap })
            .__EXPO_ROUTER_LOADER_DATA__ ?? null)
        : null
    const hint = hintFrom(serverMap) ?? hintFrom(clientMap)
    return hint ? VIEWPORT_SNAPSHOTS[hint] : undefined
  })
  return snapshot
}
