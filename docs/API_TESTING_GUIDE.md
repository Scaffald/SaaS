# REST API Local Testing Guide

## Current Status

✅ **Supabase Running**: http://127.0.0.1:54321
✅ **32 Routes Created**: All REST API routes implemented
✅ **Routes Registered**: All routes added to `index.ts`
⚠️ **Function Serving**: Edge Function needs manual serving

---

## Issue: Edge Function Not Auto-Serving

The `api` Edge Function isn't being automatically picked up by Supabase local. This is normal - Edge Functions need to be explicitly served in development.

### Solution: Serve the Function Manually

Open a **new terminal window** and run:

```bash
cd /Users/clay/Development/UNI-Construct

# Serve the API function
supabase functions serve api --no-verify-jwt --env-file packages/supabase/.env.local
```

This will:
- Start the API function on port 54321
- Disable JWT verification for easier testing
- Load environment variables

---

## Testing the REST API

Once the function is serving, test with these curl commands:

### 1. Health Check (No Auth Required)

```bash
curl http://127.0.0.1:54321/functions/v1/api/health | jq .
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-12T...",
  "version": "1.0.0"
}
```

### 2. Get a JWT Token

First, create a test user in Supabase Studio:
1. Open http://127.0.0.1:54323
2. Go to Authentication > Users
3. Click "Add User"
4. Email: `test@example.com`
5. Password: `test123456`

Then get a token:

```bash
curl -X POST http://127.0.0.1:54321/auth/v1/token?grant_type=password \
  -H "apikey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }' | jq -r '.access_token'
```

Save the token as an environment variable:

```bash
export TOKEN="eyJhbGc..."
```

### 3. Test Priority 1 Routes (High Traffic)

#### Connections
```bash
# List connections
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:54321/functions/v1/api/v1/connections | jq .

# Get pending requests
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:54321/functions/v1/api/v1/connections/pending | jq .

# Send connection request
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetUserId": "uuid-here"}' \
  http://127.0.0.1:54321/functions/v1/api/v1/connections/request | jq .
```

#### Follows
```bash
# Get following list
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:54321/functions/v1/api/v1/follows/following | jq .

# Get followers
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:54321/functions/v1/api/v1/follows/followers | jq .

# Follow a user
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetUserId": "uuid-here"}' \
  http://127.0.0.1:54321/functions/v1/api/v1/follows/user | jq .
```

#### Engagement Tracking
```bash
# Track an event
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventType": "profile_view", "targetType": "user", "targetId": "uuid-here"}' \
  http://127.0.0.1:54321/functions/v1/api/v1/engagement/track | jq .

# Get recent activity
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:54321/functions/v1/api/v1/engagement/activity | jq .

# Get metrics
curl -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:54321/functions/v1/api/v1/engagement/metrics?days=30" | jq .
```

#### Notifications
```bash
# List notifications
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:54321/functions/v1/api/v1/notifications | jq .

# Get unread count
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:54321/functions/v1/api/v1/notifications/unread-count | jq .

# Mark all as read
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:54321/functions/v1/api/v1/notifications/read-all | jq .
```

### 4. Test Priority 2 Routes (Profile Features)

#### Skills
```bash
# Get soft skills
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:54321/functions/v1/api/v1/profiles/skills/soft | jq .

# Get user skills
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:54321/functions/v1/api/v1/profiles/skills | jq .
```

#### Experience
```bash
# Get experience
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:54321/functions/v1/api/v1/profiles/experience | jq .

# Save experience
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"career_level": "mid", "experience_entries": []}' \
  http://127.0.0.1:54321/functions/v1/api/v1/profiles/experience | jq .
```

#### Education
```bash
# Get education
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:54321/functions/v1/api/v1/profiles/education | jq .
```

#### Certifications
```bash
# Get top-level certifications
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:54321/functions/v1/api/v1/profiles/certifications/top-level | jq .

# Get user's certification tree
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:54321/functions/v1/api/v1/profiles/certifications/tree | jq .
```

#### Portfolio
```bash
# List portfolio items
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:54321/functions/v1/api/v1/profiles/portfolio | jq .

# Create portfolio item
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "My Project", "description": "A cool project"}' \
  http://127.0.0.1:54321/functions/v1/api/v1/profiles/portfolio | jq .
```

### 5. Test Priority 3 Routes (Advanced Features)

#### Profile Widgets
```bash
# Get general info widget
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:54321/functions/v1/api/v1/profiles/widgets/general-info | jq .

# Get experience widget
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:54321/functions/v1/api/v1/profiles/widgets/experience | jq .
```

#### Profile Completion
```bash
# Get completion status
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:54321/functions/v1/api/v1/profiles/completion/status | jq .

# Get benefits messaging
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:54321/functions/v1/api/v1/profiles/completion/benefits | jq .
```

#### Profile Views
```bash
# Record a profile view
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"profileUserId": "uuid-here"}' \
  http://127.0.0.1:54321/functions/v1/api/v1/profile-views/record | jq .

# Get profile views
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:54321/functions/v1/api/v1/profile-views | jq .

# Get analytics
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:54321/functions/v1/api/v1/profile-views/analytics | jq .
```

---

## Alternative: Use Postman/Insomnia

For easier testing, import this collection:

1. **Base URL**: `http://127.0.0.1:54321/functions/v1/api`
2. **Auth**: Bearer Token (get from auth endpoint)
3. **Headers**:
   - `Content-Type: application/json`
   - `Authorization: Bearer {token}`

### Postman Collection

```json
{
  "info": {
    "name": "Scaffald REST API - Local",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/health"
      }
    },
    {
      "name": "Connections - List",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/v1/connections",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ]
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://127.0.0.1:54321/functions/v1/api"
    },
    {
      "key": "token",
      "value": "your-jwt-token-here"
    }
  ]
}
```

---

## Troubleshooting

### Error: "Function not found"

**Cause**: Edge Function not served
**Solution**: Run `supabase functions serve api` in a separate terminal

### Error: "Unauthorized"

**Cause**: Missing or invalid JWT token
**Solution**: Get a new token using the auth endpoint

### Error: "Table does not exist"

**Cause**: Database tables not created
**Solution**: Run migrations or create tables in Supabase Studio

### Error: "Cannot read properties of undefined"

**Cause**: Missing user context or malformed request
**Solution**: Check request body format and ensure user is authenticated

---

## Next Steps After Local Testing

Once you verify the API works locally:

1. ✅ **Fix any bugs** found during testing
2. ✅ **Create missing database tables** if needed
3. ✅ **Deploy to production**: `supabase functions deploy api`
4. ✅ **Create missing SDK hooks** (7 remaining)
5. ✅ **Start component migration** (~60 files)

---

## Quick Test Script

Save as `scripts/test-api.sh` or run from repo root:

```bash
#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BASE_URL="http://127.0.0.1:54321/functions/v1/api"

echo "🧪 Testing Scaffald REST API"
echo "=============================="

# Test health endpoint
echo -e "\n${GREEN}Testing health endpoint...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health)
if [ $HTTP_CODE -eq 200 ]; then
  echo -e "${GREEN}✅ Health check passed${NC}"
  curl -s $BASE_URL/health | jq .
else
  echo -e "${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
  echo "Make sure to run: supabase functions serve api"
fi

# Check if function is running
if [ $HTTP_CODE -eq 404 ]; then
  echo -e "\n${RED}⚠️  API function not found${NC}"
  echo "Run this in another terminal:"
  echo "  supabase functions serve api --no-verify-jwt"
fi
```

Run with:
```bash
chmod +x scripts/test-api.sh && ./scripts/test-api.sh
```

---

## Summary

- ✅ **32 REST API routes created**
- ✅ **All routes registered in index.ts**
- ⏳ **Waiting for Edge Function to be served**
- ⏳ **Database tables need verification**

To continue testing, run in a **new terminal**:

```bash
cd /Users/clay/Development/UNI-Construct
supabase functions serve api --no-verify-jwt
```

Then use the curl commands above to test each endpoint!
