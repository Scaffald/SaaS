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
