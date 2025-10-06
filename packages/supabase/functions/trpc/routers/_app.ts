import { t } from "../middleware.ts";
import { authRouter } from "./auth.router.ts";
import { jobsRouter } from "./jobs.router.ts";
import { officeRouter } from "./office.router.ts";
import { profileRouter } from "./profile/index.ts";

/**
 * Main application router
 * Merges all feature routers into a single tRPC router
 */
export const appRouter = t.router({
  profile: profileRouter,
  auth: authRouter,
  office: officeRouter,
  jobs: jobsRouter,
});

// Export the router type for client-side usage
export type AppRouter = typeof appRouter;
