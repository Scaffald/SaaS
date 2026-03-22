#!/bin/bash
# Docs Deployment Script
# Builds and deploys Docusaurus sites (UI and/or SDK) to S3 + CloudFront
# Usage: ./scripts/deploy-docs.sh [ui|sdk|all]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TARGET="${1:-all}"

if [[ ! "$TARGET" =~ ^(ui|sdk|all)$ ]]; then
    echo -e "${RED}❌ Invalid target: $TARGET${NC}"
    echo "Usage: $0 [ui|sdk|all]"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

UI_BUCKET="ui-scaffald-com-docs"
UI_DIST="E3LR29JN2CLH5S"
UI_URL="https://ui.scaffald.com"
UI_DOCS_DIR="$PROJECT_ROOT/packages/scaffald-ui/docs-site"

SDK_BUCKET="sdk-scaffald-com-docs"
SDK_DIST="E24SHZWG4D41LG"
SDK_URL="https://sdk.scaffald.com"
SDK_DOCS_DIR="$PROJECT_ROOT/packages/scaffald-sdk/docs-site"

# Load .env if AWS creds not already in environment
if [ -z "$AWS_ACCESS_KEY_ID" ] && [ -f "$PROJECT_ROOT/.env" ]; then
    export AWS_ACCESS_KEY_ID=$(grep '^AWS_KEY=' "$PROJECT_ROOT/.env" | cut -d '=' -f2)
    export AWS_SECRET_ACCESS_KEY=$(grep '^AWS_SECRET=' "$PROJECT_ROOT/.env" | cut -d '=' -f2)
fi

export AWS_DEFAULT_REGION="us-east-1"

# Verify AWS credentials
echo -e "${YELLOW}Verifying AWS credentials...${NC}"
if ! aws sts get-caller-identity &>/dev/null; then
    echo -e "${RED}❌ AWS credentials not found. Set AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY or add to .env${NC}"
    exit 1
fi
echo -e "${GREEN}✅ AWS credentials verified${NC}"
echo ""

deploy_site() {
    local NAME="$1"
    local DOCS_DIR="$2"
    local BUCKET="$3"
    local DIST_ID="$4"
    local URL="$5"
    local BUILD_DIR="$DOCS_DIR/build"

    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}🚀 Deploying $NAME docs → $URL${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"

    # Install deps if needed
    if [ ! -d "$DOCS_DIR/node_modules" ]; then
        echo "Installing dependencies..."
        cd "$DOCS_DIR" && npm install
        cd "$PROJECT_ROOT"
    fi

    # Build
    echo -e "${BLUE}Building...${NC}"
    rm -rf "$BUILD_DIR"
    cd "$DOCS_DIR" && npm run build
    cd "$PROJECT_ROOT"

    if [ ! -f "$BUILD_DIR/index.html" ]; then
        echo -e "${RED}❌ Build failed — index.html not found${NC}"
        exit 1
    fi

    BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
    echo -e "${GREEN}✅ Build complete ($BUILD_SIZE)${NC}"
    echo ""

    # Upload static assets (long cache)
    echo "Uploading static assets..."
    aws s3 sync "$BUILD_DIR" "s3://$BUCKET" \
        --delete \
        --exclude "*.html" \
        --cache-control "public, max-age=31536000, immutable"

    # Upload HTML (no cache)
    echo "Uploading HTML..."
    aws s3 sync "$BUILD_DIR" "s3://$BUCKET" \
        --exclude "*" \
        --include "*.html" \
        --cache-control "public, max-age=0, must-revalidate" \
        --content-type "text/html"

    echo -e "${GREEN}✅ Upload complete${NC}"

    # Invalidate CloudFront
    echo "Invalidating CloudFront cache..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$DIST_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    echo -e "${GREEN}✅ Invalidation created: $INVALIDATION_ID (takes 5-15 min)${NC}"

    echo ""
    echo -e "${GREEN}✅ $NAME docs deployed → $URL${NC}"
    echo ""
}

cd "$PROJECT_ROOT"

# Install monorepo deps if needed
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    echo "Installing monorepo dependencies..."
    pnpm install --no-frozen-lockfile
fi

if [[ "$TARGET" == "ui" || "$TARGET" == "all" ]]; then
    deploy_site "UI" "$UI_DOCS_DIR" "$UI_BUCKET" "$UI_DIST" "$UI_URL"
fi

if [[ "$TARGET" == "sdk" || "$TARGET" == "all" ]]; then
    deploy_site "SDK" "$SDK_DOCS_DIR" "$SDK_BUCKET" "$SDK_DIST" "$SDK_URL"
fi

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ All done!${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
