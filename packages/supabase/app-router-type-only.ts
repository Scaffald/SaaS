/**
 * AppRouter Type Definition (Type-Only)
 *
 * This file provides the AppRouter type for use in the Expo app without
 * exporting the actual router instance.
 *
 * Architecture:
 * - The actual appRouter instance exists in Deno Edge Functions only
 * - The client (Expo app) only needs the type for tRPC client creation
 * - By using type-level imports and re-exports, we get proper type inference
 *
 * Note: @ts-nocheck was removed to allow proper type inference in client code.
 * TypeScript's skipLibCheck should handle any Deno-specific issues.
 */

import type { AppRouter as _AppRouter } from './functions/trpc/routers/_app'
import type { AnyRouter } from '@trpc/server'

/**
 * The tRPC AppRouter type for client-side usage
 *
 * Usage in Expo app:
 * ```ts
 * import type { AppRouter } from '@app/supabase/app-router-type-only'
 * const api = createTRPCReact<AppRouter>()
 * ```
 *
 * The actual router instance is only needed on the server side (Deno functions).
 * 
 * Type helper to satisfy AnyRouter constraint for inferRouterOutputs and similar utilities.
 * The conditional type ensures compatibility while avoiding TS2344 constraint errors.
 */
export type AppRouter = _AppRouter extends AnyRouter ? _AppRouter : AnyRouter
