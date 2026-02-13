import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

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
import backgroundChecksRouter from "./routes/background-checks.ts";
import inquiriesRouter from "./routes/inquiries.ts";
import workLogsRouter from "./routes/work-logs.ts";
import organizationsRouter from "./routes/organizations.ts";
import webhooksRouter from "./routes/webhooks.ts";
import reviewsRouter from "./routes/reviews.ts";
import projectsRouter from "./routes/projects.ts";
import employersRouter from "./routes/employers.ts";
import onetRouter from "./routes/onet.ts";
import workersRouter from "./routes/workers.ts";
import openapi from "./openapi.ts";
import { authMiddleware } from "./middleware/auth.ts";
import {
  rateLimitMiddleware,
  trackApiKeyUsage,
} from "./middleware/usage-tracker.ts";

const app = new Hono();

// Middleware
app.use(
  "*",
  cors({
    origin: "*", // TODO: Configure allowed origins
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: [
      "Content-Length",
      "X-Request-Id",
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
    ],
    maxAge: 600,
    credentials: true,
  }),
);
app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", authMiddleware); // Global auth middleware (handles both JWT and API keys)
app.use("*", rateLimitMiddleware); // Rate limit API key requests
app.use("*", trackApiKeyUsage); // Track API key usage

// Routes
app.route("/v1/jobs", jobsRouter);
app.route("/oauth", oauthRouter); // OAuth 2.0 authorization server
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
app.route("/v1/background-checks", backgroundChecksRouter); // Background checks
app.route("/v1/inquiries", inquiriesRouter); // User inquiries
app.route("/v1/work-logs", workLogsRouter); // Work logs
app.route("/v1/organizations", organizationsRouter); // Organizations
app.route("/v1/webhooks", webhooksRouter); // Webhooks
app.route("/reviews", reviewsRouter); // Reviews
app.route("/v1/projects", projectsRouter); // Projects
app.route("/v1/employers", employersRouter); // Employers
app.route("/v1/onet", onetRouter); // O*NET data
app.route("/v1/workers", workersRouter); // Workers discovery

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
