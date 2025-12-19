#!/bin/bash
# Test Runner for tRPC Tests
# Executes tests in the correct order with proper auth setup

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         tRPC Test Suite with Auth Integration            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Supabase is running
echo -e "${YELLOW}🔍 Checking Supabase status...${NC}"
if ! curl -s http://127.0.0.1:54321/rest/v1/ > /dev/null 2>&1; then
  echo -e "${RED}❌ Supabase is not running!${NC}"
  echo -e "${YELLOW}   Please start Supabase first:${NC}"
  echo -e "   ${BLUE}pnpm supa start${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Supabase is running${NC}"
echo ""

# Check if Inbucket is running
echo -e "${YELLOW}🔍 Checking Inbucket (email testing) status...${NC}"
if ! curl -s http://127.0.0.1:54324/api/v1/mailbox > /dev/null 2>&1; then
  echo -e "${RED}❌ Inbucket is not running!${NC}"
  echo -e "${YELLOW}   Inbucket should start automatically with Supabase${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Inbucket is running${NC}"
echo ""

# Step 1: Run auth tests to generate tokens
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}📝 Step 1: Running Authentication Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

if deno test --allow-all --no-check functions/trpc/__tests__/auth.test.ts; then
  echo ""
  echo -e "${GREEN}✅ Authentication tests passed!${NC}"
  echo -e "${GREEN}   Tokens cached and ready for integration tests${NC}"
  echo ""
else
  echo ""
  echo -e "${RED}❌ Authentication tests failed!${NC}"
  echo -e "${YELLOW}   Cannot proceed with integration tests${NC}"
  exit 1
fi

# Step 2: Run integration tests
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}📝 Step 2: Running Integration Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check if integration directory exists
if [ -d "functions/trpc/__tests__/integration" ]; then
  if deno test --allow-all --no-check functions/trpc/__tests__/integration/*.test.ts; then
    echo ""
    echo -e "${GREEN}✅ Integration tests passed!${NC}"
    echo ""
  else
    echo ""
    echo -e "${RED}❌ Some integration tests failed${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}ℹ️  No integration tests found (directory doesn't exist yet)${NC}"
  echo ""
fi

# Step 3: Run standalone test files (like universities.test.ts)
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}📝 Step 3: Running Standalone Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Run universities.test.ts if it exists
if [ -f "functions/trpc/__tests__/universities.test.ts" ]; then
  if deno test --allow-all --no-check functions/trpc/__tests__/universities.test.ts; then
    echo -e "${GREEN}✅ Universities tests passed!${NC}"
    echo ""
  else
    echo -e "${RED}❌ Universities tests failed${NC}"
    exit 1
  fi
fi

# Final summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 All tests completed successfully!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Test Summary:${NC}"
echo -e "  ${GREEN}✅${NC} Authentication tests"
echo -e "  ${GREEN}✅${NC} Integration tests"
echo -e "  ${GREEN}✅${NC} Standalone tests"
echo ""
echo -e "${YELLOW}Cached tokens location:${NC}"
echo -e "  ${BLUE}functions/trpc/__tests__/tokens.json${NC}"
echo ""
