#!/bin/bash
# Complete the app.scaffald.com domain setup for production
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
DOMAIN_NAME="app.scaffald.com"
HOSTED_ZONE_ID="Z0610739109YR6SDKL45L"
CERT_ARN="arn:aws:acm:us-east-1:625030017471:certificate/d6c9b9af-bce0-4a2a-8bbe-c0d8d64d024c"

# Get distribution ID
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --profile "$AWS_PROFILE" \
    --query "DistributionList.Items[?Comment=='Scaffald App Static Hosting - Production'].Id" \
    --output text)

if [ -z "$DISTRIBUTION_ID" ] || [ "$DISTRIBUTION_ID" == "None" ]; then
    echo -e "${RED}❌ CloudFront distribution not found${NC}"
    echo "   Please run: ./scripts/setup-aws-infra.sh production"
    exit 1
fi

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}🌍 Completing app.scaffald.com setup${NC}"
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
    --output json > /tmp/prod-dist-config.json

ETAG=$(jq -r '.ETag' /tmp/prod-dist-config.json)
DIST_CONFIG=$(jq '.DistributionConfig' /tmp/prod-dist-config.json)

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

echo "$UPDATED_CONFIG" > /tmp/prod-updated-dist-config.json

echo "Updating CloudFront distribution..."
aws cloudfront update-distribution \
    --id "$DISTRIBUTION_ID" \
    --if-match "$ETAG" \
    --distribution-config file:///tmp/prod-updated-dist-config.json \
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

echo "$CHANGE_BATCH" > /tmp/prod-dns-change.json
CHANGE_ID=$(aws route53 change-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch file:///tmp/prod-dns-change.json \
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
echo "  3. Access your production app at: https://$DOMAIN_NAME"
echo ""

