# tRPC Endpoint Testing Guide

This directory contains testing documentation and utilities for the tRPC endpoints.

## Prerequisites

- Local Supabase instance running (`pnpm supa start`)
- Supabase environment variables set
- Test data seeded in database

## Testing Approaches

### 1. Manual Testing with curl

The most straightforward way to test tRPC endpoints:

```bash
# Test getPublishedJobs (no auth required)
curl "http://127.0.0.1:54321/functions/v1/trpc/jobs.getPublishedJobs?batch=1&input=%7B%220%22%3A%7B%22search%22%3A%22%22%7D%7D"

# Test with search parameter
curl "http://127.0.0.1:54321/functions/v1/trpc/jobs.getPublishedJobs?batch=1&input=%7B%220%22%3A%7B%22search%22%3A%22construction%22%2C%22limit%22%3A5%7D%7D"

# Test getInternalJobFilterOptions
curl "http://127.0.0.1:54321/functions/v1/trpc/jobs.getInternalJobFilterOptions"

# Test getExternalJobs
curl "http://127.0.0.1:54321/functions/v1/trpc/jobs.getExternalJobs"

# Test getFilterOptions
curl "http://127.0.0.1:54321/functions/v1/trpc/jobs.getFilterOptions"
```

### 2. Using Browser Extensions

#### Thunder Client (VS Code)
1. Install Thunder Client extension
2. Create new request
3. Set URL: `http://127.0.0.1:54321/functions/v1/trpc/jobs.getPublishedJobs`
4. Add query parameter `input`: `{"0":{"search":""}}`
5. Send request

#### REST Client (VS Code)
Create a `.http` file:

```http
### Get Published Jobs
GET http://127.0.0.1:54321/functions/v1/trpc/jobs.getPublishedJobs?batch=1&input={"0":{"search":""}}

### Get Published Jobs with Search
GET http://127.0.0.1:54321/functions/v1/trpc/jobs.getPublishedJobs?batch=1&input={"0":{"search":"construction","limit":5}}

### Get Filter Options
GET http://127.0.0.1:54321/functions/v1/trpc/jobs.getInternalJobFilterOptions

### Get External Jobs  
GET http://127.0.0.1:54321/functions/v1/trpc/jobs.getExternalJobs

### Get External Job Filters
GET http://127.0.0.1:54321/functions/v1/trpc/jobs.getFilterOptions
```

### 3. Testing with Postman

1. Create new request
2. Method: GET
3. URL: `http://127.0.0.1:54321/functions/v1/trpc/jobs.getPublishedJobs`
4. Params:
   - `batch`: `1`
   - `input`: `{"0":{"search":""}}`
5. Send

## Test Cases

### Jobs Router

#### ✅ getPublishedJobs
**Purpose**: Fetch published internal jobs with polymorphic skills

**Test Cases**:
1. **No parameters** - Should return all published jobs
   ```bash
   curl "http://127.0.0.1:54321/functions/v1/trpc/jobs.getPublishedJobs?batch=1&input=%7B%220%22%3A%7B%7D%7D"
   ```
   
2. **With search** - Should filter by title/description
   ```bash
   curl "http://127.0.0.1:54321/functions/v1/trpc/jobs.getPublishedJobs?batch=1&input=%7B%220%22%3A%7B%22search%22%3A%22construction%22%7D%7D"
   ```
   
3. **With pagination** - Should respect limit/offset
   ```bash
   curl "http://127.0.0.1:54321/functions/v1/trpc/jobs.getPublishedJobs?batch=1&input=%7B%220%22%3A%7B%22limit%22%3A5%2C%22offset%22%3A0%7D%7D"
   ```

**Expected Response**:
```json
{
  "result": {
    "data": {
      "jobs": [
        {
          "id": "uuid",
          "title": "string",
          "description": "string",
          "organization": { "id": "uuid", "name": "string" },
          "skills": [
            {
              "id": "string",
              "name": "string",
              "taxonomy": "csi" | "onet"
            }
          ],
          "certifications": [...]
        }
      ],
      "total": 0
    }
  }
}
```

#### ✅ getJobDetails
**Purpose**: Get full job details by ID

**Test**:
```bash
curl "http://127.0.0.1:54321/functions/v1/trpc/jobs.getJobDetails?batch=1&input=%7B%220%22%3A%7B%22id%22%3A%22JOB_UUID_HERE%22%7D%7D"
```

#### ✅ getInternalJobFilterOptions
**Purpose**: Get available filters for internal jobs

**Test**:
```bash
curl "http://127.0.0.1:54321/functions/v1/trpc/jobs.getInternalJobFilterOptions"
```

**Expected Response**:
```json
{
  "result": {
    "data": {
      "employmentTypes": ["full-time", "part-time", ...],
      "remoteOptions": ["remote", "hybrid", "on-site"],
      "locations": ["City, State", ...],
      "certifications": ["Cert Name", ...],
      "skills": ["Skill Name", ...]
    }
  }
}
```

#### ✅ getExternalJobs
**Purpose**: Fetch external job postings

**Test**:
```bash
curl "http://127.0.0.1:54321/functions/v1/trpc/jobs.getExternalJobs"
```

#### ✅ getFilterOptions
**Purpose**: Get filter options for external jobs

**Test**:
```bash
curl "http://127.0.0.1:54321/functions/v1/trpc/jobs.getFilterOptions"
```

### Office Router

#### ⚠️ Note: Office endpoints require super admin authentication

**Get Auth Token**:
```bash
# Sign in as admin user
curl -X POST 'http://127.0.0.1:54321/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"adminpassword"}'
```

**Use Token in Request**:
```bash
curl "http://127.0.0.1:54321/functions/v1/trpc/office.getJob?batch=1&input=%7B%220%22%3A%7B%22id%22%3A%22JOB_UUID%22%7D%7D" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Validating Polymorphic Skills

When testing job endpoints, verify that skills are returned with:
1. `id` - The skill identifier (CSI UUID or O*NET code)
2. `name` - The skill name
3. `taxonomy` - Either "csi" or "onet"

Example validation:
```javascript
// Check if skills are properly transformed
const job = response.result.data.jobs[0];
if (job.skills && job.skills.length > 0) {
  const skill = job.skills[0];
  console.assert(skill.id, "Skill should have id");
  console.assert(skill.name, "Skill should have name");
  console.assert(['csi', 'onet'].includes(skill.taxonomy), "Skill should have valid taxonomy");
}
```

## Common Issues

### 1. "Could not find a relationship between 'job_skills' and 'skills'"
**Cause**: Query still using old `skills` table reference
**Fix**: Update query to use polymorphic pattern with `csi!csi_skill_id` and `onet!onet_occupation_id`

### 2. Empty skills array
**Possible causes**:
- No skills seeded in database
- Skills not properly linked to jobs
- Query not joining correctly

### 3. TypeError in skill transformation
**Cause**: Skill data structure doesn't match expected format
**Fix**: Check `transformJobSkills` function handles all edge cases

## Automated Testing (Future)

For automated testing, consider:
1. **Deno tests** - For unit testing transformation functions
2. **Integration tests** - Using Node.js test runner with Supabase client
3. **E2E tests** - With Playwright or Cypress for full workflow testing

## Running Tests in CI/CD

Add to GitHub Actions workflow:
```yaml
- name: Test tRPC Endpoints
  run: |
    # Start Supabase
    pnpm supa start
    
    # Run curl tests
    ./test-endpoints.sh
    
    # Stop Supabase
    pnpm supa stop
```

## Monitoring in Production

Add logging to track:
- Endpoint response times
- Error rates
- Skill transformation success rate
- RLS policy enforcement

## Additional Resources

- [tRPC Documentation](https://trpc.io)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Testing Best Practices](../README.md)
