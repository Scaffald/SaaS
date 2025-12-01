// @ts-nocheck
/**
 * AppRouter Type Definition
 *
 * This file exports only the type of the main application router.
 * The actual router instance is defined in _app-impl.ts to separate
 * type exports from value exports (avoiding TS4023 errors).
 *
 * Architecture:
 * - _app-impl.ts: Contains the actual appRouter instance (@ts-nocheck)
 * - _app.ts: Re-exports the type with @ts-nocheck to suppress TS4023 errors
 * - app-router-type-only.ts: Type-only re-export for Expo app imports
 *
 * The @ts-nocheck here is necessary because:
 * 1. We export a type derived from @ts-nocheck files (_app-impl.ts)
 * 2. TypeScript cannot properly name these types (TS4023 error)
 * 3. The app-router-type-only.ts wrapper uses type-only import to isolate the type
 */

import type { appRouter } from './_app-impl'

// Re-export the router type for client-side usage
// @ts-nocheck suppresses TS4023 "inaccessible names" error
export type AppRouter = typeof appRouter
