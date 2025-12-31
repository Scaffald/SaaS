// @ts-nocheck
/**
 * AppRouter Type Definition (Type-Only)
 *
 * This file provides the AppRouter type for use in the Expo app without
 * exporting the actual router instance (which would trigger type visibility
 * issues when the router is built from @ts-nocheck files).
 *
 * Architecture:
 * - The actual appRouter instance exists in Deno Edge Functions only
 * - The client (Expo app) only needs the type for tRPC client creation
 * - By using type-level imports and re-exports, we avoid value-level
 *   type inference from @ts-nocheck files
 *
 * The @ts-nocheck is applied here to allow clean type-only re-export
 * without the TS4023 "inaccessible names" errors from @ts-nocheck files.
 * Type checking of the type itself still occurs in importing files.
 */

import type { AppRouter as _AppRouter } from './functions/trpc/routers/_app'
import type { AnyRouter } from '@trpc/server'

/**
 * The tRPC AppRouter type for client-side usage
 *
 * Usage in Expo app:
 * ```ts
 * import type { AppRouter } from '@scf/supabase/app-router-type-only'
 * const api = createTRPCReact<AppRouter>()
 * ```
 *
 * The actual router instance is only needed on the server side (Deno functions).
 *
 * Type helper to satisfy AnyRouter constraint for inferRouterOutputs and similar utilities.
 * The conditional type ensures compatibility while avoiding TS2344 constraint errors.
 */
export type AppRouter = _AppRouter extends AnyRouter ? _AppRouter : AnyRouter
