# Scaffald Public REST API

Public REST API for third-party integrations, built with Hono framework on Deno.

## Architecture

**Hybrid Approach**: This REST API coexists with the existing tRPC API:

- **REST**: Public-facing endpoints for third-party integrations (this
  directory)
- **tRPC**: Internal admin tools and mobile app (continues to use existing tRPC
  routers)

## Directory Structure

```
api/
├── index.ts                 # Main entry point
├── deno.json               # Deno configuration and dependencies
├── middleware/
│   └── auth.ts             # Authentication middleware (shared with tRPC)
├── routes/
│   ├── jobs.ts            # Jobs API (Week 2)
│   ├── oauth.ts           # OAuth 2.0 server (Week 1)
│   ├── applications.ts    # Applications API (Week 3)
│   └── profiles.ts        # Public profiles API (Week 4)
└── openapi.ts             # OpenAPI/Swagger documentation
```

## Deployment

### Local Development

```bash
# From project root
cd packages/supabase/functions/api
deno run --allow-all --watch index.ts
```

### Supabase Edge Functions

```bash
# Deploy the API function
supabase functions deploy api

# Test locally
supabase functions serve api
```

## Endpoints

### Health Check

- `GET /health` - API health status

### Jobs API (Week 2) ✅

- `GET /v1/jobs` - List published jobs with filtering and pagination
  - Query params: status, limit, offset, organizationId, location,
    employmentType, remoteOption
  - Returns: paginated list of jobs with metadata
- `GET /v1/jobs/:id` - Get job details by ID
  - Returns: full job object
- `GET /v1/jobs/:id/similar` - Get similar jobs based on organization and
  employment type
  - Query params: limit (default: 5, max: 20)
  - Returns: array of similar jobs
- `GET /v1/jobs/filter-options` - Get available filter values
  - Returns: unique employment types, locations, and remote options

### Applications API (Week 3) ✅

- `POST /v1/applications` - Submit job application
  - Supports both quick and full applications
  - Validates job status and deadline
  - Prevents duplicate applications
  - Triggers `application.created` webhook
- `GET /v1/applications/:id` - Get application details
  - Users can only access their own applications
  - Returns full application data
- `PATCH /v1/applications/:id` - Update application
  - Only for pending/reviewing status
  - Triggers `application.updated` webhook
- `POST /v1/applications/:id/withdraw` - Withdraw application
  - Only for pending/reviewing/inquired status
  - Records withdrawal reason
  - Triggers `application.withdrawn` webhook

### Profiles API (Week 4) ✅

- `GET /v1/profiles/:username` - Public user profile
  - Returns username, bio, skills, certifications
  - Only shows public profiles
  - Rate limited: 100 requests per 15 minutes
- `GET /v1/profiles/organizations/:slug` - Organization profile
  - Returns organization details and job count
  - Only shows public organizations
  - Rate limited: 100 requests per 15 minutes
- `GET /v1/profiles/employers/:slug` - Employer profile
  - Returns employer details and active job count
  - Only shows active employers
  - Rate limited: 100 requests per 15 minutes

### OAuth 2.0 (Week 1)

- `GET /oauth/authorize` - Authorization endpoint
- `POST /oauth/token` - Token endpoint
- `POST /oauth/revoke` - Token revocation
- `POST /oauth/introspect` - Token introspection
- `GET /oauth/userinfo` - UserInfo endpoint

### Documentation

- `GET /` - Swagger UI
- `GET /openapi.json` - OpenAPI specification

## Authentication

All endpoints use Bearer token authentication:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://your-project.supabase.co/functions/v1/api/v1/jobs
```

OAuth integration endpoints are protected by OAuth 2.0 with PKCE.

## Implementation Progress

- [x] Week 1, Day 1: Foundation (Hono, middleware, OpenAPI)
- [x] Week 1, Days 2-5: OAuth router migration
- [x] Week 2: Jobs API with OpenAPI docs
  - [x] GET /v1/jobs - List published jobs with filtering
  - [x] GET /v1/jobs/:id - Get job details
  - [x] GET /v1/jobs/:id/similar - Get similar jobs
  - [x] GET /v1/jobs/filter-options - Get available filter values
  - [x] Full OpenAPI/Swagger documentation
- [x] Week 3: Applications API with webhooks
  - [x] POST /v1/applications - Submit application
  - [x] GET /v1/applications/:id - Get application details
  - [x] PATCH /v1/applications/:id - Update application
  - [x] POST /v1/applications/:id/withdraw - Withdraw application
  - [x] Webhook support (application.created, application.updated,
        application.withdrawn)
  - [x] HMAC SHA-256 webhook signatures
  - [x] Webhook delivery logging
- [x] Week 4: Public Profiles API with rate limiting
  - [x] GET /v1/profiles/:username - Get public user profile
  - [x] GET /v1/profiles/organizations/:slug - Get organization profile
  - [x] GET /v1/profiles/employers/:slug - Get employer profile
  - [x] Rate limiting middleware (100 req/15min)
  - [x] User and IP-based rate limiting
  - [x] Rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining,
        X-RateLimit-Reset)

## Migration from tRPC

Each endpoint is migrated from the existing tRPC routers:

- **Jobs**: `packages/supabase/functions/trpc/routers/jobs.router.ts` (1,175
  LOC)
- **Applications**:
  `packages/supabase/functions/trpc/routers/applications.router.ts` (947 LOC)
- **OAuth**: `packages/supabase/functions/trpc/routers/oauth.router.ts` (1,190
  LOC)

Authentication logic is shared via the same `context.ts` pattern used by tRPC.

## Rate Limiting

Public API endpoints are rate-limited (configured in Week 4):

- **Free tier**: 100 requests per 15 minutes
- **Paid tier**: Higher limits based on plan

## OpenAPI Documentation

Access the interactive API documentation at:

```
https://your-project.supabase.co/functions/v1/api/
```

The OpenAPI spec is auto-generated from Zod schemas shared with tRPC.
