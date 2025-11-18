import { t } from "../middleware.ts";
import { applicationsRouter } from "./applications.router.ts";
import { authRouter } from "./auth.router.ts";
import { cmsRouter } from "./cms.router.ts";
import { employersRouter } from "./employers.router.ts";
import { backgroundChecksRouter } from "./background-checks.router.ts";
import { jobsRouter } from "./jobs.router.ts";
import { officeRouter } from "./office.router.ts";
import { onetRouter } from "./onet.router.ts";
import { organizationsRouter } from "./organizations.router.ts";
import { prerequisitesRouter } from "./prerequisites.router.ts";
import { profileRouter } from "./profile/index.ts";
import { profileWizardRouter } from "./profile/profileWizard.router.ts";
import { reviewsRouter } from "./reviews.router.ts";
import { userProfileRouter } from "./user-profile.router.ts";
import { workersRouter } from "./workers.router.ts";
import { mapRouter } from "./map.router.ts";
import { notificationsRouter } from "./notifications.router.ts";
import { portfolioRouter } from "./portfolio.router.ts";
import { personalityAssessmentRouter } from "./personality-assessment.router.ts";
import { resumeRouter } from "./resume.router.ts";
import { feedbackRouter } from "./feedback.router.ts";
import { workLogsRouter } from "./work-logs.router.ts";
import { teamsRouter } from "./teams.router.ts";
import { projectsRouter } from "./projects.router.ts";
import { sitesRouter } from "./sites.router.ts";
import { addressesRouter } from "./addresses.router.ts";
import { newsRouter } from "./news.router.ts";
import { inquiriesRouter } from "./inquiries.router.ts";
import { stripeSettingsRouter } from "./stripe-settings.router.ts";
import { successFeesRouter } from "./success-fees.router.ts";
import { idVerificationRouter } from "./id-verification.router.ts";
import { paymentsRouter } from "./payments.router.ts";
import { legalAgreementsRouter } from "./legal-agreements.router.ts";

/**
 * Main application router
 * Merges all feature routers into a single tRPC router
 */
export const appRouter = t.router({
  profile: profileRouter,
  profileWizard: profileWizardRouter,
  auth: authRouter,
  cms: cmsRouter,
  office: officeRouter,
  jobs: jobsRouter,
  applications: applicationsRouter,
  employers: employersRouter,
  organizations: organizationsRouter,
  workers: workersRouter,
  userProfile: userProfileRouter,
  reviews: reviewsRouter,
  prerequisites: prerequisitesRouter,
  onet: onetRouter,
  map: mapRouter,
  notifications: notificationsRouter,
  portfolio: portfolioRouter,
  personalityAssessment: personalityAssessmentRouter,
  resume: resumeRouter,
  feedback: feedbackRouter,
  backgroundChecks: backgroundChecksRouter,
  workLogs: workLogsRouter,
  teams: teamsRouter,
  projects: projectsRouter,
  sites: sitesRouter,
  addresses: addressesRouter,
  news: newsRouter,
  inquiries: inquiriesRouter,
  stripeSettings: stripeSettingsRouter,
  successFees: successFeesRouter,
  idVerification: idVerificationRouter,
  payments: paymentsRouter,
  legalAgreements: legalAgreementsRouter,
});

// Export the router type for client-side usage
export type AppRouter = typeof appRouter;
