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
 * NOTE: The router files and shared modules use @ts-nocheck to suppress
 * type-checking errors from Deno-specific ESM imports that are incompatible
 * with the Node.js/Expo environment. The types are still exported and usable
 * for tRPC client code.
 */

// Import the actual AppRouter type from the router implementation
// Using type-only import to avoid Deno runtime code
import type { AppRouter as _AppRouter } from "./functions/trpc/routers/_app.ts";

// Re-export for client use
// This maintains full type safety - all API calls like api.connections.sendRequest.useMutation()
// will have proper autocomplete and type checking
export type AppRouter = _AppRouter;
