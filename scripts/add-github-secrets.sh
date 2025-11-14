#!/bin/bash

# Add GitHub Secrets for Production Deployment
# This script reads from .env.production and adds secrets to GitHub

set -e

echo "🔐 Adding GitHub Secrets for Production Deployment"
echo "=================================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Error: .env.production file not found${NC}"
    exit 1
fi

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ Error: GitHub CLI (gh) is not installed${NC}"
    echo "Install it with: brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Error: Not authenticated with GitHub CLI${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Source .env.production
set -a
source .env.production
set +a

echo ""
echo -e "${BLUE}📋 Adding EXPO_PUBLIC_* secrets...${NC}"
echo ""

# Add EXPO_PUBLIC secrets
echo "Adding EXPO_PUBLIC_URL..."
echo "$EXPO_PUBLIC_URL" | gh secret set EXPO_PUBLIC_URL

echo "Adding EXPO_PUBLIC_SUPABASE_URL..."
echo "$EXPO_PUBLIC_SUPABASE_URL" | gh secret set EXPO_PUBLIC_SUPABASE_URL

echo "Adding EXPO_PUBLIC_SUPABASE_ANON_KEY..."
echo "$EXPO_PUBLIC_SUPABASE_ANON_KEY" | gh secret set EXPO_PUBLIC_SUPABASE_ANON_KEY

echo "Adding EXPO_PUBLIC_MAPBOX_TOKEN..."
echo "$EXPO_PUBLIC_MAPBOX_TOKEN" | gh secret set EXPO_PUBLIC_MAPBOX_TOKEN

echo "Adding EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID..."
echo "$EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID" | gh secret set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID

echo "Adding EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID..."
echo "$EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID" | gh secret set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID

echo "Adding EXPO_PUBLIC_GOOGLE_IOS_SCHEME..."
echo "$EXPO_PUBLIC_GOOGLE_IOS_SCHEME" | gh secret set EXPO_PUBLIC_GOOGLE_IOS_SCHEME

echo "Adding EXPO_PUBLIC_GOOGLE_MAPS_KEY..."
echo "$EXPO_PUBLIC_GOOGLE_MAPS_KEY" | gh secret set EXPO_PUBLIC_GOOGLE_MAPS_KEY

echo ""
echo -e "${GREEN}✅ All secrets added successfully!${NC}"
echo ""
echo "📋 Verify secrets with:"
echo "  gh secret list"
echo ""
