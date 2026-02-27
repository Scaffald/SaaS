# Phase 20 API Testing & Validation Guide

## Overview

This guide provides comprehensive testing procedures for the Phase 20 API migrations:
- ✅ user-profiles (8 endpoints)
- ✅ workers (2 endpoints)
- ✅ personality-assessment (14 endpoints)

**Total New Endpoints**: 24 REST API endpoints

---

## Prerequisites

### 1. Environment Setup

```bash
# Navigate to project root
cd /Users/clay/Development/UNI-Construct

# Ensure Supabase is running
supabase status

# Verify API is accessible
curl http://localhost:54321/functions/v1/api/v1/workers
```

### 2. Test Credentials

Create test user and API key:
```sql
-- In Supabase SQL Editor
INSERT INTO auth.users (id, email, encrypted_password)
VALUES ('test-user-123', 'test@example.com', 'hashed-password');

INSERT INTO api_keys (key, user_id, name)
VALUES ('test_key_12345', 'test-user-123', 'Integration Test Key');
```

---

## Automated Testing

### Run Integration Tests

```bash
# Navigate to SDK package
cd packages/scaffald-sdk

# Run Phase 20 integration tests
pnpm test src/__tests__/integration/phase20-apis.test.ts

# Run all SDK tests
pnpm test

# Generate coverage report
pnpm test:coverage
```

**Expected Results:**
- ✅ All integration tests pass
- ✅ 100% coverage on new resources
- ✅ No TypeScript errors

---

## Manual Testing Checklist

### A. User Profiles API (8 endpoints)

#### 1. GET /v1/user-profiles/:userId/preview

**Purpose**: Lightweight profile for map/card views

```bash
# Using curl
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:54321/functions/v1/api/v1/user-profiles/test-user-123/preview

# Using SDK
const preview = await client.userProfiles.getPreview({
  userId: 'test-user-123'
})
```

**Verify:**
- [ ] Returns 200 OK
- [ ] Contains: id, displayName, avatarUrl, location
- [ ] topSkills array present
- [ ] Response time < 200ms

#### 2. GET /v1/user-profiles/:userId

**Purpose**: Comprehensive profile details

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:54321/functions/v1/api/v1/user-profiles/test-user-123
```

**Verify:**
- [ ] Returns 200 OK
- [ ] Contains: bio, headline, years_of_experience
- [ ] All profile fields present
- [ ] Response time < 300ms

#### 3. GET /v1/user-profiles/:userId/skills

**Purpose**: Skills with CSI/O*NET enrichment

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:54321/functions/v1/api/v1/user-profiles/test-user-123/skills
```

**Verify:**
- [ ] Returns array of skills
- [ ] Each skill has: proficiency_level, skill_details
- [ ] Enrichment data present (CSI/ONET)
- [ ] Ordered by proficiency

#### 4. GET /v1/user-profiles/:userId/certifications

**Purpose**: User certifications

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:54321/functions/v1/api/v1/user-profiles/test-user-123/certifications
```

**Verify:**
- [ ] Returns array of certifications
- [ ] Contains certification details
- [ ] Expiration tracking works

#### 5. GET /v1/user-profiles/:userId/experience

**Purpose**: Work experience history

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:54321/functions/v1/api/v1/user-profiles/test-user-123/experience
```

**Verify:**
- [ ] Returns work history
- [ ] Current position marked correctly
- [ ] Ordered by date

#### 6. GET /v1/user-profiles/:userId/education

**Purpose**: Education history

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:54321/functions/v1/api/v1/user-profiles/test-user-123/education
```

**Verify:**
- [ ] Returns education entries
- [ ] Degrees listed correctly
- [ ] Current education flagged

#### 7. GET /v1/user-profiles/:userId/reviews-summary

**Purpose**: Aggregated review metrics

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:54321/functions/v1/api/v1/user-profiles/test-user-123/reviews-summary
```

**Verify:**
- [ ] Returns totalReviews, averageRating
- [ ] Category breakdown present
- [ ] Recent reviews included

#### 8. GET /v1/user-profiles/:userId/contact-info

**Purpose**: Contact information (gated)

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:54321/functions/v1/api/v1/user-profiles/test-user-123/contact-info?applicationId=app-123"
```

**Verify:**
- [ ] Returns accessible: true/false
- [ ] If accessible, includes email/phone
- [ ] If not accessible, includes reason
- [ ] Success fee gating works

---

### B. Workers API (2 endpoints)

#### 1. GET /v1/workers

**Purpose**: Worker discovery and search

```bash
# List all workers
curl http://localhost:54321/functions/v1/api/v1/workers

# Search workers
curl "http://localhost:54321/functions/v1/api/v1/workers?search=carpenter&limit=10"

# Filter by industry
curl "http://localhost:54321/functions/v1/api/v1/workers?industryIds[]=industry_1"

# Filter by skills
curl "http://localhost:54321/functions/v1/api/v1/workers?skillIds[]=skill_1&skillIds[]=skill_2"
```

**Verify:**
- [ ] Returns { workers: [], total: number }
- [ ] Search filtering works
- [ ] Limit parameter respected
- [ ] Industry filtering works
- [ ] Skill filtering works
- [ ] Response time < 500ms

#### 2. GET /v1/workers/:id

**Purpose**: Single worker profile

```bash
curl http://localhost:54321/functions/v1/api/v1/workers/test-user-123
```

**Verify:**
- [ ] Returns worker details
- [ ] Contains: name, about, avatar_path
- [ ] 404 for non-existent worker

---

### C. Personality Assessment API (14 endpoints)

#### 1. GET /v1/personality-assessment/status

**Purpose**: Overall assessment progress

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:54321/functions/v1/api/v1/personality-assessment/status
```

**Verify:**
- [ ] Returns overall_status (not_started, in_progress, completed)
- [ ] Shows current_step
- [ ] Test completion flags correct
- [ ] Cooldown info present

#### 2. GET /v1/personality-assessment/ipip/status

**Purpose**: IPIP test progress

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:54321/functions/v1/api/v1/personality-assessment/ipip/status
```

**Verify:**
- [ ] Returns progress tracking
- [ ] Question counts correct
- [ ] Completion status accurate

#### 3. GET /v1/personality-assessment/luscher-1/status

**Purpose**: Luscher Test 1 status

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:54321/functions/v1/api/v1/personality-assessment/luscher-1/status
```

**Verify:**
- [ ] Returns test status
- [ ] Completion tracking works

#### 4. GET /v1/personality-assessment/luscher-2/status

**Purpose**: Luscher Test 2 status

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:54321/functions/v1/api/v1/personality-assessment/luscher-2/status
```

**Verify:**
- [ ] Returns test status
- [ ] Completion tracking works

#### 5. GET /v1/personality-assessment/luscher/availability

**Purpose**: Check cooldown status

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:54321/functions/v1/api/v1/personality-assessment/luscher/availability
```

**Verify:**
- [ ] Returns available: boolean
- [ ] Cooldown timer present if not available
- [ ] 60s cooldown enforced between tests

#### 6. POST /v1/personality-assessment/luscher-1

**Purpose**: Save Luscher Test 1

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"responses":[{"position":1,"color_id":"red"}]}' \
  http://localhost:54321/functions/v1/api/v1/personality-assessment/luscher-1
```

**Verify:**
- [ ] Saves responses correctly
- [ ] Returns success: true
- [ ] Updates assessment status
- [ ] Starts cooldown timer

#### 7. POST /v1/personality-assessment/ipip

**Purpose**: Save IPIP progress (incremental)

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"answers":[{"question_number":1,"score":5}]}' \
  http://localhost:54321/functions/v1/api/v1/personality-assessment/ipip
```

**Verify:**
- [ ] Saves incremental progress
- [ ] Awards +50 XP on completion
- [ ] Calculates archetype on completion
- [ ] Updates completion status

#### 8. POST /v1/personality-assessment/luscher-2

**Purpose**: Save Luscher Test 2

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"responses":[{"position":1,"color_id":"blue"}]}' \
  http://localhost:54321/functions/v1/api/v1/personality-assessment/luscher-2
```

**Verify:**
- [ ] Saves responses correctly
- [ ] Marks assessment complete
- [ ] Awards XP appropriately

#### 9. POST /v1/personality-assessment/luscher/session

**Purpose**: Save unified Luscher session

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"test1_responses":[],"test2_responses":[]}' \
  http://localhost:54321/functions/v1/api/v1/personality-assessment/luscher/session
```

**Verify:**
- [ ] Saves both tests in one call
- [ ] Awards +5 XP
- [ ] 7-day cooldown enforced

#### 10. PUT /v1/personality-assessment/step

**Purpose**: Update current step

```bash
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"step":"ipip_test"}' \
  http://localhost:54321/functions/v1/api/v1/personality-assessment/step
```

**Verify:**
- [ ] Updates current_step
- [ ] Returns success: true

#### 11. POST /v1/personality-assessment/share

**Purpose**: Generate share token

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:54321/functions/v1/api/v1/personality-assessment/share
```

**Verify:**
- [ ] Generates UUID token
- [ ] Awards +5 XP on first share
- [ ] Returns token in response

#### 12. DELETE /v1/personality-assessment/share/:token

**Purpose**: Revoke share token

```bash
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:54321/functions/v1/api/v1/personality-assessment/share/token-uuid
```

**Verify:**
- [ ] Revokes token successfully
- [ ] Returns success: true

#### 13. POST /v1/personality-assessment/report

**Purpose**: Generate AI report via GPT-4

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:54321/functions/v1/api/v1/personality-assessment/report
```

**Verify:**
- [ ] Generates report from Luscher results
- [ ] Uses OpenAI GPT-4
- [ ] Returns markdown formatted report
- [ ] Saves report to database

#### 14. POST /v1/personality-assessment/xp/results-view

**Purpose**: Award XP for viewing results

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:54321/functions/v1/api/v1/personality-assessment/xp/results-view
```

**Verify:**
- [ ] Awards +2 XP on first view
- [ ] Only awards once
- [ ] Returns success: true

---

## Error Handling Tests

### Authentication Errors

```bash
# Test without token
curl http://localhost:54321/functions/v1/api/v1/personality-assessment/status
# Expected: 401 Unauthorized

# Test with invalid token
curl -H "Authorization: Bearer invalid-token" \
  http://localhost:54321/functions/v1/api/v1/personality-assessment/status
# Expected: 401 Unauthorized
```

**Verify:**
- [ ] 401 for missing auth
- [ ] 401 for invalid token
- [ ] Proper error messages

### Not Found Errors

```bash
# Test non-existent user
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:54321/functions/v1/api/v1/user-profiles/non-existent-user
# Expected: 404 Not Found

# Test non-existent worker
curl http://localhost:54321/functions/v1/api/v1/workers/non-existent-worker
# Expected: 404 Not Found
```

**Verify:**
- [ ] 404 for non-existent resources
- [ ] Proper error messages

### Validation Errors

```bash
# Test invalid limit
curl "http://localhost:54321/functions/v1/api/v1/workers?limit=-1"
# Expected: 400 Bad Request

# Test invalid parameters
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invalid":"data"}' \
  http://localhost:54321/functions/v1/api/v1/personality-assessment/luscher-1
# Expected: 400 Bad Request
```

**Verify:**
- [ ] 400 for invalid parameters
- [ ] Validation error details returned

### Rate Limiting

```bash
# Make 150 requests rapidly
for i in {1..150}; do
  curl http://localhost:54321/functions/v1/api/v1/workers
done
# Expected: 429 Too Many Requests after ~100 requests
```

**Verify:**
- [ ] Rate limit enforced (100 req/15min)
- [ ] 429 status code
- [ ] Retry-After header present
- [ ] X-RateLimit headers present

---

## Performance Benchmarking

### Response Time Targets

```bash
# Install Apache Bench
brew install httpd

# Benchmark user profiles endpoint
ab -n 1000 -c 10 -H "Authorization: Bearer $TOKEN" \
  http://localhost:54321/functions/v1/api/v1/user-profiles/test-user-123/preview

# Benchmark workers search
ab -n 1000 -c 10 \
  http://localhost:54321/functions/v1/api/v1/workers?limit=20
```

**Performance Targets:**
- [ ] GET /user-profiles/:id/preview < 200ms (p95)
- [ ] GET /user-profiles/:id < 300ms (p95)
- [ ] GET /workers < 500ms (p95)
- [ ] POST /personality-assessment/* < 400ms (p95)

### Load Testing

```bash
# Install k6
brew install k6

# Run load test (create k6-load-test.js)
k6 run k6-load-test.js
```

**Load Test Scenarios:**
1. 100 concurrent users for 5 minutes
2. Ramp up to 500 users over 10 minutes
3. Spike test: 1000 users for 1 minute

**Verify:**
- [ ] No errors under normal load (100 users)
- [ ] Graceful degradation under high load
- [ ] Response times within SLA

---

## Security Testing

### 1. SQL Injection

```bash
# Test for SQL injection in search
curl "http://localhost:54321/functions/v1/api/v1/workers?search='; DROP TABLE users--"
```

**Verify:**
- [ ] No SQL injection vulnerability
- [ ] Proper input sanitization

### 2. XSS Prevention

```bash
# Test for XSS in input
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"step":"<script>alert(1)</script>"}' \
  http://localhost:54321/functions/v1/api/v1/personality-assessment/step
```

**Verify:**
- [ ] No XSS vulnerability
- [ ] HTML entities escaped

### 3. Authorization Checks

```bash
# Try to access another user's assessment
curl -H "Authorization: Bearer $TOKEN_USER_1" \
  http://localhost:54321/functions/v1/api/v1/personality-assessment/status
```

**Verify:**
- [ ] Users can only access their own assessments
- [ ] Proper authorization checks
- [ ] 403 Forbidden for unauthorized access

---

## Integration Flow Tests

### User Profile Discovery Flow

1. Search for workers
2. Get worker preview
3. View full profile
4. Check contact info (gated)
5. View skills/experience/education
6. Read reviews

```bash
# Complete flow script
./scripts/test-profile-discovery.sh
```

**Verify:**
- [ ] Complete flow works end-to-end
- [ ] No broken links between endpoints
- [ ] Data consistency across endpoints

### Assessment Completion Flow

1. Get assessment status
2. Complete Luscher Test 1
3. Wait for cooldown
4. Complete IPIP test
5. Complete Luscher Test 2
6. Generate report
7. Share results

```bash
# Complete flow script
./scripts/test-assessment-flow.sh
```

**Verify:**
- [ ] Complete flow works end-to-end
- [ ] Cooldowns enforced properly
- [ ] XP awarded correctly
- [ ] State transitions valid

---

## Monitoring & Observability

### Metrics to Track

1. **Response Times**
   - p50, p95, p99 latencies
   - By endpoint

2. **Error Rates**
   - 4xx errors
   - 5xx errors
   - By endpoint

3. **Throughput**
   - Requests per second
   - By endpoint

4. **Resource Usage**
   - CPU utilization
   - Memory usage
   - Database connections

### Logging

**Verify logs contain:**
- [ ] Request IDs for tracing
- [ ] User IDs (when authenticated)
- [ ] Error stack traces
- [ ] Performance metrics

---

## Rollback Plan

If issues are detected:

1. **Identify Issue**
   - Check logs
   - Review error rates
   - Check performance metrics

2. **Rollback Options**
   ```bash
   # Revert to previous commit
   git revert <commit-hash>

   # Or disable routes in index.ts
   # Comment out problematic routes
   ```

3. **Communicate**
   - Notify team of rollback
   - Document issue in incident report
   - Schedule fix

---

## Success Criteria

### All Tests Pass ✅

- [ ] All automated tests passing
- [ ] All manual tests completed
- [ ] All integration flows working
- [ ] Performance within targets
- [ ] No security vulnerabilities
- [ ] Error handling correct
- [ ] Rate limiting working
- [ ] Authentication/authorization secure

### Production Ready Checklist

- [ ] Code reviewed
- [ ] Tests at 100% coverage
- [ ] Documentation complete
- [ ] Performance validated
- [ ] Security audited
- [ ] Monitoring configured
- [ ] Rollback plan tested
- [ ] Team trained on new APIs

---

## Next Steps

1. **Deploy to Staging**
   - Run full test suite
   - Monitor for 24 hours

2. **Deploy to Production**
   - Gradual rollout (10% → 50% → 100%)
   - Monitor error rates
   - Watch performance

3. **Component Migration**
   - Update 18 component files
   - Replace tRPC calls with SDK
   - Test each component

4. **Cleanup**
   - Remove deprecated tRPC procedures
   - Update documentation
   - Archive old code

---

## Contact & Support

**For Issues:**
- Check logs: `/var/log/supabase/functions/`
- Review metrics dashboard
- Contact: dev-team@scaffald.com

**Documentation:**
- API Docs: `/packages/scaffald-sdk/README.md`
- Architecture: `/packages/scaffald-sdk/ARCHITECTURE.md`
- Migration Guide: `/packages/scaffald-sdk/SDK_MIGRATION_GUIDELINES.md`
