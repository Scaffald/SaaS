/**
 * tRPC Router Types Export
 * This file provides the AppRouter type for client-side usage
 *
 * Note: This is imported from the functions directory only for type extraction.
 * The actual implementation runs in Deno edge functions.
 */

// Import type only to avoid pulling in Deno-specific runtime code
import type { AppRouter } from "./functions/trpc/index";

// Re-export for client usage
export type { AppRouter };
