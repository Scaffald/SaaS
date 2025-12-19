#!/bin/bash

# Production Deployment Script with Database Reset
# DESTRUCTIVE: Resets database to match local state, then deploys everything

set -e  # Exit on any error

echo "🚀 Production Deployment (RESET MODE)"
echo "========================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
echo -e "${BLUE}📋 Deployment Plan:${NC}"
echo "   🔴 Database (RESET + migrations + seed)"
echo "   ✅ Edge Functions (trpc, job-import, news)"
echo "   ✅ Web App (via GitHub Actions)"
echo ""
echo -e "${RED}⚠️  WARNING: This will RESET the production database!${NC}"
echo "   Database URL: $EXPO_PUBLIC_SUPABASE_URL"
echo ""
echo "   This will:"
echo "   1. DROP all tables and data"
echo "   2. Apply all migrations"
echo "   3. Seed production data (CSI, universities, certifications, jobs)"
echo ""
read -p "   Type 'RESET' to continue: " CONFIRM

if [ "$CONFIRM" != "RESET" ]; then
    echo -e "${YELLOW}⏹️  Deployment cancelled${NC}"
    exit 0
fi

# Pre-flight checks
echo ""
echo "🔍 Pre-flight Checks"
echo "========================================"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes${NC}"
    echo ""
    read -p "Continue anyway? (y/n): " CONTINUE
    if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}⏹️  Deployment cancelled${NC}"
        exit 0
    fi
else
    echo -e "${GREEN}✅ No uncommitted changes${NC}"
fi

# Run code quality checks
echo ""
echo "🔍 Running Code Quality Checks"
echo "========================================"

if pnpm check; then
    echo -e "${GREEN}✅ Code quality checks passed${NC}"
else
    echo -e "${YELLOW}⚠️  Code quality checks had warnings${NC}"
    echo ""
    read -p "Continue with deployment? (y/n): " CONTINUE
    if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}⏹️  Deployment cancelled${NC}"
        exit 0
    fi
fi

# Check Supabase project link
echo ""
echo "📋 Step 1: Verifying Supabase Project"
echo "========================================"

if pnpm supa projects list > /dev/null 2>&1; then
    if pnpm supa projects list 2>/dev/null | grep -q "●"; then
        LINKED_PROJECT=$(pnpm supa projects list 2>/dev/null | grep "●" | awk '{print $NF}')
        echo -e "${GREEN}✅ Linked to Supabase project: ${LINKED_PROJECT}${NC}"
    else
        echo -e "${RED}❌ No Supabase project is currently linked${NC}"
        echo ""
        echo "To link your project:"
        echo "  pnpm supa link --project-ref YOUR-PROJECT-REF"
        exit 1
    fi
else
    echo -e "${RED}❌ Failed to access Supabase projects${NC}"
    exit 1
fi

# Reset database
echo ""
echo "═══════════════════════════════════════"
echo "📋 Step 2: Resetting Production Database"
echo "═══════════════════════════════════════"
echo "This will completely DROP and recreate the database schema..."

if pnpm supa db reset --linked; then
    echo -e "${GREEN}✅ Database reset and migrations applied successfully${NC}"
else
    echo -e "${RED}❌ Database reset failed${NC}"
    exit 1
fi

# Seed database
echo ""
echo "═══════════════════════════════════════"
echo "📋 Step 3: Seeding Production Database"
echo "═══════════════════════════════════════"

if pnpm env-prod pnpm --filter @scf/supabase seed; then
    echo -e "${GREEN}✅ Database seeded successfully${NC}"
else
    echo -e "${RED}❌ Database seeding failed${NC}"
    exit 1
fi

# Deploy Edge Functions
echo ""
echo "═══════════════════════════════════════"
echo "📋 Step 4: Deploying Edge Functions"
echo "═══════════════════════════════════════"

cd packages/supabase

echo ""
echo "Deploying tRPC Router..."
if pnpx supabase functions deploy trpc; then
    echo -e "${GREEN}✅ tRPC function deployed${NC}"
else
    echo -e "${RED}❌ tRPC deployment failed${NC}"
    cd ../..
    exit 1
fi

echo ""
echo "Deploying Job Import Function..."
if pnpx supabase functions deploy job-import; then
    echo -e "${GREEN}✅ job-import function deployed${NC}"
else
    echo -e "${YELLOW}⚠️  job-import deployment had warnings${NC}"
fi

echo ""
echo "Deploying News Function..."
if pnpx supabase functions deploy news; then
    echo -e "${GREEN}✅ news function deployed${NC}"
else
    echo -e "${YELLOW}⚠️  news deployment had warnings${NC}"
fi

cd ../..

# Deploy Web App
echo ""
echo "═══════════════════════════════════════"
echo "📋 Step 5: Deploying Web App"
echo "═══════════════════════════════════════"

if command -v gh &> /dev/null; then
    echo "Triggering GitHub Actions workflow..."
    
    if gh workflow run deploy-web.yml --ref prod; then
        echo -e "${GREEN}✅ GitHub Actions workflow triggered${NC}"
        echo ""
        echo "Monitor deployment:"
        echo "  gh run list --workflow=deploy-web.yml"
        echo "  or visit: https://github.com/$(git config --get remote.origin.url | sed 's/.*://;s/.git$//')/actions"
    else
        echo -e "${YELLOW}⚠️  Failed to trigger GitHub Actions${NC}"
        echo ""
        echo "Manual deployment options:"
        echo "  1. Push to production branch: git push origin prod"
        echo "  2. Trigger manually in GitHub Actions UI"
    fi
else
    echo -e "${YELLOW}⚠️  GitHub CLI (gh) not installed${NC}"
    echo ""
    echo "Install gh CLI: brew install gh"
    echo ""
    echo "Alternative: Push to prod branch to trigger deployment"
fi

# Deployment Summary
echo ""
echo "═══════════════════════════════════════"
echo -e "${GREEN}🎉 Production Deployment Complete!${NC}"
echo "═══════════════════════════════════════"
echo ""
echo "📊 Deployment Summary:"
echo "   Date: $(date)"
echo "   Commit: $(git rev-parse --short HEAD)"
echo "   Branch: $(git branch --show-current)"
echo ""
echo -e "${GREEN}✅ Database reset and seeded${NC}"
echo -e "${GREEN}✅ Functions deployed${NC}"
echo -e "${GREEN}✅ Web deployment triggered${NC}"
echo ""
echo "🔗 Important Links:"
echo "   Supabase: https://supabase.com/dashboard/project/_"
echo "   AWS Console: https://console.aws.amazon.com/"
echo "   GitHub Actions: https://github.com/$(git config --get remote.origin.url | sed 's/.*://;s/.git$//')/actions"
echo ""
echo "📋 Note:"
echo "   This was a RESET deployment. All production data has been replaced."
echo "   Once the database is stable, use 'pnpm deploy' for safe deployments."
echo ""
