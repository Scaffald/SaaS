#!/bin/bash
# Test script for tRPC endpoints
# Run this after starting local Supabase: pnpm supa start

set -e

BASE_URL="http://127.0.0.1:54321/functions/v1/trpc"
PASSED=0
FAILED=0

# Get Supabase anon key from environment or use default
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing tRPC Endpoints..."
echo "================================"
echo ""

# Test function
test_endpoint() {
  local name=$1
  local url=$2
  local expected_code=${3:-200}
  
  echo -n "Testing $name... "
  
  response=$(curl -s -w "\n%{http_code}" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
    "$url")
  http_code=$(echo "$response" | tail -1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" -eq "$expected_code" ]; then
    echo -e "${GREEN}✅ PASSED${NC} (HTTP $http_code)"
    PASSED=$((PASSED + 1))
    
    # Check for errors in response
    if echo "$body" | grep -q '"error"'; then
      echo -e "${RED}   ⚠️  Response contains errors:${NC}"
      echo "$body" | jq '.error.message' 2>/dev/null || echo "$body"
      FAILED=$((FAILED + 1))
      PASSED=$((PASSED - 1))
    fi
  else
    echo -e "${RED}❌ FAILED${NC} (Expected $expected_code, got $http_code)"
    FAILED=$((FAILED + 1))
    echo "Response: $body"
  fi
}

# Test Jobs Router
echo -e "${YELLOW}📋 Jobs Router Tests${NC}"
echo "-------------------"

test_endpoint \
  "getPublishedJobs" \
  "${BASE_URL}/jobs.getPublishedJobs?batch=1&input=%7B%220%22%3A%7B%22search%22%3A%22%22%7D%7D"

test_endpoint \
  "getPublishedJobs with search" \
  "${BASE_URL}/jobs.getPublishedJobs?batch=1&input=%7B%220%22%3A%7B%22search%22%3A%22construction%22%2C%22limit%22%3A5%7D%7D"

test_endpoint \
  "getInternalJobFilterOptions" \
  "${BASE_URL}/jobs.getInternalJobFilterOptions"

test_endpoint \
  "getExternalJobs" \
  "${BASE_URL}/jobs.getExternalJobs"

test_endpoint \
  "getFilterOptions" \
  "${BASE_URL}/jobs.getFilterOptions"

echo ""
echo "================================"
echo -e "Test Results: ${GREEN}${PASSED} passed${NC}, ${RED}${FAILED} failed${NC}"
echo "================================"

if [ $FAILED -gt 0 ]; then
  exit 1
fi
