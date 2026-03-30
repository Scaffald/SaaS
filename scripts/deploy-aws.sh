#!/bin/bash
# AWS Deployment Script
# Builds the app and deploys to S3 with CloudFront cache invalidation
# Supports multiple environments: dev, preview, production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse environment argument or detect from git branch
ENV="${1:-}"
if [ -z "$ENV" ]; then
    # Try to detect from git branch
    if git rev-parse --git-dir > /dev/null 2>&1; then
        BRANCH=$(git branch --show-current 2>/dev/null || echo "")
        case "$BRANCH" in
            main|master)
                ENV="dev"
                ;;
            preview)
                ENV="preview"
                ;;
            prod|production)
                ENV="production"
                ;;
            *)
                ENV="${AWS_ENV:-production}"
                ;;
        esac
    else
        ENV="${AWS_ENV:-production}"
    fi
fi

# Validate environment
if [[ ! "$ENV" =~ ^(dev|preview|production)$ ]]; then
    echo -e "${RED}❌ Invalid environment: $ENV${NC}"
    echo "Usage: $0 [dev|preview|production]"
    echo "Or set AWS_ENV environment variable"
    exit 1
fi

# Environment configuration
case "$ENV" in
    dev)
        BUCKET_SUFFIX="dev"
        ENV_LABEL="Development"
        ;;
    preview)
        BUCKET_SUFFIX="preview"
        ENV_LABEL="Preview"
        ;;
    production)
        BUCKET_SUFFIX="prod"
        ENV_LABEL="Production"
        ;;
esac

# Configuration
AWS_PROFILE="${AWS_PROFILE:-scaffald}"
AWS_REGION="${AWS_REGION:-us-east-1}"
_DEFAULT_BUCKET="$([ "$ENV" = "production" ] && echo "app-scaffald-com" || echo "${ENV}-scaffald-com")"
BUCKET_NAME="${AWS_S3_BUCKET:-$_DEFAULT_BUCKET}"
# Default distribution IDs (can be overridden via AWS_CLOUDFRONT_DISTRIBUTION_ID)
case "$ENV" in
    dev)        _DEFAULT_DIST_ID="E3J4DOM99FE5N" ;;
    preview)    _DEFAULT_DIST_ID="E1YYVZYC1XER5O" ;;
    production) _DEFAULT_DIST_ID="E22499AF1OBX1Y" ;;
esac
DISTRIBUTION_ID="${AWS_CLOUDFRONT_DISTRIBUTION_ID:-$_DEFAULT_DIST_ID}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_DIR="$PROJECT_ROOT/apps/scaffald/dist"
VERSION_BUMPED=false

bump_version_if_needed() {
    if [ "$VERSION_BUMPED" = true ]; then
        return
    fi

    echo -e "${YELLOW}Auto-incrementing application version...${NC}"
    local log_file="/tmp/version-bump.log"
    if pnpm version:auto >"$log_file" 2>&1; then
        VERSION_BUMPED=true
        echo -e "${GREEN}✅ $(tail -n 1 "$log_file")${NC}"
        rm -f "$log_file"
    else
        echo -e "${YELLOW}⚠️  Failed to auto-increment version (see $log_file)${NC}"
    fi
}

build_web_app() {
    local target_env="$1"
    local env_file="$PROJECT_ROOT/.env"

    case "$target_env" in
        production)
            env_file="$PROJECT_ROOT/.env.production"
            ;;
        preview)
            env_file="$PROJECT_ROOT/.env.preview"
            ;;
        dev|development)
            env_file="$PROJECT_ROOT/.env.dev"
            ;;
    esac

    echo -e "${BLUE}Building web application (${target_env})...${NC}"
    cd "$PROJECT_ROOT"

    bump_version_if_needed

    export EXPO_USE_FAST_REFRESH=false
    export NODE_ENV=production
    export APP_ENV="$target_env"

    if [ -f "$env_file" ]; then
        set -a
        # shellcheck disable=SC1090
        source "$env_file"
        set +a
        echo -e "${BLUE}Loaded environment from $env_file${NC}"
        echo "  EXPO_PUBLIC_SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL:-<unset>}"
        echo "  APP_ENV=$APP_ENV"
    else
        echo -e "${YELLOW}⚠️  Environment file not found at $env_file${NC}"
    fi

    pnpm --filter scaffald-app web:build

    echo "/* /index.html 200" > "$BUILD_DIR/_redirects"
    cat > "$BUILD_DIR/_headers" <<'EOF'
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=0, must-revalidate
EOF

    echo -e "${GREEN}✅ Build complete${NC}"
    echo ""
}

FORCE_REBUILD=false
if [ "$ENV" == "preview" ] || [ "$ENV" == "production" ]; then
    FORCE_REBUILD=true
fi

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}🚀 AWS Deployment - $ENV_LABEL${NC}"
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
    echo "   Run: aws configure --profile $AWS_PROFILE"
    exit 1
fi
echo -e "${GREEN}✅ AWS credentials verified${NC}"
echo ""

# Force clean build for preview/production deployments
if [ "$FORCE_REBUILD" = true ]; then
    echo -e "${YELLOW}Forcing fresh $ENV build...${NC}"
    rm -rf "$PROJECT_ROOT/.expo" \
        "$PROJECT_ROOT/apps/scaffald/.expo" \
        "$BUILD_DIR"
    build_web_app "$ENV"
fi

# If distribution ID not set, try to find it
if [ -z "$DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}⚠️  CloudFront distribution ID not set${NC}"
    echo "   Attempting to find distribution for environment..."
    
    # Try to get distribution ID from CloudFront
    case "$ENV" in
        dev)
            DOMAIN_PATTERN="dev.scaffald.com"
            ;;
        preview)
            DOMAIN_PATTERN="preview.scaffald.com"
            ;;
        production)
            DOMAIN_PATTERN="app.scaffald.com"
            ;;
    esac
    
    DISTRIBUTION_ID=$(aws cloudfront list-distributions \
        --profile "$AWS_PROFILE" \
        --query "DistributionList.Items[?Comment=='Scaffald App Static Hosting - $ENV_LABEL'].Id" \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$DISTRIBUTION_ID" ] || [ "$DISTRIBUTION_ID" == "None" ]; then
        echo -e "${YELLOW}⚠️  Could not find CloudFront distribution${NC}"
        echo "   Cache invalidation will be skipped"
        echo "   Set AWS_CLOUDFRONT_DISTRIBUTION_ID to enable cache invalidation"
    else
        echo -e "${GREEN}✅ Found CloudFront distribution: $DISTRIBUTION_ID${NC}"
    fi
    echo ""
fi

# Verify bucket exists
if ! aws s3api head-bucket --bucket "$BUCKET_NAME" --profile "$AWS_PROFILE" 2>/dev/null; then
    echo -e "${RED}❌ S3 bucket not found: $BUCKET_NAME${NC}"
    echo "   Run: pnpm deploy:aws:setup $ENV"
    exit 1
fi

# Verify build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${YELLOW}⚠️  Build directory not found: $BUILD_DIR${NC}"
    echo "   Building application..."
    echo ""
    
    # Check for environment-specific .env file
    ENV_FILE="$PROJECT_ROOT/.env.$ENV"
    if [ "$ENV" == "production" ]; then
        ENV_FILE="$PROJECT_ROOT/.env.production"
    fi
    
    if [ ! -f "$ENV_FILE" ] && [ ! -f "$PROJECT_ROOT/.env.production" ]; then
        echo -e "${YELLOW}⚠️  Warning: Environment file not found${NC}"
        echo "   Expected: $ENV_FILE or .env.production"
        read -p "Continue anyway? (y/n): " CONTINUE
        if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Set environment
    export NODE_ENV=production
    export APP_ENV="$ENV"
    export EXPO_USE_FAST_REFRESH=false

    # Load environment file if it exists
    if [ -f "$ENV_FILE" ]; then
        set -a
        source "$ENV_FILE"
        set +a
    elif [ -f "$PROJECT_ROOT/.env.production" ]; then
        set -a
        source "$PROJECT_ROOT/.env.production"
        set +a
    fi
    
    # Build workspace packages
    echo -e "${BLUE}Building workspace packages...${NC}"
    cd "$PROJECT_ROOT"
    pnpm --filter @scaffald/ui build
    pnpm --filter @scf/core build
    pnpm --filter @scf/schemas build
    
    # Build web app
    echo -e "${BLUE}Building web application...${NC}"
    build_web_app "$ENV"
fi

# Verify build output
if [ ! -f "$BUILD_DIR/index.html" ]; then
    echo -e "${RED}❌ Build output not found: $BUILD_DIR/index.html${NC}"
    exit 1
fi

BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
echo -e "${GREEN}✅ Build verified (Size: $BUILD_SIZE)${NC}"
echo ""

# Step 1: Upload to S3
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}📤 Step 1: Uploading to S3${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

echo "Uploading files to s3://$BUCKET_NAME..."
aws s3 sync "$BUILD_DIR" "s3://$BUCKET_NAME" \
    --delete \
    --exclude "*.map" \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "*.html" \
    --exclude "_redirects" \
    --exclude "_headers" \
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

# Upload redirects and headers files
if [ -f "$BUILD_DIR/_redirects" ]; then
    aws s3 cp "$BUILD_DIR/_redirects" "s3://$BUCKET_NAME/_redirects" \
        --profile "$AWS_PROFILE" \
        --region "$AWS_REGION"
fi

if [ -f "$BUILD_DIR/_headers" ]; then
    aws s3 cp "$BUILD_DIR/_headers" "s3://$BUCKET_NAME/_headers" \
        --profile "$AWS_PROFILE" \
        --region "$AWS_REGION"
fi

echo -e "${GREEN}✅ Upload complete${NC}"
echo ""

# Step 2: Invalidate CloudFront Cache
if [ -n "$DISTRIBUTION_ID" ]; then
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}🔄 Step 2: Invalidating CloudFront Cache${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    
    echo "Creating cache invalidation..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*" \
        --profile "$AWS_PROFILE" \
        --query 'Invalidation.Id' \
        --output text)
    
    if [ -n "$INVALIDATION_ID" ] && [ "$INVALIDATION_ID" != "None" ]; then
        echo -e "${GREEN}✅ Cache invalidation created: $INVALIDATION_ID${NC}"
        echo -e "${YELLOW}⚠️  Invalidation takes 5-15 minutes to complete${NC}"
    else
        echo -e "${YELLOW}⚠️  Failed to create cache invalidation${NC}"
    fi
    echo ""
else
    echo -e "${YELLOW}⚠️  CloudFront distribution ID not set${NC}"
    echo "   Set AWS_CLOUDFRONT_DISTRIBUTION_ID environment variable"
    echo "   or run: pnpm deploy:aws:setup $ENV"
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
    if [ -n "$INVALIDATION_ID" ]; then
        echo "  - Cache Invalidation: $INVALIDATION_ID"
    fi
fi
echo "  - Build Size: $BUILD_SIZE"
echo ""
echo -e "${YELLOW}⚠️  Note:${NC}"
echo "  - Files are now available in S3"
if [ -n "$DISTRIBUTION_ID" ]; then
    echo "  - CloudFront cache invalidation in progress"
    echo "  - Changes will be live in 5-15 minutes"
else
    echo "  - Set AWS_CLOUDFRONT_DISTRIBUTION_ID to enable cache invalidation"
fi
echo ""
