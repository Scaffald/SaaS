#!/bin/bash
# Storybook Deployment Script
# Builds Beyond UI Storybook and deploys to S3 with CloudFront cache invalidation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse environment argument
ENV="${1:-dev}"

# Validate environment
if [[ ! "$ENV" =~ ^(dev|prod)$ ]]; then
    echo -e "${RED}❌ Invalid environment: $ENV${NC}"
    echo "Usage: $0 [dev|prod]"
    exit 1
fi

# Configuration
case "$ENV" in
    dev)
        BUCKET_NAME="beyond-ui-storybook-dev"
        DISTRIBUTION_ID="${STORYBOOK_CLOUDFRONT_DEV}"
        ENV_LABEL="Development"
        ;;
    prod)
        BUCKET_NAME="beyond-ui-storybook-prod"
        DISTRIBUTION_ID="${STORYBOOK_CLOUDFRONT_PROD}"
        ENV_LABEL="Production"
        ;;
esac

AWS_PROFILE="${AWS_PROFILE:-scaffald}"
AWS_REGION="${AWS_REGION:-us-east-1}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_DIR="$PROJECT_ROOT/packages/beyond-ui/storybook-static"

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}🚀 Beyond UI Storybook Deployment - $ENV_LABEL${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo "Environment: $ENV"
echo "Bucket: $BUCKET_NAME"
if [ -n "$DISTRIBUTION_ID" ]; then
    echo "CloudFront Distribution: $DISTRIBUTION_ID"
fi
echo ""

# Verify AWS credentials
echo -e "${YELLOW}Verifying AWS credentials...${NC}"
if ! aws sts get-caller-identity --profile "$AWS_PROFILE" &>/dev/null; then
    echo -e "${RED}❌ AWS credentials not found for profile: $AWS_PROFILE${NC}"
    exit 1
fi
echo -e "${GREEN}✅ AWS credentials verified${NC}"
echo ""

# Verify bucket exists
if ! aws s3api head-bucket --bucket "$BUCKET_NAME" --profile "$AWS_PROFILE" 2>/dev/null; then
    echo -e "${RED}❌ S3 bucket not found: $BUCKET_NAME${NC}"
    echo "   Create bucket first (see infrastructure setup in plan)"
    exit 1
fi

# Build Storybook
echo -e "${BLUE}Building Storybook...${NC}"
cd "$PROJECT_ROOT"

# Clean previous build
rm -rf "$BUILD_DIR"

# Build Storybook
pnpm --filter @unicornlove/beyond-ui build-storybook

# Verify build output
if [ ! -f "$BUILD_DIR/index.html" ]; then
    echo -e "${RED}❌ Build output not found: $BUILD_DIR/index.html${NC}"
    exit 1
fi

BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
echo -e "${GREEN}✅ Build complete (Size: $BUILD_SIZE)${NC}"
echo ""

# Upload to S3
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}📤 Uploading to S3${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

# Upload static assets with long cache
echo "Uploading static assets..."
aws s3 sync "$BUILD_DIR" "s3://$BUCKET_NAME" \
    --delete \
    --exclude "*.html" \
    --cache-control "public, max-age=31536000, immutable" \
    --profile "$AWS_PROFILE" \
    --region "$AWS_REGION"

# Upload HTML files with no cache
echo "Uploading HTML files..."
aws s3 sync "$BUILD_DIR" "s3://$BUCKET_NAME" \
    --delete \
    --include "*.html" \
    --cache-control "public, max-age=0, must-revalidate" \
    --content-type "text/html" \
    --profile "$AWS_PROFILE" \
    --region "$AWS_REGION"

echo -e "${GREEN}✅ Upload complete${NC}"
echo ""

# Invalidate CloudFront Cache
if [ -n "$DISTRIBUTION_ID" ]; then
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}🔄 Invalidating CloudFront Cache${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"

    echo "Creating cache invalidation..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*" \
        --profile "$AWS_PROFILE" \
        --query 'Invalidation.Id' \
        --output text)

    if [ -n "$INVALIDATION_ID" ]; then
        echo -e "${GREEN}✅ Cache invalidation created: $INVALIDATION_ID${NC}"
        echo -e "${YELLOW}⚠️  Invalidation takes 5-15 minutes${NC}"
    fi
    echo ""
fi

# Summary
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo "Deployment Summary:"
echo "  - Environment: $ENV_LABEL"
echo "  - S3 Bucket: $BUCKET_NAME"
if [ -n "$DISTRIBUTION_ID" ]; then
    echo "  - CloudFront Distribution: $DISTRIBUTION_ID"
fi
echo "  - Build Size: $BUILD_SIZE"
echo ""
