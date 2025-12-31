# Scaffald SDK - Integration Tests

This directory contains comprehensive integration tests for the Scaffald SDK and API Key authentication system.

## What's Tested

### SDK Functionality
- ✅ SDK initialization with configuration
- ✅ Resource availability (jobs, applications, profiles)
- ✅ HTTP client with retry logic
- ✅ Rate limit tracking

### API Key System
- ✅ API key creation via REST API
- ✅ API key format validation
- ✅ SHA-256 hashing and storage
- ✅ Authentication with API keys
- ✅ Authentication with JWT tokens
- ✅ Dual authentication support

### API Key Management
- ✅ List organization's API keys
- ✅ Update API key (rename, activate/deactivate)
- ✅ Revoke API key (soft delete)
- ✅ Verify revoked keys are rejected

### Rate Limiting
- ✅ Rate limit headers (X-RateLimit-*)
- ✅ Per-minute request tracking
- ✅ Tier-based limits (free/pro/enterprise)
- ✅ Rate limit approaching detection

### Usage Tracking
- ✅ Request tracking (endpoint, method, status)
- ✅ Response time measurement
- ✅ Usage analytics endpoint
- ✅ Statistics calculation (total, success, error rate, avg response time)

### Error Handling
- ✅ Invalid API key rejection
- ✅ Malformed API key rejection
- ✅ Proper error messages
- ✅ HTTP status codes

## Running the Tests

### Prerequisites

1. Supabase running locally:
   ```bash
   pnpm supa:start
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

### Run Tests

```bash
# From the project root
cd examples/integration-test
pnpm test
```

### Watch Mode

```bash
pnpm test:watch
```

### Verbose Mode

```bash
pnpm test:verbose
```

## Environment Variables

The tests use these environment variables (with defaults for local development):

```bash
SCAFFALD_API_URL=http://127.0.0.1:54321/functions/v1/api
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...
```

## Test Flow

1. **Setup Phase**
   - Create test user with confirmed email
   - Create test organization
   - Create test team
   - Add user to team as admin
   - Sign in to get JWT access token

2. **Test Phase**
   - SDK initialization test
   - Create API key via REST API
   - Authenticate with API key
   - Authenticate with JWT token
   - Use SDK with API key
   - Test rate limiting
   - Verify usage tracking
   - Update API key
   - Revoke API key
   - Test error handling

3. **Results**
   - Summary of passed/failed tests
   - Exit code 0 on success, 1 on failure

## Expected Output

```
╔════════════════════════════════════════════════════════════════╗
║   Scaffald SDK & API Key System - Integration Tests           ║
╚════════════════════════════════════════════════════════════════╝

[SETUP] Creating test user and organization...
✅ Created user: integration-test-1234567890@scaffald.test
✅ Created organization: abc-123...
✅ Created team: def-456...
✅ Added user to team as admin
✅ Signed in and got access token

[TEST 1] SDK Initialization
✅ SDK initialized with all resources
✅ Jobs, Applications, and Profiles resources available

[TEST 2] API Key Creation via REST API
✅ API key created: sk_test_abc123...
✅ Key ID: xyz-789...
✅ Warning message: "Save this API key now. It will not be shown again."
✅ Key format validation passed

[TEST 3] Authentication with API Key
✅ Successfully authenticated with API key
✅ Found 1 API key(s) in organization
✅ Created key found in organization keys list
✅ Key prefix displayed as: sk_test_abc...

[TEST 4] Authentication with JWT Token
✅ Successfully authenticated with JWT token
✅ Found 1 API key(s)

[TEST 5] SDK Usage with API Key
✅ SDK successfully made request with API key
✅ Jobs response: {"data":[],"total":0}...
✅ Rate limit info available:

[TEST 6] Rate Limiting
✅ Making 5 requests to check rate limit headers...
  Request 1: 99/100 remaining
  Request 2: 98/100 remaining
  Request 3: 97/100 remaining
  Request 4: 96/100 remaining
  Request 5: 95/100 remaining
✅ Rate limit: 100 requests/minute
✅ Remaining: 95
✅ Rate limit approaching: false

[TEST 7] Usage Tracking and Analytics
✅ Usage statistics retrieved successfully
✅ Total requests: 8
✅ Success requests: 8
✅ Error rate: 0.00%
✅ Avg response time: 87ms

[TEST 8] API Key Update
✅ API key updated successfully
✅ New name: Updated Integration Test Key
✅ Update verified in keys list

[TEST 9] API Key Revocation
✅ API key revoked successfully
✅ Message: API key revoked successfully
✅ Revoked key correctly rejected with 401
✅ Error message: API Key Revoked

[TEST 10] Error Handling
✅ Invalid API key correctly rejected
✅ Error message: API key not found or has been revoked
✅ Malformed API key correctly rejected

╔════════════════════════════════════════════════════════════════╗
║   Test Summary                                                 ║
╚════════════════════════════════════════════════════════════════╝
✅ SDK Initialization
✅ API Key Creation
✅ API Key Authentication
✅ JWT Authentication
✅ SDK with API Key
✅ Rate Limiting
✅ Usage Tracking
✅ API Key Update
✅ API Key Revocation
✅ Error Handling

📊 Results: 10/10 tests passed

✅ All integration tests passed!
```

## Cleanup

The tests create temporary test data (user, organization, team) that will remain in the local database. To clean up:

```bash
# Reset local database
pnpm supa:reset
```

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# .github/workflows/integration-tests.yml
- name: Start Supabase
  run: pnpm supa:start

- name: Run Integration Tests
  run: |
    cd examples/integration-test
    pnpm install
    pnpm test
```

## Troubleshooting

**Error: "Failed to create organization"**
- Ensure Supabase is running: `pnpm supa:status`
- Check migrations are applied: `pnpm supa migration list`
- Verify database schema with: `pnpm supa db reset`

**Error: "API key not found"**
- Ensure migration 285 (api_keys_system) is applied
- Check database has `core.api_keys` table

**Error: "Rate limit headers not present"**
- Verify middleware is configured in API router
- Check Edge Functions are running

## Related Documentation

- [API Key Testing Summary](../../API_KEY_TESTING_SUMMARY.md)
- [SDK Documentation](../../packages/scaffald-sdk/README.md)
- [API Documentation](../../docs/api/)
