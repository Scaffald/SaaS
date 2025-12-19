// @ts-nocheck
/**
 * AppRouter implementation (Deno-specific, runtime-only)
 *
 * This file contains the actual router instance used at runtime in Deno Edge Functions.
 * It's marked with @ts-nocheck to suppress errors from ESM imports that are incompatible
 * with the Node.js/Expo environment.
 *
 * The type is separately exported from _app.ts to avoid TS4023 "inaccessible names" errors.
 */

import { t } from '../middleware';
import { accountDeletionRouter } from './account-deletion.router';
import { ccpaRouter } from './ccpa.router';
import { addressesRouter } from './addresses.router';
import { documentsRouter } from './documents.router';
import { applicationsRouter } from './applications.router';
import { authRouter } from './auth.router';
import { backgroundChecksRouter } from './background-checks.router';
import { cmsRouter } from './cms.router';
import { connectionsRouter } from './connections.router';
import { employersRouter } from './employers.router';
import { engagementRouter } from './engagement.router';
import { feedbackRouter } from './feedback.router';
import { followsRouter } from './follows.router';
import { idVerificationRouter } from './id-verification.router';
import { inquiriesRouter } from './inquiries.router';
import { jobsRouter } from './jobs.router';
import { legalAgreementsRouter } from './legal-agreements.router';
import { mapRouter } from './map.router';
import { newsRouter } from './news.router';
import { notificationsRouter } from './notifications.router';
import { officeRouter } from './office.router';
import { onetRouter } from './onet.router';
import { organizationsRouter } from './organizations.router';
import { paymentsRouter } from './payments.router';
import { personalityAssessmentRouter } from './personality-assessment.router';
import { portfolioRouter } from './portfolio.router';
import { prerequisitesRouter } from './prerequisites.router';
import { profileViewsRouter } from './profileViews.router';
import { profileRouter } from './profile/index';
import { profileWizardRouter } from './profile/profileWizard.router';
import { projectsRouter } from './projects.router';
import { resumeRouter } from './resume.router';
import { reviewsRouter } from './reviews.router';
import { sitesRouter } from './sites.router';
import { stripeSettingsRouter } from './stripe-settings.router';
import { successFeesRouter } from './success-fees.router';
import { teamsRouter } from './teams.router';
import { userProfileRouter } from './user-profile.router';
import { workLogsRouter } from './work-logs.router';
import { workersRouter } from './workers.router';
import { complianceRequirementsRouter, complianceDependenciesRouter } from './compliance/index';

/**
 * Main application router - merges all feature routers into a single tRPC router
 * Used at runtime in Deno Edge Functions
 */
export const appRouter = t.router({
  profile: profileRouter,
  profileWizard: profileWizardRouter,
  auth: authRouter,
  cms: cmsRouter,
  documents: documentsRouter,
  office: officeRouter,
  jobs: jobsRouter,
  applications: applicationsRouter,
  employers: employersRouter,
  engagement: engagementRouter,
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
  follows: followsRouter,
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
  accountDeletion: accountDeletionRouter,
  connections: connectionsRouter,
  profileViews: profileViewsRouter,
  // Compliance routers (REQ-2)
  complianceRequirements: complianceRequirementsRouter,
  complianceDependencies: complianceDependenciesRouter,
  // CCPA router (REQ-3)
  ccpa: ccpaRouter,
})
