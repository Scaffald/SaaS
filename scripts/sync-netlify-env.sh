#!/bin/bash

# Sync Environment Variables to Netlify
# Sets environment variables from .env.production to Netlify

set -e

echo "🔐 Syncing Environment Variables to Netlify"
echo "========================================"

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

# Source .env.production
set -a
source .env.production
set +a

echo ""
echo -e "${BLUE}📋 Setting EXPO_PUBLIC_* environment variables...${NC}"
echo ""

# Change to apps/expo directory where Netlify is linked
cd apps/expo

# Set environment variables in Netlify
echo "Setting EXPO_PUBLIC_URL..."
npx netlify env:set EXPO_PUBLIC_URL "$EXPO_PUBLIC_URL" --context production

echo "Setting EXPO_PUBLIC_SUPABASE_URL..."
npx netlify env:set EXPO_PUBLIC_SUPABASE_URL "$EXPO_PUBLIC_SUPABASE_URL" --context production

echo "Setting EXPO_PUBLIC_SUPABASE_ANON_KEY..."
npx netlify env:set EXPO_PUBLIC_SUPABASE_ANON_KEY "$EXPO_PUBLIC_SUPABASE_ANON_KEY" --context production

echo "Setting EXPO_PUBLIC_MAPBOX_TOKEN..."
npx netlify env:set EXPO_PUBLIC_MAPBOX_TOKEN "$EXPO_PUBLIC_MAPBOX_TOKEN" --context production

echo "Setting EXPO_PUBLIC_MAPBOX_STYLE_URL..."
npx netlify env:set EXPO_PUBLIC_MAPBOX_STYLE_URL "$EXPO_PUBLIC_MAPBOX_STYLE_URL" --context production

echo "Setting EXPO_PUBLIC_MAPBOX_API_URL..."
npx netlify env:set EXPO_PUBLIC_MAPBOX_API_URL "$EXPO_PUBLIC_MAPBOX_API_URL" --context production

echo "Setting EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID..."
npx netlify env:set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID "$EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID" --context production

echo "Setting EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID..."
npx netlify env:set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID "$EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID" --context production

echo "Setting EXPO_PUBLIC_GOOGLE_IOS_SCHEME..."
npx netlify env:set EXPO_PUBLIC_GOOGLE_IOS_SCHEME "$EXPO_PUBLIC_GOOGLE_IOS_SCHEME" --context production

echo "Setting EXPO_PUBLIC_GOOGLE_MAPS_KEY..."
npx netlify env:set EXPO_PUBLIC_GOOGLE_MAPS_KEY "$EXPO_PUBLIC_GOOGLE_MAPS_KEY" --context production

# Return to root
cd ../..

echo ""
echo -e "${GREEN}✅ All environment variables synced to Netlify!${NC}"
echo ""
echo -e "${YELLOW}⚠️  Note: You'll need to redeploy for these changes to take effect${NC}"
echo ""
echo "Redeploy options:"
echo "  1. Push to production branch: git push origin production"
echo "  2. Local deploy: pnpm deploy:netlify:prod"
echo "  3. Trigger workflow: gh workflow run deploy-web.yml --ref production"
echo ""
