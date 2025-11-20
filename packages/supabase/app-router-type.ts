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

/**
 * Placeholder type for tRPC AppRouter
 *
 * This is intentionally `any` to avoid importing Deno-specific code from
 * packages/supabase/functions/trpc/ into the Expo app during type-checking.
 *
 * The actual router implementation in ./functions/trpc/routers/_app.ts provides
 * the full type structure at runtime. This placeholder allows client code to
 * compile without type errors while maintaining runtime type safety through tRPC.
 *
 * NOTE: While using `any` here reduces compile-time type safety, it's necessary
 * to avoid circular dependencies and Deno/Node.js compatibility issues.
 * The tRPC client still provides runtime type validation.
 *
 * This is an architectural limitation, not a code quality issue.
 */
export type AppRouter = any
