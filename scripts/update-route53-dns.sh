#!/bin/bash
# Update Route53 DNS record for app.scaffald.com to point to CloudFront

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_PROFILE="${AWS_PROFILE:-scf-notify}"
DOMAIN_NAME="app.scaffald.com"
HOSTED_ZONE_ID="Z0610739109YR6SDKL45L"
DISTRIBUTION_ID="${AWS_CLOUDFRONT_DISTRIBUTION_ID}"

if [ -z "$DISTRIBUTION_ID" ]; then
    echo -e "${RED}❌ AWS_CLOUDFRONT_DISTRIBUTION_ID not set${NC}"
    echo "   Set it with: export AWS_CLOUDFRONT_DISTRIBUTION_ID=<distribution-id>"
    exit 1
fi

echo -e "${BLUE}Updating Route53 DNS for $DOMAIN_NAME...${NC}"

# Get CloudFront domain name
CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution \
    --id "$DISTRIBUTION_ID" \
    --profile "$AWS_PROFILE" \
    --query 'Distribution.DomainName' \
    --output text)

if [ -z "$CLOUDFRONT_DOMAIN" ]; then
    echo -e "${RED}❌ Failed to get CloudFront domain${NC}"
    exit 1
fi

echo "CloudFront domain: $CLOUDFRONT_DOMAIN"

# Create change batch
CHANGE_BATCH=$(cat <<EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$DOMAIN_NAME",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "$CLOUDFRONT_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOF
)

echo "$CHANGE_BATCH" > /tmp/route53-change.json

# Apply change
CHANGE_ID=$(aws route53 change-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch file:///tmp/route53-change.json \
    --profile "$AWS_PROFILE" \
    --query 'ChangeInfo.Id' \
    --output text)

echo -e "${GREEN}✅ Route53 record updated${NC}"
echo "Change ID: $CHANGE_ID"
echo ""
echo -e "${YELLOW}⚠️  DNS changes may take a few minutes to propagate${NC}"

