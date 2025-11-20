/**
 * AppRouter Type Placeholder
 *
 * This file provides a type placeholder for the AppRouter to avoid
 * importing Deno-specific code from packages/supabase/functions/trpc/
 * into the Expo app during type-checking.
 *
 * The actual AppRouter implementation is in ./functions/trpc/index
 * and is used at runtime. This placeholder allows the client code
 * to compile without type errors.
 *
 * NOTE: If you get type errors about missing router methods, you may need
 * to regenerate types or check that your tRPC routers are properly exported.
 */

// Placeholder type that matches tRPC's AppRouter structure
// This allows the client code to compile without importing Deno-specific files
// The actual router implementation provides proper types at runtime
// biome-ignore lint/suspicious/noExplicitAny: Generic router type for cross-environment compatibility
export type AppRouter = any
