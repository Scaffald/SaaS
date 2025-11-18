#!/bin/bash
# Fix CloudFront SPA routing by adding 403 error response
# This ensures that routes like /auth work on refresh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

AWS_PROFILE="${AWS_PROFILE:-scf-notify}"

# Distribution IDs
DEV_DIST="E2GNS3I4O5M1RZ"
PREVIEW_DIST="E3R40C1707V33O"
PROD_DIST="E9DEIB1JW8O8H"

update_distribution() {
    local DIST_ID=$1
    local ENV_NAME=$2
    
    echo -e "${BLUE}Updating $ENV_NAME distribution ($DIST_ID)...${NC}"
    
    # Get current distribution config
    aws cloudfront get-distribution-config \
        --id "$DIST_ID" \
        --profile "$AWS_PROFILE" \
        --output json > /tmp/dist-config-$ENV_NAME.json
    
    ETAG=$(jq -r '.ETag' /tmp/dist-config-$ENV_NAME.json)
    DIST_CONFIG=$(jq '.DistributionConfig' /tmp/dist-config-$ENV_NAME.json)
    
    # Check if 403 error response already exists
    HAS_403=$(echo "$DIST_CONFIG" | jq '.CustomErrorResponses.Items[] | select(.ErrorCode == 403)')
    
    if [ -n "$HAS_403" ]; then
        echo -e "${YELLOW}  ⚠️  403 error response already exists${NC}"
    else
        echo -e "${BLUE}  Adding 403 error response...${NC}"
        
        # Update CustomErrorResponses to include both 403 and 404
        UPDATED_CONFIG=$(echo "$DIST_CONFIG" | jq '
            .CustomErrorResponses.Quantity = 2 |
            .CustomErrorResponses.Items = [
                {
                    "ErrorCode": 403,
                    "ResponsePagePath": "/index.html",
                    "ResponseCode": "200",
                    "ErrorCachingMinTTL": 300
                },
                {
                    "ErrorCode": 404,
                    "ResponsePagePath": "/index.html",
                    "ResponseCode": "200",
                    "ErrorCachingMinTTL": 300
                }
            ]
        ')
        
        echo "$UPDATED_CONFIG" > /tmp/updated-dist-config-$ENV_NAME.json
        
        # Update distribution
        aws cloudfront update-distribution \
            --id "$DIST_ID" \
            --if-match "$ETAG" \
            --distribution-config file:///tmp/updated-dist-config-$ENV_NAME.json \
            --profile "$AWS_PROFILE" > /dev/null
        
        echo -e "${GREEN}  ✅ 403 error response added${NC}"
    fi
    
    echo ""
}

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}🔧 Fixing CloudFront SPA Routing${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo "This will add 403 error responses to handle SPA routing."
echo "When users refresh on routes like /auth, S3 returns 403,"
echo "and CloudFront needs to serve index.html instead."
echo ""

update_distribution "$DEV_DIST" "dev"
update_distribution "$PREVIEW_DIST" "preview"
update_distribution "$PROD_DIST" "production"

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ CloudFront distributions updated!${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "  - Distribution updates take 15-20 minutes to deploy"
echo "  - After deployment, SPA routing will work correctly"
echo "  - Routes like /auth will work on refresh"
echo ""
echo "You can check deployment status with:"
echo "  aws cloudfront get-distribution --id <DIST_ID> --profile $AWS_PROFILE --query 'Distribution.Status'"
echo ""

