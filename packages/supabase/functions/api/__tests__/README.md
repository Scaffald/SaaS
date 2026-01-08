# REST API Test Suite

Comprehensive test suite for the Scaffald REST API with 100% coverage requirement.

## 📋 Test Structure

```
__tests__/
├── setup.ts                    # Test environment setup
├── helpers/
│   ├── test-client.ts         # HTTP test client
│   └── fixtures.ts            # Test data generators
├── routes/                     # Unit tests (147 tests)
│   ├── jobs.test.ts           # 26 tests
│   ├── applications.test.ts   # 31 tests
│   ├── profiles.test.ts       # 18 tests
│   ├── oauth.test.ts          # 39 tests
│   └── api-keys.test.ts       # 33 tests
├── integration/               # End-to-end tests (7 tests)
│   ├── auth-flows.test.ts     # 3 tests
│   └── job-application-flow.test.ts  # 4 tests
└── benchmarks/                # Performance benchmarks
    └── rest-vs-trpc.bench.ts  # REST vs tRPC comparison
```

## 🚀 Running Tests Locally

### Prerequisites

1. **Docker Desktop** must be running
2. **Supabase CLI** installed: `pnpm add -g supabase`
3. **Deno** installed: https://deno.land/

### Quick Start

```bash
# Start Supabase local instance
cd packages/supabase
pnpx supabase start

# Apply migrations
pnpx supabase db reset --local

# Run all tests
deno test --allow-all functions/api/__tests__/routes/*.test.ts

# Run with coverage
deno test --allow-all --coverage=coverage functions/api/__tests__/routes/*.test.ts
deno coverage coverage
```

### Test Commands

#### Unit Tests Only
```bash
deno test --allow-all functions/api/__tests__/routes/jobs.test.ts
deno test --allow-all functions/api/__tests__/routes/applications.test.ts
deno test --allow-all functions/api/__tests__/routes/profiles.test.ts
deno test --allow-all functions/api/__tests__/routes/oauth.test.ts
deno test --allow-all functions/api/__tests__/routes/api-keys.test.ts
```

#### Integration Tests
```bash
deno test --allow-all functions/api/__tests__/integration/*.test.ts
```

#### All Tests
```bash
deno test --allow-all functions/api/__tests__/**/*.test.ts
```

#### Performance Benchmarks
```bash
deno bench --allow-all functions/api/__tests__/benchmarks/rest-vs-trpc.bench.ts
```

#### Coverage Report
```bash
# Generate coverage
deno test --allow-all --coverage=coverage functions/api/__tests__/**/*.test.ts

# View coverage summary
deno coverage coverage

# Generate detailed coverage
deno coverage coverage --detailed

# Generate LCOV report
deno coverage coverage --lcov --output=coverage/lcov.info

# View in browser (requires genhtml)
genhtml coverage/lcov.info -o coverage/html
open coverage/html/index.html
```

## 📊 Coverage Requirements

- **Minimum**: 100% (enforced in CI/CD)
- **Current**: See latest CI run or run `deno coverage coverage`

### Coverage by Module

| Module | Endpoints | Tests | Coverage |
|--------|-----------|-------|----------|
| Jobs | 4 | 26 | 100% |
| Applications | 4 | 31 | 100% |
| Profiles | 3 | 18 | 100% |
| OAuth | 6 | 39 | 100% |
| API Keys | 6 | 33 | 100% |
| **Total** | **23** | **147** | **100%** |

## 🧪 Test Categories

### Unit Tests (147 tests)

Test individual endpoints in isolation:
- Request/response validation
- Authentication/authorization
- Input validation
- Error handling
- Edge cases

### Integration Tests (7 tests)

Test complete user workflows:
- **Auth Flows** (3 tests):
  - Magic link authentication
  - OAuth 2.0 with PKCE
  - API key creation and usage

- **Job Application Flow** (4 tests):
  - Job discovery to application
  - Duplicate prevention
  - Deadline enforcement
  - Progressive search refinement

### Performance Benchmarks

Compare REST API vs tRPC performance:
- Response times (avg, p50, p95, p99)
- Throughput (requests/second)
- Concurrent request handling
- Query optimization impact

## 🔧 Test Utilities

### Test Client (`helpers/test-client.ts`)

```typescript
import { createTestClient } from '../helpers/test-client.ts'

const client = createTestClient({ authToken: 'your-token' })

// Make requests
const response = await client.get('/v1/jobs')
const response = await client.post('/v1/applications', { data })

// Assertions
assertSuccessResponse(response)
assertErrorResponse(response)
assertStatus(response, 404)
assertPaginatedResponse(response)
```

### Fixtures (`helpers/fixtures.ts`)

```typescript
import { createTestJob, createTestApiKey } from '../helpers/fixtures.ts'

// Create test data
const job = await createTestJob({ status: 'published' })
const apiKey = await createTestApiKey({ organization_id: org.id })

// Cleanup
await cleanupCurrentTestData()
```

### Setup (`setup.ts`)

```typescript
import { markTestStart, registerUserWithMagicLink } from '../setup.ts'

// Mark test start for cleanup tracking
markTestStart()

// Create authenticated user
const user = await registerUserWithMagicLink('test@example.com')
```

## 🎯 Best Practices

### 1. Always Clean Up

```typescript
Deno.test('My test', async () => {
  markTestStart()  // Mark test start

  // ... test code ...

  await cleanupCurrentTestData()  // Clean up at end
})
```

### 2. Use Fixtures

```typescript
// ❌ Don't create data manually
const { data } = await supabase.from('jobs').insert({ ... })

// ✅ Use fixtures
const job = await createTestJob({ status: 'published' })
```

### 3. Test Assertions

```typescript
// ✅ Use helper assertions
assertSuccessResponse(response)
assertEquals(response.status, 201)
assertExists(response.body.data.id)

// ✅ Check specific error messages
assert(response.body.message?.includes('not found'))
```

### 4. Unique Test Data

```typescript
// ✅ Use timestamps for uniqueness
const email = `test-${Date.now()}@example.com`
const name = `Test Org ${Date.now()}`
```

## 🚨 Troubleshooting

### "Worker failed to boot" Error

**Issue**: API function not starting

**Solutions**:
1. Ensure Docker Desktop is running
2. Restart Supabase: `pnpx supabase stop && pnpx supabase start`
3. Check migrations: `pnpx supabase db reset --local`
4. View logs: `pnpx supabase functions serve api --inspect-mode`

### "Schema cache" Errors

**Issue**: Database schema out of date

**Solution**:
```bash
pnpx supabase db reset --local
```

### Tests Timeout

**Issue**: Slow database or network

**Solutions**:
1. Increase timeout in test: `Deno.test({ timeout: 30000 }, ...)`
2. Check Docker resources (CPU/Memory)
3. Ensure local Supabase is healthy: `pnpx supabase status`

### Port Conflicts

**Issue**: Port 54321 already in use

**Solutions**:
1. Stop other Supabase instances: `pnpx supabase stop --all`
2. Change ports in `supabase/config.toml`
3. Kill process: `lsof -ti:54321 | xargs kill -9`

## 📝 Writing New Tests

### Template for New Endpoint Test

```typescript
Deno.test('VERB /v1/endpoint/:param - does something', async () => {
  markTestStart()

  // Setup
  const user = await registerUserWithMagicLink('test@example.com')
  const client = createTestClient({ authToken: user.token })

  // Execute
  const response = await client.get('/v1/endpoint')

  // Assert
  assertSuccessResponse(response)
  assertEquals(response.status, 200)
  assertExists(response.body.data)

  // Cleanup
  await cleanupCurrentTestData()
})
```

### Template for Integration Test

```typescript
Deno.test('FLOW: Complete user journey description', async () => {
  markTestStart()

  // Step 1: Setup
  const admin = createAdminClient()
  // ... create necessary data

  // Step 2: User action
  const user = await registerUserWithMagicLink('test@example.com')
  const client = createTestClient({ authToken: user.token })

  // Step 3: Perform workflow
  const response1 = await client.get('/v1/endpoint1')
  assertSuccessResponse(response1)

  const response2 = await client.post('/v1/endpoint2', { data })
  assertSuccessResponse(response2)

  // Step 4: Verify end state
  const finalResponse = await client.get('/v1/verify')
  assertSuccessResponse(finalResponse)

  // Cleanup
  await cleanupCurrentTestData()
})
```

## 🔄 CI/CD Integration

Tests run automatically on:
- **Pull Requests** to `main` branch
- **Pushes** to `main` branch

### GitHub Actions Workflow

See `.github/workflows/api-tests.yml` for full configuration.

**Jobs**:
1. **test**: Run all unit and integration tests
2. **benchmark**: Performance benchmarks (PRs only)
3. **lint**: Code linting and formatting
4. **security**: Vulnerability scanning
5. **status-check**: Aggregate status

**Coverage Enforcement**:
- Minimum: 100%
- Blocks PR merge if coverage drops
- Reports uploaded to Codecov

## 📚 Additional Resources

- [Deno Testing](https://deno.land/manual/testing)
- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [REST API Design Principles](../../../scaffald-sdk/docs/migration/adr/001-rest-api-design-principles.md)
- [Testing Checklist](../../../scaffald-sdk/docs/migration/testing-checklist.md)

## 💡 Tips

- Run tests in watch mode: `deno test --allow-all --watch functions/api/__tests__`
- Focus on specific test: Use `Deno.test.only()` during development
- Skip slow tests: Use `Deno.test.ignore()` temporarily
- Debug tests: Add `--inspect-brk` flag and use Chrome DevTools
- Parallel execution: Deno runs tests in parallel by default
- Test isolation: Each test should be independent

## 🎉 Success Criteria

✅ All 154 tests passing
✅ 100% code coverage
✅ No security vulnerabilities
✅ Performance benchmarks meet targets:
  - p95 latency < 200ms
  - p99 latency < 500ms
  - Throughput > 100 req/s

---

**Last Updated**: 2025-12-31
**Maintained By**: Engineering Team
**Questions?**: Open an issue or check the migration docs
