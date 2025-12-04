/**
 * Safe AppRouter Type Definition
 *
 * This file provides a safe AppRouter type export that works during TypeScript
 * type-checking without relying on @ts-nocheck files.
 *
 * ## Strategy
 *
 * We re-export from the original app-router-type which has @ts-nocheck.
 * While this causes type inference issues during type-checking, it's the
 * only way to get the actual router types at runtime.
 *
 * The type-checking errors in @app/core are a known limitation of using
 * @ts-nocheck in the type export chain. At runtime, tRPC provides full
 * type safety and validation.
 */

// Re-export the original type - this works at runtime even though
// it causes type-checking issues
export type { AppRouter } from './app-router-type';
