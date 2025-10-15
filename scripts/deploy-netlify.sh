#!/bin/bash

# Local Netlify Deployment Script
# Build and deploy web app directly to Netlify from local machine

set -e

echo "🚀 Local Netlify Deployment"
echo "========================================"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Error: .env.production file not found${NC}"
    echo "   Create .env.production with your production credentials"
    exit 1
fi

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo -e "${RED}❌ Error: Netlify CLI not installed${NC}"
    echo ""
    echo "Install with:"
    echo "  npm install -g netlify-cli"
    echo ""
    exit 1
fi

# Parse command line arguments
DEPLOY_ENV="preview"
if [ "$1" == "--prod" ] || [ "$1" == "-p" ]; then
    DEPLOY_ENV="production"
fi

echo ""
echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "   Environment: ${DEPLOY_ENV}"
echo "   Working Directory: $(pwd)"
echo ""

if [ "$DEPLOY_ENV" == "production" ]; then
    echo -e "${YELLOW}⚠️  This will deploy to PRODUCTION!${NC}"
else
    echo -e "${BLUE}ℹ️  This will create a deploy preview${NC}"
fi
echo ""
read -p "Continue? (y/n): " CONFIRM

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

# Build the application
echo ""
echo "═══════════════════════════════════════"
echo "📋 Step 1: Building Application"
echo "═══════════════════════════════════════"

# Source production environment
set -a
source .env.production
set +a

# Build packages first
echo ""
echo "Building workspace packages..."
if pnpm --filter @app/ui build && \
   pnpm --filter @app/core build && \
   pnpm --filter @app/schemas build; then
    echo -e "${GREEN}✅ Workspace packages built${NC}"
else
    echo -e "${RED}❌ Package build failed${NC}"
    exit 1
fi

# Build web app
echo ""
echo "Building web application..."
cd apps/expo

if pnpm web:build; then
    echo -e "${GREEN}✅ Web build complete${NC}"
else
    echo -e "${RED}❌ Web build failed${NC}"
    cd ../..
    exit 1
fi

# Verify build output
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build output directory not found${NC}"
    cd ../..
    exit 1
fi

echo -e "${GREEN}✅ Build verified: dist/ directory exists${NC}"
cd ../..

# Deploy to Netlify
echo ""
echo "═══════════════════════════════════════"
echo "📋 Step 2: Deploying to Netlify"
echo "═══════════════════════════════════════"

if [ "$DEPLOY_ENV" == "production" ]; then
    echo ""
    echo -e "${YELLOW}🚀 Deploying to PRODUCTION...${NC}"
    netlify deploy --prod --dir=apps/expo/dist
else
    echo ""
    echo -e "${BLUE}🚀 Creating deploy preview...${NC}"
    netlify deploy --dir=apps/expo/dist
fi

# Deployment Summary
echo ""
echo "═══════════════════════════════════════"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "═══════════════════════════════════════"
echo ""
echo "📊 Deployment Summary:"
echo "   Date: $(date)"
echo "   Commit: $(git rev-parse --short HEAD)"
echo "   Branch: $(git branch --show-current)"
echo "   Environment: ${DEPLOY_ENV}"
echo ""

if [ "$DEPLOY_ENV" == "production" ]; then
    echo -e "${GREEN}✅ Production deployment successful!${NC}"
    echo ""
    echo "🔗 Site URL: https://preview.scaffald.com"
else
    echo -e "${GREEN}✅ Preview deployment successful!${NC}"
    echo ""
    echo "Check the output above for your preview URL"
fi
echo ""
