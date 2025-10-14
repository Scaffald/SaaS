#!/bin/bash

# Production Edge Functions Deployment Script
# Deploys all Edge Functions to production Supabase

set -e  # Exit on any error

echo "🚀 Production Edge Functions Deployment"
echo "========================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Error: .env.production file not found${NC}"
    echo "   Create .env.production with your production Supabase credentials"
    exit 1
fi

# Source production environment
set -a
source .env.production
set +a

echo ""
echo "📋 Functions to Deploy:"
echo "   - trpc (Main API Router)"
echo "   - job-import (Job Import Function)"
echo "   - news (News Aggregation Function)"
echo ""
read -p "Deploy all functions to production? (y/n): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏹️  Deployment cancelled${NC}"
    exit 0
fi

cd packages/supabase

echo ""
echo "📋 Step 1: Deploying tRPC Router"
echo "========================================"

if pnpx supabase functions deploy trpc; then
    echo -e "${GREEN}✅ tRPC function deployed${NC}"
else
    echo -e "${RED}❌ tRPC deployment failed${NC}"
    cd ../..
    exit 1
fi

echo ""
echo "📋 Step 2: Deploying Job Import Function"
echo "========================================"

if pnpx supabase functions deploy job-import; then
    echo -e "${GREEN}✅ job-import function deployed${NC}"
else
    echo -e "${YELLOW}⚠️  job-import deployment had warnings${NC}"
fi

echo ""
echo "📋 Step 3: Deploying News Function"
echo "========================================"

if pnpx supabase functions deploy news; then
    echo -e "${GREEN}✅ news function deployed${NC}"
else
    echo -e "${YELLOW}⚠️  news deployment had warnings${NC}"
fi

echo ""
echo "📋 Step 4: Listing Deployed Functions"
echo "========================================"

pnpx supabase functions list

cd ../..

echo ""
echo -e "${GREEN}🎉 Edge Functions Deployment Complete!${NC}"
echo "========================================"
echo ""
echo "📊 Next Steps:"
echo "   1. Test functions in Supabase Dashboard"
echo "   2. Verify function logs"
echo "   3. Test API endpoints from web app"
echo "   4. Deploy web app: pnpm deploy:prod:web"
echo ""
echo "🔗 Functions Dashboard: https://supabase.com/dashboard/project/_/functions"
echo ""
