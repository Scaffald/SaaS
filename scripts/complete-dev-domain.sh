#!/bin/bash
# Complete the dev.scaffald.com domain setup
# Run this once the SSL certificate is validated

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_PROFILE="${AWS_PROFILE:-scf-notify}"
DOMAIN_NAME="dev.scaffald.com"
HOSTED_ZONE_ID="Z0610739109YR6SDKL45L"
DISTRIBUTION_ID="${AWS_CLOUDFRONT_DISTRIBUTION_ID:-E2GNS3I4O5M1RZ}"
CERT_ARN="arn:aws:acm:us-east-1:625030017471:certificate/7b66a184-999d-4e25-8d02-957824b9adf4"

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}🌍 Completing dev.scaffald.com setup${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Check certificate status
echo -e "${BLUE}Checking SSL certificate status...${NC}"
CERT_STATUS=$(aws acm describe-certificate \
    --certificate-arn "$CERT_ARN" \
    --region us-east-1 \
    --profile "$AWS_PROFILE" \
    --query 'Certificate.Status' \
    --output text)

if [ "$CERT_STATUS" != "ISSUED" ]; then
    echo -e "${RED}❌ Certificate is not yet validated${NC}"
    echo "   Current status: $CERT_STATUS"
    echo ""
    echo "   The validation record has been added to Route53."
    echo "   Please wait a few minutes for AWS to validate the certificate,"
    echo "   then run this script again."
    echo ""
    echo "   Check status with:"
    echo "   aws acm describe-certificate --certificate-arn $CERT_ARN --region us-east-1 --profile $AWS_PROFILE --query 'Certificate.Status'"
    exit 1
fi

echo -e "${GREEN}✅ Certificate is validated${NC}"
echo ""

# Step 1: Update CloudFront Distribution
echo -e "${BLUE}Step 1: Updating CloudFront Distribution${NC}"

# Get current distribution config
aws cloudfront get-distribution-config \
    --id "$DISTRIBUTION_ID" \
    --profile "$AWS_PROFILE" \
    --output json > /tmp/dist-config.json

ETAG=$(jq -r '.ETag' /tmp/dist-config.json)
DIST_CONFIG=$(jq '.DistributionConfig' /tmp/dist-config.json)

# Update config with alias and certificate
UPDATED_CONFIG=$(echo "$DIST_CONFIG" | jq \
    --arg domain "$DOMAIN_NAME" \
    --arg cert "$CERT_ARN" \
    '.Aliases.Quantity = 1 |
     .Aliases.Items = [$domain] |
     .ViewerCertificate.ACMCertificateArn = $cert |
     .ViewerCertificate.SSLSupportMethod = "sni-only" |
     .ViewerCertificate.MinimumProtocolVersion = "TLSv1.2_2021" |
     del(.ViewerCertificate.CloudFrontDefaultCertificate)')

echo "$UPDATED_CONFIG" > /tmp/updated-dist-config.json

echo "Updating CloudFront distribution..."
aws cloudfront update-distribution \
    --id "$DISTRIBUTION_ID" \
    --if-match "$ETAG" \
    --distribution-config file:///tmp/updated-dist-config.json \
    --profile "$AWS_PROFILE" > /dev/null

echo -e "${GREEN}✅ CloudFront distribution updated${NC}"
echo -e "${YELLOW}⚠️  Distribution update takes 15-20 minutes to deploy${NC}"
echo ""

# Step 2: Update Route53 DNS
echo -e "${BLUE}Step 2: Updating Route53 DNS${NC}"

# Get CloudFront domain
CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution \
    --id "$DISTRIBUTION_ID" \
    --profile "$AWS_PROFILE" \
    --query 'Distribution.DomainName' \
    --output text)

echo "CloudFront domain: $CLOUDFRONT_DOMAIN"

# Create/update DNS record
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

echo "$CHANGE_BATCH" > /tmp/dns-change.json
CHANGE_ID=$(aws route53 change-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch file:///tmp/dns-change.json \
    --profile "$AWS_PROFILE" \
    --query 'ChangeInfo.Id' \
    --output text)

echo -e "${GREEN}✅ Route53 DNS record created${NC}"
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Domain Setup Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo "Configuration:"
echo "  - Domain: $DOMAIN_NAME"
echo "  - SSL Certificate: $CERT_ARN"
echo "  - CloudFront Distribution: $DISTRIBUTION_ID"
echo "  - CloudFront Domain: $CLOUDFRONT_DOMAIN"
echo "  - Route53 Change ID: $CHANGE_ID"
echo ""
echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo "  1. Wait for CloudFront distribution update to deploy (~15-20 minutes)"
echo "  2. Wait for DNS propagation (usually a few minutes)"
echo "  3. Access your dev app at: https://$DOMAIN_NAME"
echo ""

