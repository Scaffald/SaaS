#!/bin/bash

# Production Deployment Verification Script
# Runs health checks on production deployment

set -e  # Exit on any error

echo "🔍 Production Deployment Verification"
echo "========================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Error: .env.production file not found${NC}"
    exit 1
fi

# Source production environment
set -a
source .env.production
set +a

ERRORS=0
WARNINGS=0

# Verify environment variables
echo ""
echo "📋 Step 1: Environment Variables"
echo "========================================"

if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
    echo -e "${RED}❌ EXPO_PUBLIC_SUPABASE_URL not set${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ EXPO_PUBLIC_SUPABASE_URL: $EXPO_PUBLIC_SUPABASE_URL${NC}"
fi

if [ -z "$SUPABASE_SECRET" ]; then
    echo -e "${RED}❌ SUPABASE_SECRET not set${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ SUPABASE_SECRET: [REDACTED]${NC}"
fi

# Verify Supabase connection
echo ""
echo "📋 Step 2: Database Connection"
echo "========================================"

cd packages/supabase

if pnpx supabase db remote --status > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    ((ERRORS++))
fi

# Check migrations
echo ""
echo "📋 Step 3: Migration Status"
echo "========================================"

MIGRATION_COUNT=$(ls -1 ../../packages/supabase/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')
echo "Local migrations: $MIGRATION_COUNT"

if [ "$MIGRATION_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Migrations found${NC}"
else
    echo -e "${YELLOW}⚠️  No migrations found${NC}"
    ((WARNINGS++))
fi

# Verify Edge Functions
echo ""
echo "📋 Step 4: Edge Functions"
echo "========================================"

echo "Listing deployed functions..."
if pnpx supabase functions list > /dev/null 2>&1; then
    pnpx supabase functions list
    echo -e "${GREEN}✅ Functions accessible${NC}"
else
    echo -e "${RED}❌ Failed to list functions${NC}"
    ((ERRORS++))
fi

cd ../..

# Test tRPC endpoint
echo ""
echo "📋 Step 5: API Endpoint Test"
echo "========================================"

TRPC_URL="${EXPO_PUBLIC_SUPABASE_URL}/functions/v1/trpc/health"
echo "Testing: $TRPC_URL"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TRPC_URL" || echo "000")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
    echo -e "${GREEN}✅ tRPC endpoint responding (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${YELLOW}⚠️  tRPC endpoint returned HTTP $HTTP_CODE${NC}"
    ((WARNINGS++))
fi

# Summary
echo ""
echo "========================================"
echo "📊 Verification Summary"
echo "========================================"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "🎉 Production deployment is healthy"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found${NC}"
    echo ""
    echo "Production deployment is mostly healthy"
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(s) and $WARNINGS warning(s) found${NC}"
    echo ""
    echo "Please fix the errors before proceeding"
    exit 1
fi
