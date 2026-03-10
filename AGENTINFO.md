# AGENTINFO.md

> **Canonical Source**: This file contains all project-specific context for the UNI-Construct monorepo.

**Last Updated**: 2025-01-01

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Scaffald SDK](#scaffald-sdk)
- [API Key System](#api-key-system)
- [REST API](#rest-api)
- [Database](#database)
- [Development](#development)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Deployment](#deployment)
- [Publishing](#publishing)

---

## Project Overview

**UNI-Construct** is a monorepo containing:

1. **Scaffald** - Job platform for connecting employers and job seekers
2. **Scaffald SDK** (`@scaffald/sdk`) - Official JavaScript SDK for third-party developers

### Tech Stack

- **Frontend**: React Native (Expo), React, Beyond UI
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **API**: tRPC (internal), REST API (external)
- **Build**: pnpm workspaces, Nx, tsup
- **Testing**: Vitest, Playwright
- **Type Safety**: TypeScript 5.9.2+

### Key Repositories

- **Main App**: `apps/scaffald` - Expo app (iOS, Android, Web)
- **SDK**: `packages/scaffald-sdk` - Published npm package
- **UI**: `packages/scaffald-ui` - Published npm package (`@scaffald/ui`)
- **Core**: `packages/scf-core` - Shared business logic
- **Supabase**: `packages/supabase` - Database, migrations, edge functions

---

## Architecture

### Monorepo Structure

```
UNI-Construct/
├── apps/
│   └── scaffald/              # Expo app (iOS, Android, Web) - port 8081
│
├── packages/
│   ├── scaffald-sdk/          # @scaffald/sdk - Published SDK
│   ├── scaffald-ui/           # @scaffald/ui - Published UI framework
│   ├── scf-core/              # @scf/core - Shared features
│   ├── scf-schemas/           # Zod schemas
│   ├── scf-trpc/              # tRPC routers (internal API)
│   ├── supabase/              # Database + Edge Functions
│   ├── beyond-ui/             # @unicornlove/beyond-ui - UI components
│   ├── insurance/             # Insurance components
│   ├── compliance/            # Compliance features
│   └── tasks/                 # Task management
│
└── examples/
    └── integration-test/      # SDK integration tests
```

### Database Schemas

- **`core.*`** - Shared platform tables (users, organizations, jobs, applications)
- **`data.*`** - Reference data (industries, universities, skills)
- **`onet.*`** - O*NET occupational database (1,016 occupations)
- **`cms.*`** - Content management

### API Architecture

| API Type | Use Case | Auth | Location |
|----------|----------|------|----------|
| **tRPC** | Internal apps (Scaffald) | JWT (Supabase Auth) | `packages/scf-trpc` |
| **REST API** | Third-party developers | API Keys or OAuth 2.0 | `packages/supabase/functions/api` |
| **SDK** | Abstraction over REST API | API Keys or OAuth 2.0 | `packages/scaffald-sdk` |

---

## Scaffald SDK

### Overview

The **Scaffald SDK** (`@scaffald/sdk`) enables third-party developers to integrate with the Scaffald REST API.

**Location**: `packages/scaffald-sdk/`

**Published**: npm as `@scaffald/sdk` (not yet published, in development)

### Features

- ✅ **Full TypeScript Support** - Complete type safety
- ✅ **Zero Runtime Dependencies** - Native Fetch API and Web Crypto
- ✅ **Dual Authentication** - API keys (server-side) and OAuth 2.0 (user-facing)
- ✅ **Automatic Retries** - Exponential backoff (1s → 2s → 4s → 8s)
- ✅ **Rate Limit Handling** - Built-in tracking with callbacks
- ✅ **React Integration** - Hooks powered by React Query
- ✅ **Webhook Verification** - HMAC SHA-256 signature validation
- ✅ **Cross-Platform** - Node.js 18+, browsers, React Native 0.74+

### Package Structure

```
packages/scaffald-sdk/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── client.ts                # Scaffald class
│   ├── config.ts                # Configuration types
│   │
│   ├── auth/
│   │   ├── api-key.ts           # API key authentication
│   │   ├── oauth.ts             # OAuth 2.0 flow helpers
│   │   └── pkce.ts              # PKCE code challenge generation
│   │
│   ├── resources/
│   │   ├── base.ts              # Base Resource class
│   │   ├── jobs.ts              # Jobs API
│   │   ├── applications.ts      # Applications API
│   │   ├── profiles.ts          # Profiles API
│   │   └── oauth.ts             # OAuth endpoints
│   │
│   ├── http/
│   │   ├── client.ts            # HTTP client with middleware
│   │   ├── retry.ts             # Retry logic
│   │   ├── rate-limit.ts        # Rate limit tracking
│   │   └── errors.ts            # Error types
│   │
│   ├── webhooks/
│   │   └── verify.ts            # HMAC signature verification
│   │
│   ├── types/
│   │   ├── api.ts               # API types (auto-generated)
│   │   └── index.ts             # Type exports
│   │
│   └── react/                   # React package
│       ├── index.ts             # Export hooks
│       ├── provider.tsx         # ScaffaldProvider
│       └── hooks.ts             # useJobs, useApplications, etc.
│
├── docs/                        # Documentation
│   ├── getting-started.md
│   ├── api-reference.md
│   ├── react-hooks.md
│   ├── webhooks.md
│   └── oauth.md
│
├── examples/                    # Usage examples
│   ├── node-js/
│   ├── browser/
│   └── react/
│
└── README.md                    # SDK documentation
```

### SDK Development Commands

```bash
# Build SDK
pnpm --filter @scaffald/sdk build

# Run tests
pnpm --filter @scaffald/sdk test

# Type check
pnpm --filter @scaffald/sdk typecheck

# Run integration tests
cd examples/integration-test && node simple-test.mjs
```

### SDK Usage Example

```typescript
import Scaffald from '@scaffald/sdk'

// Initialize client
const client = new Scaffald({
  apiKey: 'sk_live_...',
})

// List jobs
const jobs = await client.jobs.list({ limit: 20, status: 'published' })

// Submit application
const app = await client.applications.create({
  jobId: jobs.data[0].id,
  currentLocation: 'San Francisco, CA',
})
```

### React Hooks Example

```tsx
import { ScaffaldProvider, useJobs } from '@scaffald/sdk/react'

function App() {
  return (
    <ScaffaldProvider config={{ apiKey: process.env.SCAFFALD_API_KEY }}>
      <JobsList />
    </ScaffaldProvider>
  )
}

function JobsList() {
  const { data, isLoading } = useJobs({ limit: 20 })
  if (isLoading) return <div>Loading...</div>
  return <>{/* ... */}</>
}
```

### SDK Documentation

- **Main README**: `packages/scaffald-sdk/README.md`
- **Getting Started**: `packages/scaffald-sdk/docs/getting-started.md`
- **API Reference**: `packages/scaffald-sdk/docs/api-reference.md`
- **React Hooks**: `packages/scaffald-sdk/docs/react-hooks.md`
- **Webhooks**: `packages/scaffald-sdk/docs/webhooks.md`
- **OAuth 2.0**: `packages/scaffald-sdk/docs/oauth.md`

---

## API Key System

### Overview

The API key system allows third-party developers to access the Scaffald REST API programmatically.

**Location**: `packages/supabase/supabase/migrations/` (migrations 300-302)

### Database Schema

#### `api_keys` Table

```sql
CREATE TABLE core.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES core.organizations(id) NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,              -- e.g., 'sk_live_abc...'
  scopes TEXT[] DEFAULT '{}',
  rate_limit_tier TEXT DEFAULT 'free',   -- free | pro | enterprise
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
```

#### `api_key_usage` Table

```sql
CREATE TABLE core.api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES core.api_keys(id),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INT NOT NULL,
  response_time_ms INT,
  timestamp TIMESTAMPTZ DEFAULT now()
);
```

### API Key Format

- **Prefix**: `sk_live_` (production) or `sk_test_` (development)
- **Length**: 32 characters after prefix
- **Encoding**: Base62 (cryptographically secure random)
- **Storage**: SHA-256 hash stored in database (never plaintext)

**Example**: `sk_live_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p`

### Rate Limits by Tier

| Tier       | Limit            | Use Case |
|------------|------------------|----------|
| Free       | 100 req/15 min   | Testing, hobby projects |
| Pro        | 1,000 req/15 min | Small businesses |
| Enterprise | 10,000 req/15 min| Large scale integrations |

### API Key Scopes

Available scopes for fine-grained permissions:

- `read:jobs` - View published jobs
- `write:jobs` - Create and manage jobs (requires employer account)
- `read:applications` - View applications
- `write:applications` - Submit and manage applications
- `read:profile` - View profile information
- `write:profile` - Update profile
- `read:organizations` - View organization information
- `write:organizations` - Manage organization (requires admin)

### Creating API Keys

API keys are created via the Developer Portal UI (in development) or REST API endpoint:

```typescript
// POST /v1/api-keys
{
  "name": "Production API Key",
  "scopes": ["read:jobs", "write:applications"],
  "expiresAt": "2026-01-01T00:00:00Z"
}

// Response (key shown only once!)
{
  "id": "key_abc123",
  "key": "sk_live_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p",
  "name": "Production API Key",
  "scopes": ["read:jobs", "write:applications"],
  "created_at": "2025-01-01T00:00:00Z"
}
```

### Authentication Middleware

Location: `packages/supabase/functions/api/middleware/auth.ts`

Supports both JWT (internal) and API key (external) authentication:

```typescript
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  // Check for API key
  if (authHeader?.startsWith('Bearer sk_')) {
    const apiKey = authHeader.replace('Bearer ', '')
    const keyHash = await hashApiKey(apiKey)

    const { data: keyData } = await supabase
      .from('api_keys')
      .select('*, organization:organizations(*)')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single()

    if (keyData && (!keyData.expires_at || new Date(keyData.expires_at) > new Date())) {
      c.set('apiKey', keyData)
      c.set('organization', keyData.organization)
      c.set('scopes', keyData.scopes)
      return next()
    }
  }

  // Fallback to JWT authentication
  // ... existing JWT logic
}
```

### Developer Portal UI (In Development)

Location: `packages/scf-core/features/api-keys/`

Components being built:

1. **APIKeysList.tsx** - List view of API keys (✅ Completed)
2. **APIKeyCreateModal.tsx** - Create new API key modal (⏳ Pending)
3. **APIKeyUsageChart.tsx** - Usage analytics dashboard (⏳ Pending)
4. **APIKeyScopesManager.tsx** - Manage key permissions (⏳ Pending)

---

## REST API

### Location

`packages/supabase/functions/api/`

### Endpoints

#### Jobs

- `GET /v1/jobs` - List jobs
- `GET /v1/jobs/:id` - Get job details
- `GET /v1/jobs/:id/similar` - Get similar jobs
- `GET /v1/jobs/filter-options` - Get filter options

#### Applications

- `POST /v1/applications` - Submit application
- `GET /v1/applications/:id` - Get application
- `PATCH /v1/applications/:id` - Update application
- `POST /v1/applications/:id/withdraw` - Withdraw application

#### Profiles

- `GET /v1/profiles/:username` - Get user profile
- `GET /v1/profiles/organizations/:slug` - Get organization profile
- `GET /v1/profiles/employers/:slug` - Get employer profile

#### OAuth 2.0

- `GET /oauth/authorize` - Authorization endpoint
- `POST /oauth/token` - Token exchange
- `POST /oauth/revoke` - Token revocation

### Authentication

REST API supports two authentication methods:

1. **API Keys** (for server-side integrations)
   ```
   Authorization: Bearer sk_live_...
   ```

2. **OAuth 2.0** (for user-facing applications)
   ```
   Authorization: Bearer <access_token>
   ```

### Rate Limiting

Implemented via in-memory rate limiting with Redis-like semantics:

- Tracks requests per API key
- Returns `X-RateLimit-*` headers
- Returns `429 Too Many Requests` when exceeded
- Includes `Retry-After` header

**Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

---

## Database

### Setup

```bash
# Reset database (apply all migrations + seed)
pnpm supa db reset

# Seed additional data (CSI MasterFormat, universities, jobs)
pnpm supa:seed

# Generate TypeScript types
pnpm supa:generate
```

### Migrations

Location: `packages/supabase/supabase/migrations/`

Key migrations:
- `001-099`: Core schema (users, organizations, roles, teams)
- `100-199`: Jobs and applications
- `132`, `133`, `20251118181923`: Map RPCs (`core.get_jobs_with_coords`, `core.get_organizations_with_coords` and public wrappers) — required for `/dashboard/map`
- `300-302`: API keys system
- `400+`: O*NET occupational database

### Row Level Security (RLS)

All tables use RLS policies based on:

```
User → team_members → teams → organizations
```

**Example Policy**:
```sql
CREATE POLICY "Users can view jobs in their organization"
ON core.jobs FOR SELECT
USING (
  organization_id IN (
    SELECT o.id FROM core.organizations o
    JOIN core.teams t ON t.organization_id = o.id
    JOIN core.team_members tm ON tm.team_id = t.id
    WHERE tm.user_id = auth.uid()
  )
);
```

### Supabase Commands

```bash
# Start local Supabase (with env vars)
pnpm supa:start

# Stop
pnpm supa:stop

# Restart
pnpm supa:restart

# Check status
pnpm supa:status

# Open Studio
pnpm supa:studio  # http://127.0.0.1:54323

# Open Mailpit (email testing)
pnpm supa:mailpit  # http://127.0.0.1:54324

# Create migration
pnpm supa:migration:new <name>

# Apply migrations
pnpm supa:migration:up

# Push to cloud
pnpm supa db push
```

---

## Development

### Prerequisites

- Node.js 18.17.0+
- pnpm 10.20.0
- Docker 28.2.2 (for Supabase)
- Xcode 16.2 (for iOS)
- Android Studio 2024.3 (for Android)

### First-Time Setup

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.template .env
# Or: cp .env.example .env  (if present)

# Start Supabase stack (Terminal 1)
pnpm supa start
# Or use the full start script: pnpm supa:start:full

# Reset database and seed
pnpm supa db reset && pnpm supa:seed

# Generate types
pnpm supa:generate
```

**Local backend (two processes):** The REST API and tRPC are served by Edge Functions, which run in a **separate process**. For full local backend (profiles, jobs, notifications, etc.):

1. **Terminal 1:** `pnpm supa start` (or `pnpm supa:start:full`) — Supabase stack (DB, Auth, Kong).
2. **Terminal 2:** `pnpm supa:functions` — serves the `api` Edge Function and others. Leave this running.

**Verify API:** `curl -s http://127.0.0.1:54321/functions/v1/api/health` should return HTTP 200 and `{"status":"ok",...}`. If you get 404, start the functions server (step 2). See also [troubleshooting (.cursor/rules/memory/troubleshooting-guide.md)](.cursor/rules/memory/troubleshooting-guide.md) section 5b.

### Development Commands

```bash
# Run Scaffald web
pnpm web

# Run Scaffald iOS
pnpm ios

# Run Scaffald Android
pnpm android

```

### Environment Variables

Required in `.env`:

```bash
# Supabase (local: use http://127.0.0.1:54321)
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Optional: explicit REST API base (local: http://127.0.0.1:54321/functions/v1/api)
# EXPO_PUBLIC_SCAFFALD_API_URL=http://127.0.0.1:54321/functions/v1/api

# Scaffald SDK
SCAFFALD_API_KEY=sk_test_...

# OAuth (if using)
SCAFFALD_CLIENT_ID=your_client_id
SCAFFALD_CLIENT_SECRET=your_client_secret

# Webhooks
SCAFFALD_WEBHOOK_SECRET=whsec_...
```

For address autocomplete (e.g. onboarding, profile) and for the **dashboard map page** (`/dashboard/map`), set `EXPO_PUBLIC_MAPBOX_TOKEN` (or pass `apiKey` to `ControlledAddressForm`). See `.env.template` for Mapbox vars.

### News

The dashboard News widget and `/dashboard/news` page show articles from `core.cached_news_articles`. To see news locally:

1. **Seed data** – Run full seed so industries and news feeds exist: `pnpm supa:seed` (or `pnpm supa db reset && pnpm supa:seed`). Seed includes news feeds (Step 6) and triggers news import (Step 7).
2. **News import** – The import step runs the `news-import` Edge Function. It requires Edge Functions to be running (`pnpm supa:functions` in a separate terminal). If seed completes but news import fails, run it manually: `pnpm supa:news:import`.
3. **Optional fallback industry** – For local/dev when the construction industry is missing from the DB, set `EXPO_PUBLIC_NEWS_CONSTRUCTION_INDUSTRY_ID` to a valid industry UUID so the widget can still show articles.

**Summary:** Run full seed (with functions running) so news import runs once; if import was skipped or failed, run `pnpm supa:news:import` after seed.

---

## Testing

### Test Commands

```bash
# Run all tests
pnpm test

# Run SDK tests
pnpm --filter @scaffald/sdk test

# Run SDK integration tests
cd examples/integration-test && node simple-test.mjs

# E2E tests (Playwright)
pnpm exec playwright test
```

### Test Structure

- **Unit Tests**: `src/__tests__/*.test.ts`
- **Integration Tests**: `examples/integration-test/`
- **E2E Tests**: `tests/` (Playwright)

### Writing Tests

Use Vitest for unit tests:

```typescript
import { describe, it, expect } from 'vitest'

describe('Jobs API', () => {
  it('should list jobs', async () => {
    const jobs = await client.jobs.list()
    expect(jobs.data).toBeInstanceOf(Array)
  })
})
```

---

## Code Quality

### Commands

```bash
# Format code
pnpm format:fix

# Lint code
pnpm lint:fix

# Type check (optional)
pnpm check:type
```

### Pre-commit Checks

Pre-commit hooks run automatically on `git commit`:

- Biome formatting
- Biome linting
- TypeScript type checking (some packages)

**Bypass hooks** (use sparingly):

```bash
git commit --no-verify
```

### Code Standards

- **TypeScript**: Strict mode enabled
- **Formatting**: Biome (replaces Prettier + ESLint)
- **Naming**: PascalCase for components, camelCase for functions
- **Imports**: Absolute imports via `@app/*`, `@scf/*` aliases

### @scaffald/ui Prop Mapping (Tamagui Migration)

When migrating from Tamagui-style props to scaffald-ui, use this mapping:

| Tamagui | scaffald-ui |
|---------|-------------|
| `ai` | `align` |
| `jc` | `justify` |
| `f` | `flex` |
| `position`, `borderWidth`, `borderColor` on layout | Pass via `style` |
| `backgroundColor`, `padded`, `bordered` on Card | Use `style`, `padding`, `variant="outlined"` |
| `chromeless` on Button | `variant="text"` |
| `fontFamily`, `mt`, `textAlign` on Paragraph | Use `style` or `align` |
| `"outlined"` (ButtonVariant) | `"outline"` |
| `"$red12"`, `"$blue10"` for colors | Use semantic: `color="error"`, `color="primary"` |

---

## Deployment

### Scaffald (Expo)

```bash
# EAS build
cd apps/scaffald
eas build --platform ios
eas build --platform android

# EAS update (OTA)
eas update
```

### Supabase

```bash
# Link project
pnpm supa link

# Push migrations
pnpm supa db push

# Seed production
pnpm supa:seed:prod
```

### SDK Publishing (Not Yet Published)

```bash
# Build
pnpm --filter @scaffald/sdk build

# Test
pnpm --filter @scaffald/sdk test

# Publish (future)
pnpm --filter @scaffald/sdk publish --access public
```

---

## Publishing

### Published Packages

| Package | Location | CI Workflow | Trigger |
|---------|----------|-------------|---------|
| `@scaffald/ui` | `packages/scaffald-ui` | `semantic-release-ui.yml` | Push to `main` when `packages/scaffald-ui/**` changes |
| `@scaffald/sdk` | `packages/scaffald-sdk` | `semantic-release-sdk.yml` | Push to `main` when `packages/scaffald-sdk/**` changes |

### NPM_TOKEN Requirement

Publishing `@scaffald/ui` and `@scaffald/sdk` to npm requires `NPM_TOKEN` in GitHub repository secrets.

- **Verify**: GitHub repo → Settings → Secrets and variables → Actions → ensure `NPM_TOKEN` exists
- **Scope**: Automation token with publish access for `@scaffald` org/package
- **Used by**: `semantic-release-ui.yml`, `semantic-release-sdk.yml`

### scaffald-ui Release Workflow

1. Make changes in `packages/scaffald-ui/` (exclude `docs-site/` and `.md`-only changes to trigger release)
2. Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, or `BREAKING CHANGE:` for version bumps
3. Push to `main` — CI runs semantic-release, publishes to npm, and creates `ui-vX.Y.Z` tag
4. Manual trigger: GitHub Actions → "Release @scaffald/ui" → "Run workflow"

### scaffald-ui Docs (GitHub Pages)

- **Docs site** (e.g. https://ui.scaffald.com) is **not** deployed from this monorepo. It is built and deployed from the **[Scaffald/ui](https://github.com/Scaffald/ui)** repo.
- **Sync**: Pushing to `main` with `packages/scaffald-ui/**` changes runs **Sync @scaffald/ui to Public Repository**, which updates Scaffald/ui. The workflow **Deploy Docs** (`.github/workflows/deploy-docs.yml`) lives inside `packages/scaffald-ui` and runs in Scaffald/ui after sync.
- **Enable Pages**: In the Scaffald/ui repo, set Settings → Pages → Source to **GitHub Actions**. See `packages/scaffald-ui/RELEASE.md` and `packages/scaffald-ui/AGENTINFO.md` (synced to Scaffald/ui) for details.

### Root Release (App Version)

- **Workflow**: `release.yml` on every push to `main`
- **Updates**: `apps/scaffald/package.json` version, `CHANGELOG.md`, GitHub release
- **Concurrency**: All release workflows use `release-${{ github.ref }}` to avoid overlapping git pushes

---

## Additional Resources

- **Main README**: `/README.md`
- **Supabase README**: `/packages/supabase/README.md`
- **SDK README**: `/packages/scaffald-sdk/README.md`
- **UI README**: `/packages/scaffald-ui/README.md`
- **O*NET Database**: `/packages/supabase/onet/README.md`
- **Tests README**: `/tests/README.md`

---

## Project Maintainers

- Clay <clay@unicorn.love>
- Zach <zach@unicorn.love>
- Marc <marc@unicorn.love>
- Vince <vince@unicorn.love>

**Last Updated**: January 1, 2025
