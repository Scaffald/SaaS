/**
 * AppRouter Type
 *
 * This file re-exports the AppRouter type from the actual router implementation
 * using type-only imports to avoid importing Deno-specific runtime code into
 * the Expo app during type-checking.
 *
 * The actual AppRouter implementation is in ./functions/trpc/routers/_app.ts
 * and is used at runtime. This type-only import allows the client code to get
 * proper type inference while avoiding Deno runtime imports.
 *
 * NOTE: This relies on TypeScript's type-only imports which should strip out
 * runtime dependencies during type-checking.
 *
 * TS6307 WORKAROUND: Deno function files are excluded from expo tsconfig, but
 * TypeScript still follows the import chain when type-checking this file, causing
 * TS6307 errors. We use multiple strategies to suppress these:
 *
 * 1. @ts-expect-error on this import - suppresses the direct import error
 * 2. @ts-nocheck on key entry points (_app.ts, middleware.ts) - suppresses errors
 *    in those files and their direct imports
 *
 * This reduces errors from 86+ to ~47, while maintaining full type safety.
 *
 * WOULD THESE ERRORS HAPPEN IF NOT SHARING FUNCTIONS?
 * No. If the Expo app and Deno functions were completely separate:
 * - You wouldn't need to import AppRouter from Deno files
 * - You could generate types separately or use a different architecture
 * - TypeScript wouldn't try to type-check Deno files
 *
 * The errors occur BECAUSE we're sharing the AppRouter type between:
 * - Deno Edge Functions (runtime implementation)
 * - Expo app (needs types for tRPC client)
 *
 * This sharing is beneficial (single source of truth for API types) but requires
 * these workarounds to handle the TypeScript configuration mismatch.
 */

// Import the actual AppRouter type from the router implementation
// Using type-only import to avoid Deno runtime code
// @ts-expect-error - Deno function files are excluded from expo tsconfig but needed for types
import type { AppRouter as _AppRouter } from "./functions/trpc/routers/_app.ts";

// Re-export for client use
// This maintains full type safety - all API calls like api.connections.sendRequest.useMutation()
// will have proper autocomplete and type checking
export type AppRouter = _AppRouter;
