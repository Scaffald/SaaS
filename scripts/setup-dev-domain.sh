#!/bin/bash
# Setup dev.scaffald.com domain for dev environment
# This script adds the custom domain to the dev CloudFront distribution

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_PROFILE="${AWS_PROFILE:-scaffald}"
AWS_REGION="${AWS_REGION:-us-east-1}"
DOMAIN_NAME="dev.scaffald.com"
HOSTED_ZONE_ID="Z03807932GT9W30LQ0T67"
DISTRIBUTION_ID="${AWS_CLOUDFRONT_DISTRIBUTION_ID:-E2GNS3I4O5M1RZ}"

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}🌍 Setting up dev.scaffald.com domain${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Step 1: Check/Request SSL Certificate
echo -e "${BLUE}Step 1: SSL Certificate${NC}"
CERT_ARN=$(aws acm list-certificates \
    --region us-east-1 \
    --profile "$AWS_PROFILE" \
    --query "CertificateSummaryList[?DomainName=='$DOMAIN_NAME'].CertificateArn" \
    --output text)

if [ -z "$CERT_ARN" ] || [ "$CERT_ARN" == "None" ]; then
    echo "Requesting SSL certificate for $DOMAIN_NAME..."
    CERT_ARN=$(aws acm request-certificate \
        --domain-name "$DOMAIN_NAME" \
        --validation-method DNS \
        --region us-east-1 \
        --profile "$AWS_PROFILE" \
        --query 'CertificateArn' \
        --output text)
    echo -e "${GREEN}✅ Certificate requested: $CERT_ARN${NC}"
else
    echo -e "${GREEN}✅ Found existing certificate: $CERT_ARN${NC}"
fi

# Get certificate status
CERT_STATUS=$(aws acm describe-certificate \
    --certificate-arn "$CERT_ARN" \
    --region us-east-1 \
    --profile "$AWS_PROFILE" \
    --query 'Certificate.Status' \
    --output text)

echo "Certificate status: $CERT_STATUS"

# Get validation record if not validated
if [ "$CERT_STATUS" != "ISSUED" ]; then
    echo -e "${YELLOW}⚠️  Certificate not yet validated${NC}"
    VALIDATION_RECORD=$(aws acm describe-certificate \
        --certificate-arn "$CERT_ARN" \
        --region us-east-1 \
        --profile "$AWS_PROFILE" \
        --query 'Certificate.DomainValidationOptions[0].ResourceRecord' \
        --output json)
    
    if [ "$VALIDATION_RECORD" != "null" ] && [ -n "$VALIDATION_RECORD" ]; then
        VALIDATION_NAME=$(echo "$VALIDATION_RECORD" | jq -r '.Name')
        VALIDATION_VALUE=$(echo "$VALIDATION_RECORD" | jq -r '.Value')
        
        echo "Adding DNS validation record to Route53..."
        CHANGE_BATCH=$(cat <<EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$VALIDATION_NAME",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "$VALIDATION_VALUE"
          }
        ]
      }
    }
  ]
}
EOF
)
        echo "$CHANGE_BATCH" > /tmp/validation-record.json
        aws route53 change-resource-record-sets \
            --hosted-zone-id "$HOSTED_ZONE_ID" \
            --change-batch file:///tmp/validation-record.json \
            --profile "$AWS_PROFILE" > /dev/null
        
        echo -e "${GREEN}✅ Validation record added${NC}"
        echo -e "${YELLOW}⚠️  Waiting for certificate validation (this may take a few minutes)...${NC}"
        echo "   You can check status with:"
        echo "   aws acm describe-certificate --certificate-arn $CERT_ARN --region us-east-1 --profile $AWS_PROFILE --query 'Certificate.Status'"
        echo ""
        read -p "Press Enter once certificate is ISSUED, or Ctrl+C to exit and run this script again later..."
        
        # Re-check status
        CERT_STATUS=$(aws acm describe-certificate \
            --certificate-arn "$CERT_ARN" \
            --region us-east-1 \
            --profile "$AWS_PROFILE" \
            --query 'Certificate.Status' \
            --output text)
    fi
fi

if [ "$CERT_STATUS" != "ISSUED" ]; then
    echo -e "${RED}❌ Certificate is not ISSUED. Current status: $CERT_STATUS${NC}"
    echo "   Please wait for validation and run this script again."
    exit 1
fi

echo -e "${GREEN}✅ Certificate is validated${NC}"
echo ""

# Step 2: Update CloudFront Distribution
echo -e "${BLUE}Step 2: Updating CloudFront Distribution${NC}"

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

# Step 3: Update Route53 DNS
echo -e "${BLUE}Step 3: Updating Route53 DNS${NC}"

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

echo -e "${GREEN}✅ Route53 DNS record updated${NC}"
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
echo "  3. Access your app at: https://$DOMAIN_NAME"
echo ""

