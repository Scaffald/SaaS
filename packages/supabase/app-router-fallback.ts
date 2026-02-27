/**
 * AppRouter Fallback Type
 *
 * When the real AppRouter type from Deno functions fails to resolve (e.g. due to
 * @ts-nocheck, excluded paths, or .ts extensions in imports), this fallback
 * provides a usable type so the tRPC client doesn't error with "collides with
 * built-in method" union types.
 *
 * Omit reserved tRPC React method names so ProtectedIntersection doesn't fail.
 */

import type { AnyRouter } from '@trpc/server'

export type AppRouter = Omit<
  AnyRouter,
  | 'useContext'
  | 'useUtils'
  | 'useDehydratedState'
  | 'Provider'
  | 'createClient'
  | 'withTRPC'
>
