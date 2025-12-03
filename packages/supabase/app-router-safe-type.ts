/**
 * Safe AppRouter Type Definition
 * 
 * This file provides a type-safe AppRouter export that works correctly
 * during TypeScript type-checking without relying on @ts-nocheck files.
 * 
 * The key insight: TypeScript can handle type-only imports from @ts-nocheck files
 * when we import directly from the source WITHOUT going through a @ts-nocheck re-export.
 * 
 * This approach ensures:
 * 1. TypeScript can properly infer types during type-checking
 * 2. The actual router structure is available for type inference
 * 3. tRPC client generation works correctly
 */

// Import the router type directly from _app-impl.ts (which has @ts-nocheck)
// Using type-only import ensures we only get the type, not the value
// This works even though the source file has @ts-nocheck
import type { appRouter } from './functions/trpc/routers/_app-impl';

/**
 * Extract the type from the appRouter instance
 * This gives us the full router structure without relying on the
 * problematic re-export chain through app-router-type-only.ts
 */
export type AppRouter = typeof appRouter;

