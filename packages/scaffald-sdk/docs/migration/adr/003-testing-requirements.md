# ADR-003: Testing Requirements

**Status**: Accepted
**Date**: 2025-12-31
**Decision Makers**: QA Team, Backend Team, Migration Lead
**Consulted**: Frontend Team, DevOps Team

---

## Context

We are migrating 58 tRPC routers to ~400 REST endpoints. This is a **critical system migration** affecting all user-facing features across 3 client applications.

**Risks if Testing is Inadequate**:
1. **User Impact**: Production bugs affect real users
2. **Revenue Impact**: Payment/billing bugs could lose revenue
3. **Compliance Risk**: CCPA/background check bugs have legal consequences
4. **Reputation Damage**: App crashes hurt user trust
5. **Rollback Costs**: Failed migration wastes engineering time

**Current State**:
- ✅ Existing REST API has 21 endpoints (Jobs, Applications, Profiles, OAuth, API Keys)
- 🔴 **ZERO test coverage** for existing REST endpoints
- ⏳ 53 routers remaining to migrate

**Question**: What level of testing is required to ensure a safe, successful migration?

---

## Decision

We will enforce a **100% Test Coverage Mandate** for all REST endpoints before any client migration begins.

### Core Requirements

1. **100% Unit Test Coverage** (Non-Negotiable)
   - Statement coverage: 100%
   - Branch coverage: 100%
   - Function coverage: 100%
   - Line coverage: 100%

2. **Integration Tests** (Required)
   - All cross-endpoint flows tested
   - Database interactions tested
   - Auth flows tested end-to-end

3. **E2E Tests** (Required)
   - Critical user journeys tested in all 3 client apps
   - Production-like environment

4. **Performance Benchmarks** (Required)
   - REST vs tRPC comparison for every endpoint
   - Latency, throughput, error rates measured

5. **CI/CD Enforcement** (Required)
   - No merge without tests
   - No deploy without passing tests
   - Coverage reports on every PR

---

## Testing Levels

### Level 1: Unit Tests (MANDATORY - 100% Coverage)

**Scope**: Individual REST endpoints in isolation

**What to Test**:
- ✅ Happy path (valid inputs → correct outputs)
- ✅ Authentication & authorization
- ✅ Input validation (missing fields, invalid types, edge cases)
- ✅ Error handling (database errors, constraint violations)
- ✅ Business logic (state transitions, calculations)
- ✅ Side effects (notifications sent, webhooks triggered)

**Tools**:
- Framework: Deno Test Runner
- Location: `packages/supabase/functions/api/__tests__/routes/`
- Example: `__tests__/routes/auth.test.ts`

**Coverage Enforcement**:
```typescript
// deno.json
{
  "test": {
    "coverage": {
      "include": ["routes/**/*.ts"],
      "exclude": ["__tests__/**"]
    }
  }
}
```

**CI/CD Gate**:
```yaml
# .github/workflows/api-tests.yml
- name: Run tests with coverage
  run: deno test --allow-all --coverage=coverage

- name: Check coverage
  run: |
    deno coverage coverage --lcov --output=coverage.lcov
    # Fail if coverage <100%
    if [ $(deno coverage coverage | grep -oP 'cover rate: \K\d+') -lt 100 ]; then
      echo "Coverage below 100%"
      exit 1
    fi
```

### Level 2: Integration Tests (REQUIRED)

**Scope**: Cross-endpoint flows, database interactions, external services

**What to Test**:
- ✅ Auth flows (magic link → verify → session → logout)
- ✅ Job application flow (search → view → apply → status check)
- ✅ Profile completion (create → add employment → add skills → view public)
- ✅ Payment flow (create subscription → webhook → confirmation)

**Tools**:
- Framework: Deno Test Runner
- Database: Local Supabase instance (start with `pnpm supa start`)
- Email: Mailpit for magic link testing
- Location: `packages/supabase/functions/api/__tests__/integration/`

**Example Test**:
```typescript
// __tests__/integration/auth-flows.test.ts
Deno.test("Magic link signup flow", async () => {
  // 1. Request magic link
  const response1 = await fetch("/v1/auth/magic-link", {
    method: "POST",
    body: JSON.stringify({ email: "test@example.com", type: "signup" }),
  })
  assertEquals(response1.status, 200)

  // 2. Extract token from Mailpit
  const token = await getTokenFromMailpit()

  // 3. Verify magic link
  const response2 = await fetch("/v1/auth/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  })
  const { session } = await response2.json()
  assertExists(session.access_token)

  // 4. Check session
  const response3 = await fetch("/v1/auth/session", {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  assertEquals(response3.status, 200)
})
```

### Level 3: E2E Tests (REQUIRED)

**Scope**: Full user flows across client apps

**What to Test**:
- ✅ User onboarding (Expo app)
- ✅ Job search and apply (All apps)
- ✅ Profile management (Expo app)
- ✅ Employer workflows (Forsured Web)

**Tools**:
- Expo: Detox (config: `apps/scaffald/.detoxrc.js`)
- Scaffald: Playwright or Cypress
- Forsured Web: Playwright or Cypress

**Example Test** (Detox):
```typescript
// apps/scaffald/__tests__/e2e/job-application.e2e.ts
describe('Job Application Flow', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  it('should allow user to apply to a job', async () => {
    // 1. Browse jobs
    await element(by.id('jobs-tab')).tap()
    await waitFor(element(by.text('Software Engineer')))
      .toBeVisible()
      .withTimeout(2000)

    // 2. View job details
    await element(by.text('Software Engineer')).tap()
    await expect(element(by.id('job-description'))).toBeVisible()

    // 3. Apply to job
    await element(by.id('apply-button')).tap()
    await element(by.id('quick-apply-button')).tap()

    // 4. Verify success
    await expect(element(by.text('Application submitted!'))).toBeVisible()
  })
})
```

### Level 4: Performance Benchmarks (REQUIRED)

**Scope**: REST vs tRPC performance comparison

**Metrics**:
- Latency (p50, p95, p99)
- Throughput (requests/second)
- Error rates
- Memory usage

**Tools**:
- Deno Bench or custom benchmarking
- Location: `packages/supabase/functions/api/__tests__/benchmarks/`

**Example Benchmark**:
```typescript
// __tests__/benchmarks/rest-vs-trpc.bench.ts
Deno.bench("REST - GET /v1/jobs", async () => {
  await fetch("/v1/jobs?limit=20")
})

Deno.bench("tRPC - jobs.list", async () => {
  await trpcClient.jobs.list.query({ limit: 20 })
})
```

**Success Criteria**:
- REST p95 latency ≤ tRPC p95 latency
- REST throughput ≥ tRPC throughput
- REST error rate ≤ tRPC error rate

---

## Phase-Specific Testing Requirements

### Phase 2: Testing Infrastructure (Week 2) - CRITICAL

**Deliverables**:
- ✅ Test framework setup (`__tests__/setup.ts`)
- ✅ 100% coverage for 21 existing REST endpoints
- ✅ Integration test suite (auth, jobs, applications)
- ✅ Performance benchmarks (REST vs tRPC baseline)
- ✅ CI/CD enforcement (coverage gates)

**Gate Criteria**:
- All tests passing in CI
- Coverage reports showing 100%
- Performance benchmarks documented
- No flaky tests

**DO NOT PROCEED to Phase 3** until Phase 2 is 100% complete!

### Phase 3-8: Per-Module Migration

**For Each Module**:
1. Write unit tests (100% coverage) BEFORE implementing endpoint
2. Write integration tests for cross-endpoint flows
3. Run performance benchmarks vs tRPC
4. All tests must pass before client migration
5. E2E tests written for critical paths

**NO CLIENT MIGRATION** until all tests pass!

### Phase 4: Client Migration

**For Each Client App**:
- E2E tests for critical user journeys
- Compare behavior: REST vs tRPC
- Monitor error rates during gradual rollout
- Rollback if error rate >1% higher than tRPC

---

## Test Coverage Mandate

### 100% Coverage = Non-Negotiable

**Why 100%, not 80%?**
- **Risk Level**: Critical user-facing system
- **Compliance**: Payment and legal endpoints require full testing
- **Confidence**: 100% ensures all code paths tested
- **Regression Prevention**: Catch bugs before production

**No Exceptions**:
- No "this code is too simple to test"
- No "we'll add tests later"
- No "90% is good enough"

**PR Rejection**:
- If coverage <100%, PR will be rejected by CI
- If tests are flaky, PR will be rejected
- If tests don't follow patterns, PR will be rejected

### Coverage Verification

**Tools**:
```bash
# Generate coverage
deno test --allow-all --coverage=coverage

# View coverage report
deno coverage coverage

# Generate LCOV for CI
deno coverage coverage --lcov --output=coverage.lcov

# Upload to Codecov (optional)
codecov --file=coverage.lcov
```

**CI/CD Check**:
```yaml
- name: Check 100% coverage
  run: |
    deno coverage coverage --lcov > coverage.txt
    COVERAGE=$(grep -oP 'cover rate: \K[\d.]+' coverage.txt)
    if (( $(echo "$COVERAGE < 100" | bc -l) )); then
      echo "Coverage is $COVERAGE%, must be 100%"
      exit 1
    fi
```

---

## Test Quality Standards

### Test Patterns to Follow

**Good Test Example**:
```typescript
Deno.test("POST /v1/auth/magic-link - valid email", async () => {
  const response = await testClient.post("/v1/auth/magic-link", {
    email: "test@example.com",
    type: "login",
  })

  assertEquals(response.status, 200)
  assertExists(response.body.data)

  // Verify email sent
  const emails = await mailpit.getEmails()
  assertEquals(emails[0].to, "test@example.com")
  assertMatch(emails[0].body, /magic link/i)
})

Deno.test("POST /v1/auth/magic-link - invalid email", async () => {
  const response = await testClient.post("/v1/auth/magic-link", {
    email: "not-an-email",
    type: "login",
  })

  assertEquals(response.status, 400)
  assertEquals(response.body.error, "ValidationError")
  assertMatch(response.body.message, /invalid email/i)
})
```

**Test Anti-Patterns** (Avoid):
```typescript
// ❌ No assertions
Deno.test("auth works", async () => {
  await fetch("/v1/auth/magic-link", { body: "{}" })
  // No assertions!
})

// ❌ Unclear test name
Deno.test("test 1", async () => { ... })

// ❌ Testing multiple things
Deno.test("auth and profile work", async () => {
  // Test auth
  // Test profile
  // Too much in one test!
})

// ❌ Shared state between tests
let sharedUser = null
Deno.test("create user", () => { sharedUser = ... })
Deno.test("update user", () => { update(sharedUser) })  // Depends on previous test!
```

### Test Naming Convention

**Pattern**: `<HTTP Method> <Endpoint> - <Scenario>`

**Examples**:
- `GET /v1/jobs - returns paginated list`
- `GET /v1/jobs - filters by status`
- `POST /v1/applications - creates quick application`
- `POST /v1/applications - requires authentication`
- `PATCH /v1/applications/:id - returns 403 if not owner`

### Test Data Management

**Fixtures**:
```typescript
// __tests__/helpers/fixtures.ts
export const createTestUser = async () => {
  return await db.insert('users').values({
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
  })
}

export const createTestJob = async (organizationId: string) => {
  return await db.insert('jobs').values({
    title: 'Software Engineer',
    organization_id: organizationId,
    status: 'published',
  })
}
```

**Cleanup**:
```typescript
// After each test
afterEach(async () => {
  await db.delete('applications').where({ created_at: greaterThan(testStartTime) })
  await db.delete('jobs').where({ created_at: greaterThan(testStartTime) })
  await db.delete('users').where({ created_at: greaterThan(testStartTime) })
})
```

**Isolation**:
- Each test creates its own data
- No shared state between tests
- Tests can run in parallel
- Tests can run in any order

---

## CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/api-tests.yml`

```yaml
name: REST API Tests

on:
  pull_request:
    paths:
      - 'packages/supabase/functions/api/**'
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: supabase/postgres
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Deno
        uses: denoland/setup-deno@v1
        with:
          deno-version: v1.40.0

      - name: Start Supabase
        run: pnpm supa start

      - name: Run migrations
        run: pnpm supa migration up

      - name: Run tests with coverage
        run: |
          cd packages/supabase/functions/api
          deno test --allow-all --coverage=coverage

      - name: Check 100% coverage
        run: |
          cd packages/supabase/functions/api
          deno coverage coverage --lcov --output=coverage.lcov
          COVERAGE=$(deno coverage coverage | grep -oP 'cover rate: \K[\d.]+')
          if (( $(echo "$COVERAGE < 100" | bc -l) )); then
            echo "Coverage is $COVERAGE%, must be 100%"
            exit 1
          fi

      - name: Run integration tests
        run: deno test --allow-all __tests__/integration

      - name: Run performance benchmarks
        run: deno bench --allow-all

      - name: Comment coverage on PR
        uses: codecov/codecov-action@v3
        with:
          files: coverage.lcov
          fail_ci_if_error: true
```

### PR Checks (Required to Pass)

- ✅ All unit tests pass
- ✅ 100% test coverage
- ✅ All integration tests pass
- ✅ Performance benchmarks meet targets
- ✅ Linting passes (Biome)
- ✅ Type checking passes (TypeScript)
- ✅ No console.log statements
- ✅ OpenAPI spec validates

**PR cannot merge** if any check fails!

---

## Performance Testing Requirements

### Latency Targets (REST ≤ tRPC)

| Endpoint Type | p50 Target | p95 Target | p99 Target |
|---------------|------------|------------|------------|
| Simple GET (no DB) | <10ms | <20ms | <50ms |
| GET with DB query | <50ms | <100ms | <200ms |
| POST/PATCH with DB | <100ms | <200ms | <500ms |
| Complex aggregation | <200ms | <400ms | <1000ms |

**If targets not met**:
1. Optimize query (add index, reduce joins)
2. Add caching (Redis, in-memory)
3. Benchmark again
4. Escalate if still failing

### Load Testing

**Scenarios**:
- 100 concurrent users for 5 minutes (sustained load)
- 500 concurrent users for 1 minute (spike test)
- 0 → 1000 users over 10 minutes (gradual ramp-up)

**Success Criteria**:
- Error rate <0.5% under load
- p95 latency <200ms under load
- No memory leaks during extended test
- Server recovers after spike

**Tools**: k6, Artillery, or custom Deno script

---

## Testing Team & Responsibilities

### Roles

**Backend Engineers**:
- Write unit tests for endpoints
- Achieve 100% coverage
- Fix failing tests

**QA Engineers**:
- Write integration tests
- Write E2E tests
- Define test scenarios
- Review test quality

**DevOps**:
- Set up CI/CD pipeline
- Enforce coverage gates
- Monitor test performance

**Migration Lead**:
- Approve test strategy
- Review test coverage reports
- Make go/no-go decisions

---

## Alternatives Considered

### Alternative 1: 80% Coverage Threshold

**Description**: Require 80% coverage instead of 100%

**Pros**:
- Faster development
- Focus on critical paths only

**Cons**:
- 20% of code untested (high risk)
- "Which 20%?" becomes subjective
- Compliance/payment code might be in untested 20%

**Why Rejected**: Risk too high for critical system

### Alternative 2: Manual Testing Only

**Description**: Rely on QA manual testing instead of automated tests

**Pros**:
- No time spent writing tests
- QA can test realistic user flows

**Cons**:
- Slow (manual testing takes days)
- Not repeatable (manual tests vary)
- Regression bugs (old features break)
- No CI/CD automation

**Why Rejected**: Doesn't scale, too slow for 400 endpoints

### Alternative 3: Test After Migration

**Description**: Migrate first, write tests later

**Pros**:
- Faster migration timeline

**Cons**:
- **EXTREMELY HIGH RISK** - bugs reach production
- No safety net for rollbacks
- Technical debt accumulates

**Why Rejected**: Unacceptable risk to users

---

## Consequences

### Positive

- **Confidence**: 100% coverage ensures all code paths tested
- **Regression Prevention**: Catch bugs before production
- **Faster Debugging**: Tests pinpoint exact failures
- **Documentation**: Tests serve as usage examples
- **Refactoring Safety**: Can refactor confidently

### Negative

- **Time Investment**: Writing tests takes 30-50% of development time
- **Maintenance**: Tests must be updated when code changes
- **False Confidence**: 100% coverage doesn't guarantee zero bugs

### Neutral

- **Learning Curve**: Team must learn testing best practices
- **Tooling Setup**: CI/CD pipeline requires initial setup

---

## Success Metrics

**Migration Successful If**:
- ✅ 100% test coverage for all 400 endpoints
- ✅ Zero production bugs from REST endpoints (or <5 total)
- ✅ All integration tests passing
- ✅ All E2E tests passing
- ✅ Performance benchmarks meet or exceed tRPC
- ✅ CI/CD pipeline enforcing coverage
- ✅ <3 rollback events during migration

---

## References

- [Testing Best Practices (Martin Fowler)](https://martinfowler.com/testing/)
- [Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Deno Testing Documentation](https://deno.land/manual/testing)
- [Detox Documentation](https://wix.github.io/Detox/)

---

## Amendments

*None yet*

---

**Document Owner**: QA Lead
**Review Cadence**: Weekly during Phase 2, Monthly after
**Last Reviewed**: 2025-12-31
**Next Review**: 2026-01-07
