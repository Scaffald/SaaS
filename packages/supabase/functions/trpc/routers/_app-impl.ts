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

import { t } from '../middleware.ts'
import { accountDeletionRouter } from './account-deletion.router.ts'
import { apiKeysRouter } from './api-keys.router.ts'
import { ccpaRouter } from './ccpa.router.ts'
import { addressesRouter } from './addresses.router.ts'
import { documentsRouter } from './documents.router.ts'
import { applicationsRouter } from './applications.router.ts'
import { authRouter } from './auth.router.ts'
import { backgroundChecksRouter } from './background-checks.router.ts'
import { cmsRouter } from './cms.router.ts'
import { connectionsRouter } from './connections.router.ts'
import { employersRouter } from './employers.router.ts'
import { engagementRouter } from './engagement.router.ts'
import { feedbackRouter } from './feedback.router.ts'
import { followsRouter } from './follows.router.ts'
import { idVerificationRouter } from './id-verification.router.ts'
import { inquiriesRouter } from './inquiries.router.ts'
import { jobsRouter } from './jobs.router.ts'
import { legalAgreementsRouter } from './legal-agreements.router.ts'
import { mapRouter } from './map.router.ts'
import { newsRouter } from './news.router.ts'
import { notificationsRouter } from './notifications.router.ts'
import { officeRouter } from './office.router.ts'
import { onetRouter } from './onet.router.ts'
import { organizationsRouter } from './organizations.router.ts'
import { paymentsRouter } from './payments.router.ts'
import { personalityAssessmentRouter } from './personality-assessment.router.ts'
import { portfolioRouter } from './portfolio.router.ts'
import { prerequisitesRouter } from './prerequisites.router.ts'
import { profileViewsRouter } from './profileViews.router.ts'
import { profileRouter } from './profile/index.ts'
import { profileWizardRouter } from './profile/profileWizard.router.ts'
import { projectsRouter } from './projects.router.ts'
import { resumeRouter } from './resume.router.ts'
import { reviewsRouter } from './reviews.router.ts'
import { sitesRouter } from './sites.router.ts'
import { stripeSettingsRouter } from './stripe-settings.router.ts'
import { successFeesRouter } from './success-fees.router.ts'
import { teamsRouter } from './teams.router.ts'
import { userProfileRouter } from './user-profile.router.ts'
import { workLogsRouter } from './work-logs.router.ts'
import { workersRouter } from './workers.router.ts'
import { complianceRequirementsRouter, complianceDependenciesRouter } from './compliance/index.ts'
import { oauthRouter } from './oauth.router.ts'

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
  apiKeys: apiKeysRouter,
  connections: connectionsRouter,
  profileViews: profileViewsRouter,
  // Compliance routers (REQ-2)
  complianceRequirements: complianceRequirementsRouter,
  complianceDependencies: complianceDependenciesRouter,
  // CCPA router (REQ-3)
  ccpa: ccpaRouter,
  // OAuth router (REQ-10)
  oauth: oauthRouter,
})
