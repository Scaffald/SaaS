#!/bin/bash

# Sync Environment Variables to Netlify (Production or Preview Site)
# Usage: ./scripts/sync-netlify-env.sh [production|preview]

set -euo pipefail

ENVIRONMENT="${1:-production}"
if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "preview" ]]; then
    echo "Usage: $0 [production|preview]"
    exit 1
fi

ENV_FILE=".env.${ENVIRONMENT}"
ENV_LABEL=$( [[ "$ENVIRONMENT" == "production" ]] && echo "Production" || echo "Preview" )

echo "🔐 Syncing ${ENV_LABEL} Environment Variables to Netlify"
echo "========================================================"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if env file exists
if [ ! -f "${ENV_FILE}" ]; then
    echo -e "${RED}❌ Error: ${ENV_FILE} file not found${NC}"
    exit 1
fi

# Source env file
set -a
source "${ENV_FILE}"
set +a

echo ""
echo -e "${BLUE}📋 Preparing Netlify site link...${NC}"
echo ""

# Change to apps/expo directory where Netlify CLI expects site link
cd apps/expo

if [[ -n "${NETLIFY_SITE_ID:-}" ]]; then
    echo "Linking Netlify site (${NETLIFY_SITE_ID})..."
    npx netlify link --id "${NETLIFY_SITE_ID}" >/dev/null
else
    echo -e "${YELLOW}⚠️  NETLIFY_SITE_ID not set in ${ENV_FILE}. Using existing Netlify link.${NC}"
fi

NETLIFY_CONTEXT="production"

set_netlify_env() {
    local key=$1
    local value="${!key:-}"

    if [ -z "$value" ]; then
        echo -e "${YELLOW}⚠️  Skipping ${key} (not set in ${ENV_FILE})${NC}"
        return
    fi

    echo "Setting ${key}..."
    npx netlify env:set "${key}" "${value}" --context "${NETLIFY_CONTEXT}" >/dev/null
}

echo ""
echo -e "${BLUE}📋 Setting EXPO_PUBLIC_* environment variables in ${ENV_LABEL} site...${NC}"
echo ""

NETLIFY_VARS=(
  "EXPO_PUBLIC_URL"
  "EXPO_PUBLIC_SUPABASE_URL"
  "EXPO_PUBLIC_SUPABASE_ANON_KEY"
  "EXPO_PUBLIC_MAPBOX_TOKEN"
  "EXPO_PUBLIC_MAPBOX_API_URL"
  "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID"
  "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID"
  "EXPO_PUBLIC_GOOGLE_IOS_SCHEME"
  "EXPO_PUBLIC_GOOGLE_MAPS_KEY"
)

for var in "${NETLIFY_VARS[@]}"; do
    set_netlify_env "${var}"
done

# Return to root
cd ../..

echo ""
echo -e "${GREEN}✅ ${ENV_LABEL} environment variables synced to Netlify!${NC}"
echo ""
echo -e "${YELLOW}⚠️  Note: You'll need to redeploy the ${ENV_LABEL} site for these changes to take effect${NC}"
echo ""
echo "Redeploy options:"
if [[ "$ENVIRONMENT" == "production" ]]; then
  echo "  1. Push to main branch: git push origin main"
  echo "  2. Local deploy: pnpm deploy:netlify:prod"
  echo "  3. Trigger workflow: gh workflow run deploy-web.yml --ref main"
else
  echo "  1. Push to preview branch: git push origin preview"
  echo "  2. Local deploy: pnpm deploy:netlify"
  echo "  3. Trigger workflow: gh workflow run deploy-web.yml --ref preview"
fi
echo ""
