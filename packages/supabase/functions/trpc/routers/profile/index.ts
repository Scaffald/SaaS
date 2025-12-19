// @ts-nocheck
/**
 * Profile Router Type Definition and Re-export
 *
 * This file re-exports the profile router from _impl.ts.
 * The actual router instance is defined in _impl.ts with @ts-nocheck
 * to avoid type visibility issues when imported by other modules.
 *
 * Architecture:
 * - _impl.ts: Contains the actual profileRouter instance (@ts-nocheck)
 * - index.ts: Re-exports both value and type with @ts-nocheck
 * - This pattern avoids TS4023 "inaccessible names" errors
 *
 * The @ts-nocheck here is necessary because the router exports
 * types from @ts-nocheck files that TypeScript cannot properly name.
 */

// Re-export the actual router instance (used at runtime in Deno)
export { profileRouter } from './_impl';

// Re-export the router type for client-side usage
export type ProfileRouter = typeof import("./_impl.ts").profileRouter;
