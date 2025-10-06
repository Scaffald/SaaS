import { t } from "../middleware.ts";
import { authRouter } from "./auth.router.ts";
import { employersRouter } from "./employers.router.ts";
import { jobsRouter } from "./jobs.router.ts";
import { officeRouter } from "./office.router.ts";
import { profileRouter } from "./profile/index.ts";
import { reviewsRouter } from "./reviews.router.ts";
import { userProfileRouter } from "./user-profile.router.ts";
import { workersRouter } from "./workers.router.ts";

/**
 * Main application router
 * Merges all feature routers into a single tRPC router
 */
export const appRouter = t.router({
  profile: profileRouter,
  auth: authRouter,
  office: officeRouter,
  jobs: jobsRouter,
  employers: employersRouter,
  workers: workersRouter,
  userProfile: userProfileRouter,
  reviews: reviewsRouter,
});

// Export the router type for client-side usage
export type AppRouter = typeof appRouter;
