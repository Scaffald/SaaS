#!/bin/bash

# Test script for API Key authentication flow
# This tests the complete end-to-end flow of creating and using API keys

set -e

BASE_URL="http://127.0.0.1:54321/functions/v1"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

echo "========================================="
echo "API Key Authentication Flow Test"
echo "========================================="
echo ""

# Step 1: Sign in as a test user to get JWT token
echo "Step 1: Authenticating as test user..."
echo "Attempting to sign in to get JWT token..."

# First, let's try to create a test user via Supabase Auth
SIGNUP_RESPONSE=$(curl -s -X POST \
  "http://127.0.0.1:54321/auth/v1/signup" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"test-api-key@example.com\",
    \"password\": \"test-password-123\",
    \"data\": {
      \"full_name\": \"API Key Test User\"
    }
  }")

echo "Signup response: $SIGNUP_RESPONSE" | jq '.' || echo "$SIGNUP_RESPONSE"

# Extract access token
ACCESS_TOKEN=$(echo "$SIGNUP_RESPONSE" | jq -r '.access_token // empty')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "No access token in signup response, trying to sign in instead..."

  # Try signing in
  SIGNIN_RESPONSE=$(curl -s -X POST \
    "http://127.0.0.1:54321/auth/v1/token?grant_type=password" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"test-api-key@example.com\",
      \"password\": \"test-password-123\"
    }")

  echo "Signin response: $SIGNIN_RESPONSE" | jq '.' || echo "$SIGNIN_RESPONSE"
  ACCESS_TOKEN=$(echo "$SIGNIN_RESPONSE" | jq -r '.access_token // empty')
fi

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
  echo "❌ Failed to get access token"
  exit 1
fi

echo "✅ Got JWT access token: ${ACCESS_TOKEN:0:50}..."
echo ""

# Step 2: Create an API key using the JWT token
echo "Step 2: Creating API key..."
API_KEY_RESPONSE=$(curl -s -X POST \
  "$BASE_URL/api/v1/api-keys" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test API Key",
    "environment": "test",
    "scopes": ["read:jobs", "write:applications"],
    "rate_limit_tier": "free"
  }')

echo "API Key creation response:"
echo "$API_KEY_RESPONSE" | jq '.' || echo "$API_KEY_RESPONSE"

# Extract the API key
API_KEY=$(echo "$API_KEY_RESPONSE" | jq -r '.data.key // empty')

if [ -z "$API_KEY" ] || [ "$API_KEY" = "null" ]; then
  echo "❌ Failed to create API key"
  echo "Response was: $API_KEY_RESPONSE"
  exit 1
fi

echo "✅ Created API key: $API_KEY"
echo ""

# Step 3: Test authentication with API key
echo "Step 3: Testing API key authentication..."

# Try to list API keys using the API key itself
LIST_RESPONSE=$(curl -s -X GET \
  "$BASE_URL/api/v1/api-keys" \
  -H "Authorization: Bearer $API_KEY")

echo "List API keys response:"
echo "$LIST_RESPONSE" | jq '.' || echo "$LIST_RESPONSE"

if echo "$LIST_RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
  echo "✅ Successfully authenticated with API key"
else
  echo "❌ Failed to authenticate with API key"
  exit 1
fi
echo ""

# Step 4: Test using API key to access a protected endpoint (jobs)
echo "Step 4: Testing API key with jobs endpoint..."

JOBS_RESPONSE=$(curl -s -X GET \
  "$BASE_URL/api/v1/jobs?limit=5" \
  -H "Authorization: Bearer $API_KEY")

echo "Jobs list response:"
echo "$JOBS_RESPONSE" | jq '.' || echo "$JOBS_RESPONSE"

if echo "$JOBS_RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
  echo "✅ Successfully accessed jobs endpoint with API key"
else
  echo "⚠️  Jobs endpoint response may not have data (could be empty)"
fi
echo ""

# Step 5: Check usage tracking
echo "Step 5: Checking usage statistics..."

# Get the API key ID from the list response
API_KEY_ID=$(echo "$LIST_RESPONSE" | jq -r '.data[0].id // empty')

if [ -n "$API_KEY_ID" ] && [ "$API_KEY_ID" != "null" ]; then
  USAGE_RESPONSE=$(curl -s -X GET \
    "$BASE_URL/api/v1/api-keys/$API_KEY_ID/usage?days=1" \
    -H "Authorization: Bearer $API_KEY")

  echo "Usage statistics response:"
  echo "$USAGE_RESPONSE" | jq '.' || echo "$USAGE_RESPONSE"

  if echo "$USAGE_RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
    TOTAL_REQUESTS=$(echo "$USAGE_RESPONSE" | jq -r '.data.total_requests')
    echo "✅ Usage tracking working - $TOTAL_REQUESTS requests tracked"
  else
    echo "❌ Failed to get usage statistics"
  fi
else
  echo "⚠️  Could not get API key ID for usage check"
fi
echo ""

# Step 6: Test revoking API key
echo "Step 6: Testing API key revocation..."

REVOKE_RESPONSE=$(curl -s -X DELETE \
  "$BASE_URL/api/v1/api-keys/$API_KEY_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Revoke response:"
echo "$REVOKE_RESPONSE" | jq '.' || echo "$REVOKE_RESPONSE"

if echo "$REVOKE_RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
  echo "✅ Successfully revoked API key"
else
  echo "❌ Failed to revoke API key"
fi
echo ""

# Step 7: Verify revoked key doesn't work
echo "Step 7: Verifying revoked key is rejected..."

REVOKED_TEST=$(curl -s -X GET \
  "$BASE_URL/api/v1/api-keys" \
  -H "Authorization: Bearer $API_KEY")

if echo "$REVOKED_TEST" | grep -q "revoked\|Invalid API Key"; then
  echo "✅ Revoked API key correctly rejected"
else
  echo "⚠️  Revoked key response: $REVOKED_TEST"
fi
echo ""

echo "========================================="
echo "✅ API Key Authentication Flow Test Complete"
echo "========================================="
