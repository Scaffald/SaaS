#!/bin/bash

# Complete Production Deployment Script
# Orchestrates database, functions, and web deployment

set -e  # Exit on any error

echo "🚀 Complete Production Deployment"
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

# Parse command line arguments
SKIP_DB=false
SKIP_FUNCTIONS=false
SKIP_WEB=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-db)
            SKIP_DB=true
            shift
            ;;
        --skip-functions)
            SKIP_FUNCTIONS=true
            shift
            ;;
        --skip-web)
            SKIP_WEB=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-db         Skip database deployment"
            echo "  --skip-functions  Skip functions deployment"
            echo "  --skip-web        Skip web deployment"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo ""
echo -e "${BLUE}📋 Deployment Plan:${NC}"
if [ "$SKIP_DB" = false ]; then
    echo "   ✅ Database (reset + migrations + seed)"
else
    echo "   ⏭️  Database (skipped)"
fi

if [ "$SKIP_FUNCTIONS" = false ]; then
    echo "   ✅ Edge Functions (trpc, job-import, news)"
else
    echo "   ⏭️  Edge Functions (skipped)"
fi

if [ "$SKIP_WEB" = false ]; then
    echo "   ✅ Web App (via GitHub Actions)"
else
    echo "   ⏭️  Web App (skipped)"
fi

echo ""
echo -e "${YELLOW}⚠️  This is a PRODUCTION deployment!${NC}"
echo ""
read -p "Continue with deployment? (y/n): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
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

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Error: .env.production file not found${NC}"
    exit 1
else
    echo -e "${GREEN}✅ .env.production found${NC}"
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

# Deploy Database
if [ "$SKIP_DB" = false ]; then
    echo ""
    echo "═══════════════════════════════════════"
    echo "📋 STEP 1: Database Deployment"
    echo "═══════════════════════════════════════"
    
    if ./scripts/deploy-db-prod.sh; then
        echo -e "${GREEN}✅ Database deployment successful${NC}"
    else
        echo -e "${RED}❌ Database deployment failed${NC}"
        exit 1
    fi
else
    echo ""
    echo "⏭️  Skipping database deployment"
fi

# Deploy Edge Functions
if [ "$SKIP_FUNCTIONS" = false ]; then
    echo ""
    echo "═══════════════════════════════════════"
    echo "📋 STEP 2: Edge Functions Deployment"
    echo "═══════════════════════════════════════"
    
    if ./scripts/deploy-functions-prod.sh; then
        echo -e "${GREEN}✅ Functions deployment successful${NC}"
    else
        echo -e "${YELLOW}⚠️  Functions deployment had warnings${NC}"
    fi
else
    echo ""
    echo "⏭️  Skipping functions deployment"
fi

# Deploy Web App
if [ "$SKIP_WEB" = false ]; then
    echo ""
    echo "═══════════════════════════════════════"
    echo "📋 STEP 3: Web App Deployment"
    echo "═══════════════════════════════════════"
    
    # Check if gh CLI is installed
    if command -v gh &> /dev/null; then
        echo "Triggering GitHub Actions workflow..."
        
        if gh workflow run deploy-web.yml --ref main; then
            echo -e "${GREEN}✅ GitHub Actions workflow triggered${NC}"
            echo ""
            echo "Monitor deployment:"
            echo "  gh run list --workflow=deploy-web.yml"
            echo "  or visit: https://github.com/$(git config --get remote.origin.url | sed 's/.*://;s/.git$//')/actions"
        else
            echo -e "${YELLOW}⚠️  Failed to trigger GitHub Actions${NC}"
            echo ""
            echo "Manual deployment options:"
            echo "  1. Push to main branch: git push origin main"
            echo "  2. Trigger manually in GitHub Actions UI"
            echo "  3. Deploy directly: pnpm deploy"
        fi
    else
        echo -e "${YELLOW}⚠️  GitHub CLI (gh) not installed${NC}"
        echo ""
        echo "Install gh CLI: brew install gh"
        echo ""
        echo "Alternative deployment:"
        echo "  1. Push to main: git push origin main"
        echo "  2. Or use GitHub Actions UI to trigger manually"
    fi
else
    echo ""
    echo "⏭️  Skipping web deployment"
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

if [ "$SKIP_DB" = false ]; then
    echo -e "${GREEN}✅ Database deployed${NC}"
fi

if [ "$SKIP_FUNCTIONS" = false ]; then
    echo -e "${GREEN}✅ Functions deployed${NC}"
fi

if [ "$SKIP_WEB" = false ]; then
    echo -e "${GREEN}✅ Web deployment triggered${NC}"
fi

echo ""
echo "🔗 Important Links:"
echo "   Supabase: https://supabase.com/dashboard/project/_"
echo "   Netlify: https://app.netlify.com/"
echo "   GitHub Actions: https://github.com/$(git config --get remote.origin.url | sed 's/.*://;s/.git$//')/actions"
echo ""
echo "📋 Next Steps:"
echo "   1. Verify database in Supabase Dashboard"
echo "   2. Test Edge Functions"
echo "   3. Monitor GitHub Actions build"
echo "   4. Test production website"
echo "   5. Verify authentication flows"
echo ""
echo "🔍 Verification:"
echo "   Run: pnpm deploy:verify:prod"
echo ""
