#!/bin/bash

# Production Database Deployment Script
# Resets production database, applies migrations, and seeds data

set -e  # Exit on any error

echo "🚀 Production Database Deployment"
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

# Verify required environment variables
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
    echo -e "${RED}❌ Error: EXPO_PUBLIC_SUPABASE_URL not set in .env.production${NC}"
    exit 1
fi

if [ -z "$SUPABASE_SECRET" ]; then
    echo -e "${RED}❌ Error: SUPABASE_SECRET not set in .env.production${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}⚠️  WARNING: This will RESET the production database!${NC}"
echo "   Database URL: $EXPO_PUBLIC_SUPABASE_URL"
echo ""
echo "   This will:"
echo "   1. Drop all tables and data"
echo "   2. Apply all migrations"
echo "   3. Seed production data (CSI, universities, certifications, jobs)"
echo ""
read -p "   Type 'yes' to continue: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}⏹️  Deployment cancelled${NC}"
    exit 0
fi

echo ""
echo "📋 Step 1: Checking Supabase project link"
echo "========================================"

# Check if project is linked by listing projects
if pnpm supa projects list > /dev/null 2>&1; then
    # Further verify that a project is actually linked (has the bullet)
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
    echo "   Check your Supabase authentication"
    exit 1
fi

echo ""
echo "📋 Step 2: Resetting Production Database"
echo "========================================"
echo "This will completely DROP and recreate the database schema..."

# Reset database - this drops everything and reapplies all migrations
# Note: pnpm supa must be run from root directory
if pnpm supa db reset --linked; then
    echo -e "${GREEN}✅ Database reset and migrations applied successfully${NC}"
else
    echo -e "${RED}❌ Database reset failed${NC}"
    exit 1
fi


echo ""
echo -e "${GREEN}🎉 Production Database Deployment Complete!${NC}"
echo "========================================"
echo ""
echo "📊 Next Steps:"
echo "   1. Verify data in Supabase Dashboard"
echo "   2. Test authentication flows"
echo "   3. Deploy Edge Functions: pnpm deploy:prod:functions"
echo "   4. Deploy web app: pnpm deploy:prod:web"
echo ""
echo "� Supabase Dashboard: https://supabase.com/dashboard/project/_"
echo ""
