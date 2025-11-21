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
 */

// Import the actual AppRouter type from the router implementation
// Using type-only import to avoid Deno runtime code
import type { AppRouter as _AppRouter } from "./functions/trpc/routers/_app.ts";

// Re-export for client use
export type AppRouter = _AppRouter;
