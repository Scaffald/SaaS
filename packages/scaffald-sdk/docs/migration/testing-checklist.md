# Testing Checklist for tRPC to REST Migration

**Last Updated**: 2025-12-31
**Owner**: QA Team + Backend Engineers

---

## Overview

This document defines the comprehensive testing requirements for each REST endpoint during the tRPC to REST migration. **100% test coverage is mandatory** before any client migration begins.

---

## Testing Levels

### 1. Unit Tests (100% Coverage Required)

**Scope**: Individual REST endpoints in isolation

**Coverage Metrics**:
- ✅ **Statement Coverage**: 100%
- ✅ **Branch Coverage**: 100%
- ✅ **Function Coverage**: 100%
- ✅ **Line Coverage**: 100%

**Tools**:
- Framework: Deno Test Runner (`deno test`)
- Assertions: Deno standard library
- Mocking: Manual mocks or test doubles

**Location**: `packages/supabase/functions/api/__tests__/routes/`

---

### 2. Integration Tests

**Scope**: Cross-endpoint flows, database interactions, auth flows

**Coverage**: All critical user journeys

**Tools**:
- Framework: Deno Test Runner
- Database: Local Supabase instance
- Auth: Mailpit for email testing

**Location**: `packages/supabase/functions/api/__tests__/integration/`

---

### 3. E2E Tests

**Scope**: Full client-to-database flows across all 3 apps

**Coverage**: Critical user paths in production-like environment

**Tools**:
- Scaffald (Expo): Detox
- Scaffald (web): Playwright/Cypress
- Forsured Web: archived

**Location**: `packages/supabase/functions/api/__tests__/e2e/`

---

### 4. Performance Benchmarks

**Scope**: Compare REST vs tRPC performance

**Metrics**:
- Latency (p50, p95, p99)
- Throughput (requests/second)
- Error rates
- Memory usage

**Tools**: Deno bench or custom benchmarking

**Location**: `packages/supabase/functions/api/__tests__/benchmarks/`

---

## Per-Endpoint Testing Checklist

### Unit Test Requirements ✅ = REQUIRED

For **each endpoint**, create tests covering:

#### ✅ 1. Happy Path
- [ ] Valid request with all required parameters
- [ ] Valid response structure
- [ ] Correct HTTP status code (200, 201, 204)
- [ ] Correct response headers (Content-Type, etc.)
- [ ] Data correctly saved to database (if applicable)

#### ✅ 2. Authentication & Authorization
- [ ] Request without auth token returns 401 Unauthorized
- [ ] Request with invalid/expired token returns 401
- [ ] Request with valid token succeeds
- [ ] User can only access their own resources (if applicable)
- [ ] Organization/role-based access control (if applicable)

#### ✅ 3. Input Validation
- [ ] Missing required parameters return 400 Bad Request
- [ ] Invalid data types return 400
- [ ] Out-of-range values return 400
- [ ] Invalid enum values return 400
- [ ] SQL injection attempts rejected
- [ ] XSS attempts sanitized
- [ ] Max length constraints enforced

#### ✅ 4. Edge Cases
- [ ] Empty array/object inputs
- [ ] Null/undefined values
- [ ] Very large payloads (test max size limits)
- [ ] Unicode/special characters in strings
- [ ] Duplicate requests (idempotency)
- [ ] Concurrent requests (race conditions)

#### ✅ 5. Error Handling
- [ ] Database connection errors return 500
- [ ] Foreign key violations return appropriate error
- [ ] Unique constraint violations return 409 Conflict
- [ ] Not found returns 404
- [ ] Internal errors return 500 with safe error message
- [ ] Error responses follow standard format

#### ✅ 6. Business Logic
- [ ] All business rules enforced
- [ ] State transitions valid
- [ ] Calculated fields correct
- [ ] Side effects occur (e.g., notifications sent)
- [ ] Webhooks triggered (if applicable)

#### ✅ 7. Performance
- [ ] Query optimization (no N+1 queries)
- [ ] Response time <200ms (p95)
- [ ] Pagination works correctly
- [ ] Large datasets handled efficiently

---

## Module-Specific Testing Checklists

### Auth Module (5 endpoints)

**POST /v1/auth/magic-link**:
- [ ] Email sent to Mailpit
- [ ] Magic link token generated
- [ ] Token expires after configured time
- [ ] Invalid email format rejected
- [ ] Rate limiting enforced (max 5 per hour per email)
- [ ] User created if signup, existing user if login

**POST /v1/auth/verify**:
- [ ] Valid token authenticates user
- [ ] Expired token rejected
- [ ] Invalid token rejected
- [ ] Token single-use (can't reuse)
- [ ] Session created successfully

**GET /v1/auth/session**:
- [ ] Returns current user info
- [ ] Requires valid auth token
- [ ] Returns 401 if unauthenticated

**DELETE /v1/auth/session**:
- [ ] Logs out user
- [ ] Invalidates session token
- [ ] Returns 204 No Content

**POST /v1/auth/refresh**:
- [ ] Refreshes access token
- [ ] Requires valid refresh token
- [ ] Invalid refresh token rejected
- [ ] Expired refresh token rejected

---

### Jobs Module (4 endpoints)

**GET /v1/jobs**:
- [ ] Returns paginated list
- [ ] Filters work (status, location, remote, etc.)
- [ ] Sorting works (date, title, etc.)
- [ ] Limit/offset pagination correct
- [ ] Only published jobs returned
- [ ] Organization filter works

**GET /v1/jobs/:id**:
- [ ] Returns single job
- [ ] 404 if job not found
- [ ] Only published jobs accessible
- [ ] Related data included (organization, etc.)

**GET /v1/jobs/:id/similar**:
- [ ] Returns similar jobs (up to limit)
- [ ] Similarity algorithm correct
- [ ] Excludes current job
- [ ] Max 20 jobs returned

**GET /v1/jobs/filter-options**:
- [ ] Returns available filter values
- [ ] Locations list correct
- [ ] Employment types list correct
- [ ] Remote options list correct

---

### Applications Module (4 endpoints)

**POST /v1/applications**:
- [ ] Quick application created
- [ ] Full application created
- [ ] Validation for required fields
- [ ] Custom questions answered
- [ ] Attachments uploaded
- [ ] Webhook triggered (application.created)
- [ ] User notified

**GET /v1/applications/:id**:
- [ ] Returns application details
- [ ] User can only see own applications
- [ ] 403 if accessing other user's application
- [ ] 404 if not found

**PATCH /v1/applications/:id**:
- [ ] Updates allowed fields
- [ ] Only pending/reviewing status can be updated
- [ ] Status transitions valid
- [ ] Webhook triggered (application.updated)
- [ ] 403 if not owner

**POST /v1/applications/:id/withdraw**:
- [ ] Withdraws application
- [ ] Reason required and saved
- [ ] Status changed to "withdrawn"
- [ ] Webhook triggered (application.withdrawn)
- [ ] Cannot withdraw already processed application

---

### Profiles Module (3 endpoints)

**GET /v1/profiles/:username**:
- [ ] Returns public profile
- [ ] Rate limited (100 req/15min per IP)
- [ ] 404 if user not found
- [ ] Only public data returned
- [ ] Profile views tracked

**GET /v1/profiles/organizations/:slug**:
- [ ] Returns organization profile
- [ ] Rate limited
- [ ] 404 if org not found
- [ ] Public data only

**GET /v1/profiles/employers/:slug**:
- [ ] Returns employer profile
- [ ] Rate limited
- [ ] 404 if employer not found
- [ ] Public data only

---

### OAuth Module (5 endpoints)

**GET /oauth/authorize**:
- [ ] Authorization code generated
- [ ] PKCE code challenge validated
- [ ] Redirect URI validated
- [ ] Scope validated
- [ ] State parameter preserved
- [ ] User consent required

**POST /oauth/token**:
- [ ] Authorization code exchange works
- [ ] Refresh token exchange works
- [ ] Client credentials flow works
- [ ] PKCE code verifier validated
- [ ] Invalid grant type rejected
- [ ] Access token and refresh token returned

**POST /oauth/revoke**:
- [ ] Token revoked successfully
- [ ] Revoked token no longer valid
- [ ] Returns 200 even if token already invalid

**POST /oauth/introspect**:
- [ ] Returns token info if valid
- [ ] Returns inactive if invalid/expired
- [ ] Client authentication required

**GET /oauth/userinfo**:
- [ ] Returns user info for valid token
- [ ] 401 if token invalid
- [ ] Only authorized scopes returned

---

### API Keys Module (5 endpoints)

**POST /v1/api-keys**:
- [ ] API key created with correct prefix (sk_test_ or sk_live_)
- [ ] Key hashed before storage (SHA-256)
- [ ] Scopes validated
- [ ] Expiration date set
- [ ] Rate limit tier assigned
- [ ] User can only create for own organization

**GET /v1/api-keys**:
- [ ] Lists organization's API keys
- [ ] Hashed keys not returned (only prefix + last 4 chars)
- [ ] Pagination works
- [ ] User can only see own org's keys

**PATCH /v1/api-keys/:id**:
- [ ] Updates key name
- [ ] Updates active status
- [ ] Cannot update other fields (scopes, expiration, tier)
- [ ] User can only update own org's keys

**DELETE /v1/api-keys/:id**:
- [ ] Revokes/deletes API key
- [ ] Key no longer functional
- [ ] Returns 204 No Content
- [ ] User can only delete own org's keys

**API Key Usage Tracking**:
- [ ] Every request logged to api_key_usage table
- [ ] Endpoint, method, status, response time recorded
- [ ] IP address tracked
- [ ] Rate limiting enforced by tier

---

## Integration Test Scenarios

### Auth Flow Integration
1. **Magic Link Signup & Login**:
   - [ ] User signs up with magic link
   - [ ] Email sent to Mailpit
   - [ ] User clicks link, authenticated
   - [ ] Session created
   - [ ] User logs out
   - [ ] User logs in again with same email

2. **OAuth Flow**:
   - [ ] Client initiates OAuth flow
   - [ ] Authorization code generated
   - [ ] Token exchanged
   - [ ] User info retrieved

### Job Application Flow
1. **Job Search → Apply → Check Status**:
   - [ ] User searches for jobs
   - [ ] User views job details
   - [ ] User submits application
   - [ ] Application created in database
   - [ ] User checks application status
   - [ ] User withdraws application

### Profile Completion Flow
1. **Profile Creation**:
   - [ ] User creates profile (general info)
   - [ ] User adds employment history
   - [ ] User adds skills
   - [ ] User adds education
   - [ ] Profile completion percentage calculated
   - [ ] Profile publicly viewable

---

## E2E Test Scenarios (Per Client App)

### Expo App
1. **User Onboarding**:
   - [ ] Sign up with magic link
   - [ ] Complete profile wizard
   - [ ] Browse jobs
   - [ ] Apply to job
   - [ ] Check notifications

2. **Profile Management**:
   - [ ] Update profile info
   - [ ] Add/remove skills
   - [ ] Upload resume
   - [ ] View profile as public

### Scaffald App
1. **Quick Job Application**:
   - [ ] Browse jobs without auth
   - [ ] Apply to job (quick apply)
   - [ ] Check application status

### Forsured Web (archived)
Forsured Web is deprecated; no active E2E checklist. Employer workflows are covered by Scaffald app.

---

## Performance Benchmark Requirements

### Latency Benchmarks (REST vs tRPC)

**Target**: REST ≤ tRPC for all metrics

| Endpoint Type | p50 Target | p95 Target | p99 Target |
|---------------|------------|------------|------------|
| Simple GET (no DB) | <10ms | <20ms | <50ms |
| GET with DB query | <50ms | <100ms | <200ms |
| POST/PATCH with DB | <100ms | <200ms | <500ms |
| Complex aggregation | <200ms | <400ms | <1000ms |

### Throughput Benchmarks

**Target**: REST ≥ tRPC throughput

| Scenario | Target | Measurement |
|----------|--------|-------------|
| Concurrent GETs | >1000 req/s | 50 concurrent users |
| Concurrent POSTs | >500 req/s | 25 concurrent users |
| Mixed workload | >750 req/s | Realistic traffic mix |

### Load Testing

- [ ] 100 concurrent users for 5 minutes
- [ ] 500 concurrent users for 1 minute (spike test)
- [ ] Gradual ramp-up: 0 → 1000 users over 10 minutes
- [ ] Error rate <0.5% under load
- [ ] No memory leaks during extended test

---

## CI/CD Testing Requirements

### Pre-Merge Checks (Required)

- [ ] All unit tests pass
- [ ] 100% coverage maintained
- [ ] Integration tests pass
- [ ] Linting passes (Biome)
- [ ] Type checking passes (TypeScript)
- [ ] No new console.log statements
- [ ] OpenAPI spec validates

### Pre-Deploy Checks (Staging)

- [ ] All unit + integration tests pass
- [ ] E2E tests pass in staging environment
- [ ] Performance benchmarks meet targets
- [ ] Security scan passes (no SQL injection, XSS)
- [ ] Load test passes (100 concurrent users)

### Post-Deploy Checks (Production)

- [ ] Smoke tests pass (critical paths)
- [ ] Error rate <0.5% in first hour
- [ ] p95 latency within acceptable range
- [ ] No spike in crash reports
- [ ] User metrics stable

---

## Testing Tools & Setup

### Required Tools

**Backend Testing**:
```bash
# Run all tests
deno test --allow-all

# Run with coverage
deno test --allow-all --coverage=coverage

# Generate coverage report
deno coverage coverage --lcov --output=coverage.lcov

# Run specific test file
deno test --allow-all __tests__/routes/auth.test.ts
```

**SDK Testing**:
```bash
cd packages/scaffald-sdk

# Run tests with Vitest
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

**E2E Testing**:
```bash
# Expo (Detox)
cd apps/scaffald
pnpm detox test

# Web (Playwright) — use Scaffald web build
cd apps/scaffald
pnpm web:build && pnpm playwright test
```

### Test Environment Setup

**Local Supabase**:
```bash
# Start local Supabase
pnpm supa start

# Run migrations
pnpm supa migration up

# Reset database
pnpm supa db reset
```

**Mailpit** (for auth email testing):
```bash
# Start Mailpit
docker run -d -p 1025:1025 -p 8025:8025 mailpit/mailpit

# View emails at http://localhost:8025
```

---

## Test Data Management

### Fixtures

**Location**: `packages/supabase/functions/api/__tests__/helpers/fixtures.ts`

**Required Fixtures**:
- [ ] Test users (various roles)
- [ ] Test organizations
- [ ] Test jobs (published, draft, closed)
- [ ] Test applications (pending, reviewing, accepted, rejected)
- [ ] Test profiles (complete, incomplete)
- [ ] Test API keys (free, pro, enterprise tiers)

### Data Cleanup

**After Each Test**:
- [ ] Delete test data created during test
- [ ] Reset database sequences
- [ ] Clear cache/sessions
- [ ] Delete uploaded files

**Isolation**:
- [ ] Each test uses unique data (no shared state)
- [ ] Tests can run in parallel
- [ ] Tests can run in any order

---

## Coverage Reporting

### Required Reports

- [ ] **Unit Test Coverage**: Generated by Deno coverage tool
- [ ] **Integration Test Coverage**: Tracked separately
- [ ] **E2E Test Coverage**: Critical paths checklist
- [ ] **Performance Benchmarks**: CSV/JSON export

### Coverage Thresholds (CI/CD Gates)

```typescript
{
  statements: 100,
  branches: 100,
  functions: 100,
  lines: 100
}
```

**Enforcement**:
- [ ] CI fails if coverage <100%
- [ ] No merge without green tests
- [ ] Coverage report commented on PR

---

## Sign-Off Checklist

Before marking a module as "Testing Complete":

- [ ] All unit tests written and passing
- [ ] 100% code coverage achieved
- [ ] All integration tests passing
- [ ] Performance benchmarks meet or exceed tRPC
- [ ] E2E tests written for critical paths
- [ ] Test data fixtures created
- [ ] CI/CD pipeline passing
- [ ] Code review completed
- [ ] QA team sign-off
- [ ] Migration lead approval

---

**Document Owner**: QA Lead
**Review Cadence**: Weekly
**Last Reviewed**: 2025-12-31
