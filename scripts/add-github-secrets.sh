#!/bin/bash

# Add GitHub Secrets for Production or Preview Deployment
# Usage: ./scripts/add-github-secrets.sh [production|preview]

set -euo pipefail

ENVIRONMENT="${1:-production}"
if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "preview" ]]; then
  echo "Usage: $0 [production|preview]"
  exit 1
fi

ENV_FILE=".env.${ENVIRONMENT}"
ENV_LABEL=$( [[ "$ENVIRONMENT" == "production" ]] && echo "Production" || echo "Preview" )
SECRET_PREFIX=$( [[ "$ENVIRONMENT" == "preview" ]] && echo "PREVIEW_" || echo "" )

echo "🔐 Adding GitHub Secrets for ${ENV_LABEL} Deployment"
echo "=================================================="

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

# Source environment file
set -a
source "${ENV_FILE}"
set +a

echo ""
echo -e "${BLUE}📋 Targeting ${ENV_LABEL} secrets (prefix: ${SECRET_PREFIX:-<none>})${NC}"
echo ""

add_secret() {
    local var_name=$1
    local secret_name="${SECRET_PREFIX}${var_name}"
    local value="${!var_name:-}"

    if [ -z "$value" ]; then
        echo -e "${YELLOW}⚠️  Skipping ${secret_name} (not set in ${ENV_FILE})${NC}"
        return
    fi

    echo "Adding ${secret_name}..."
    echo "$value" | gh secret set "${secret_name}" >/dev/null
}

echo ""
echo -e "${BLUE}📋 Adding EXPO_PUBLIC_* secrets...${NC}"
echo ""

EXPO_SECRETS=(
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

for secret in "${EXPO_SECRETS[@]}"; do
  add_secret "${secret}"
done

echo ""
echo -e "${BLUE}📋 Adding Supabase / Netlify secrets (if available)...${NC}"
echo ""

OPTIONAL_SECRETS=(
  "SUPABASE_ACCESS_TOKEN"
  "SUPABASE_PROJECT_ID"
  "NETLIFY_AUTH_TOKEN"
  "NETLIFY_SITE_ID"
)

for secret in "${OPTIONAL_SECRETS[@]}"; do
  add_secret "${secret}"
done

echo ""
echo -e "${GREEN}✅ Secret sync complete for ${ENV_LABEL}!${NC}"
echo ""
echo "📋 Verify secrets with:"
echo "  gh secret list"
echo ""
