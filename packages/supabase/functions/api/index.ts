import { Hono } from "hono";

import jobsRouter from "./routes/jobs.ts";
import oauthRouter from "./routes/oauth.ts";
import applicationsRouter from "./routes/applications.ts";
import profilesRouter from "./routes/profiles.ts";
import apiKeysRouter from "./routes/api-keys.ts";
import authRouter from "./routes/auth.ts";
import industriesRouter from "./routes/industries.ts";
import prerequisitesRouter from "./routes/prerequisites.ts";
import teamsRouter from "./routes/teams.ts";
import connectionsRouter from "./routes/connections.ts";
import followsRouter from "./routes/follows.ts";
import engagementRouter from "./routes/engagement.ts";
import notificationsRouter from "./routes/notifications.ts";
import userProfilesRouter from "./routes/user-profiles.ts";
import skillsRouter from "./routes/skills.ts";
import experienceRouter from "./routes/experience.ts";
import employmentRouter from "./routes/employment.ts";
import educationRouter from "./routes/education.ts";
import certificationsRouter from "./routes/certifications.ts";
import portfolioRouter from "./routes/portfolio.ts";
import profileWidgetsRouter from "./routes/profile-widgets.ts";
import profileCompletionRouter from "./routes/profile-completion.ts";
import profileImportRouter from "./routes/profile-import.ts";
import profileViewsRouter from "./routes/profile-views.ts";
import symbolicateRouter from "./routes/symbolicate.ts";
import backgroundChecksRouter from "./routes/background-checks.ts";
import backgroundChecksAdminRouter from "./routes/background-checks-admin.ts";
import inquiriesRouter from "./routes/inquiries.ts";
import workLogsRouter from "./routes/work-logs.ts";
import organizationsRouter from "./routes/organizations.ts";
import webhooksRouter from "./routes/webhooks.ts";
import reviewsRouter from "./routes/reviews.ts";
import projectsRouter from "./routes/projects.ts";
import employersRouter from "./routes/employers.ts";
import onetRouter from "./routes/onet.ts";
import workersRouter from "./routes/workers.ts";
import personalityAssessmentRouter from "./routes/personality-assessment.ts";
import feedbackRouter from "./routes/feedback.ts";
import officeJobsRouter from "./routes/office-jobs.ts";
import officeOrganizationsRouter from "./routes/office-organizations.ts";
import officeStorageRouter from "./routes/office-storage.ts";
import officeUsersRouter from "./routes/office-users.ts";
import officeUniversitiesRouter from "./routes/office-universities.ts";
import officeCertificationsRouter from "./routes/office-certifications.ts";
import idVerificationRouter from "./routes/id-verification.ts";
import successFeesRouter from "./routes/success-fees.ts";
import stripeSettingsRouter from "./routes/stripe-settings.ts";
import newsRouter from "./routes/news.ts";
import documentsStorageRouter from "./routes/documents-storage.ts";
import legalAgreementsRouter from "./routes/legal-agreements.ts";
import notificationsAdminRouter from "./routes/notifications-admin.ts";
import accountDeletionRouter from "./routes/account-deletion.ts";
import mapRouter from "./routes/map.ts";
import resumeRouter from "./routes/resume.ts";
import profileWizardRouter from "./routes/profile-wizard.ts";
import oauthManagementRouter from "./routes/oauth-management.ts";
import organizationsExtendedRouter from "./routes/organizations-extended.ts";
import ccpaRouter from "./routes/ccpa.ts";
import paymentsRouter from "./routes/payments.ts";
import openapi from "./openapi.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { authMiddleware } from "./middleware/auth.ts";
import {
  rateLimitMiddleware,
  trackApiKeyUsage,
} from "./middleware/usage-tracker.ts";

const app = new Hono().basePath("/api");

// CORS middleware - handle preflight and add headers to all responses
app.use("*", async (c, next) => {
  if (c.req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  for (const [k, v] of Object.entries(corsHeaders)) {
    c.header(k, v);
  }
  await next();
});
app.use("*", async (c, next) => {
  console.log(`[API] ${c.req.method} ${c.req.url}`);
  await next();
});
app.use("*", authMiddleware); // Global auth middleware (handles both JWT and API keys)
app.use("*", rateLimitMiddleware); // Rate limit API key requests
app.use("*", trackApiKeyUsage); // Track API key usage

// Routes
app.route("/v1/jobs", jobsRouter);
app.route("/oauth", oauthRouter); // OAuth 2.0 authorization server
app.route("/v1/oauth", oauthManagementRouter); // OAuth app management
app.route("/v1/applications", applicationsRouter);
app.route("/v1/profiles", profilesRouter);
app.route("/v1/api-keys", apiKeysRouter); // API key management
app.route("/v1/auth", authRouter); // Authentication endpoints
app.route("/v1/industries", industriesRouter); // Industry lookup
app.route("/v1/prerequisites", prerequisitesRouter); // Prerequisites/onboarding
app.route("/v1/teams", teamsRouter); // Teams management
app.route("/v1/connections", connectionsRouter); // User connections/networking
app.route("/v1/follows", followsRouter); // User follows
app.route("/v1/engagement", engagementRouter); // Engagement tracking/analytics
app.route("/v1/notifications", notificationsRouter); // User notifications
app.route("/v1/user-profiles", userProfilesRouter); // User profile data
app.route("/v1/profiles/skills", skillsRouter); // Skills management (soft/hard/multi-taxonomy)
app.route("/v1/profiles/experience", experienceRouter); // Work experience
app.route("/v1/profiles/employment", employmentRouter); // Employment preferences
app.route("/v1/profiles/education", educationRouter); // Education history
app.route("/v1/profiles/certifications", certificationsRouter); // Professional certifications
app.route("/v1/profiles/portfolio", portfolioRouter); // Portfolio items
app.route("/v1/profiles/widgets", profileWidgetsRouter); // Profile widgets
app.route("/v1/profiles/completion", profileCompletionRouter); // Profile completion tracking
app.route("/v1/profiles/import", profileImportRouter); // Profile import
app.route("/v1/profile-views", profileViewsRouter); // Profile views tracking
app.route("/v1/symbolicate", symbolicateRouter); // Symbolicate stub (Expo/Metro; no-op)
app.route("/symbolicate", symbolicateRouter); // Same stub for clients that call /api/symbolicate
app.route("/v1/background-checks", backgroundChecksRouter);
app.route("/v1/background-checks/admin", backgroundChecksAdminRouter); // Background checks
app.route("/v1/inquiries", inquiriesRouter); // User inquiries
app.route("/v1/work-logs", workLogsRouter); // Work logs
app.route("/v1/organizations", organizationsRouter); // Organizations
app.route("/v1/organizations", organizationsExtendedRouter); // Organizations extended (invitations, folders, locations, audit log, etc.)
app.route("/v1/ccpa", ccpaRouter); // CCPA compliance
app.route("/v1/payments", paymentsRouter); // Payment analytics, transactions, payment methods, credits
app.route("/v1/webhooks", webhooksRouter); // Webhooks
app.route("/reviews", reviewsRouter); // Reviews
app.route("/v1/projects", projectsRouter); // Projects
app.route("/v1/employers", employersRouter); // Employers
app.route("/v1/onet", onetRouter); // O*NET data
app.route("/v1/workers", workersRouter); // Workers discovery
app.route("/v1/personality-assessment", personalityAssessmentRouter);
app.route("/v1/feedback", feedbackRouter); // User feedback (submit, upload-url)
app.route("/v1/office/jobs", officeJobsRouter); // Office jobs list (office role)
app.route("/v1/office/organizations", officeOrganizationsRouter); // Office organizations management (office role)
app.route("/v1/office/storage", officeStorageRouter); // Office storage analytics (office role)
app.route("/v1/office/users", officeUsersRouter); // Office users management (office role)
app.route("/v1/office/universities", officeUniversitiesRouter); // University catalog management (office role)
app.route("/v1/office/certifications", officeCertificationsRouter); // Certification catalog management (office role)
app.route("/v1/id-verification", idVerificationRouter); // ID verification (pricing, request, confirm, status, list, revoke)
app.route("/v1/success-fees", successFeesRouter); // Success fees (status, create, confirm-upfront)
app.route("/v1/stripe-settings", stripeSettingsRouter); // Stripe settings (office role)
app.route("/v1/news", newsRouter); // Cached news articles by industry
app.route("/v1/documents/storage-preference", documentsStorageRouter); // User document storage preference
app.route("/v1/legal-agreements", legalAgreementsRouter); // Legal agreements / violation reports (office)
app.route("/v1/notifications/admin", notificationsAdminRouter); // Notifications admin (office)
app.route("/v1/account-deletion", accountDeletionRouter); // Account deletion requests
app.route("/v1/map", mapRouter); // Map location counts and nearest results
app.route("/v1/resume", resumeRouter); // Resume upload, AI parsing, wizard state
app.route("/v1/profile-wizard", profileWizardRouter); // Profile wizard progress

// OpenAPI documentation
app.route("/", openapi);

// Health check
app.get("/health", (c) =>
  c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  }));

// 404 handler
app.notFound((c) => c.json({ error: "Not found" }, 404));

// Error handler
app.onError((err, c) => {
  console.error("API Error:", err);
  return c.json(
    {
      error: err.message || "Internal server error",
      ...(Deno.env.get("NODE_ENV") === "development" && { stack: err.stack }),
    },
    500,
  );
});

Deno.serve(app.fetch);
