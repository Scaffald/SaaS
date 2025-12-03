/**
 * Safe AppRouter Type Definition
 * 
 * This file provides a safe AppRouter type export that works during TypeScript
 * type-checking without relying on @ts-nocheck files.
 * 
 * ## Strategy
 * 
 * We use a manually defined type stub (app-router-stub.d.ts) that matches the
 * actual router structure. This allows TypeScript to properly type-check client
 * code without needing to parse the Deno Edge Function files.
 * 
 * At runtime, tRPC will use the actual router implementation from the server,
 * providing full type safety and validation.
 */

// Use the type stub for compile-time type checking
export type { AppRouter } from './app-router-stub';

