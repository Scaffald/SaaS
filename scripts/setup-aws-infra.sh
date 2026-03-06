#!/bin/bash
# AWS Infrastructure Setup Script
# Creates S3 bucket, CloudFront distribution, and configures Route53 DNS
# Supports multiple environments: dev, preview, production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse environment argument
ENV="${1:-production}"
if [[ ! "$ENV" =~ ^(dev|preview|production)$ ]]; then
    echo -e "${RED}❌ Invalid environment: $ENV${NC}"
    echo "Usage: $0 [dev|preview|production]"
    exit 1
fi

# Environment configuration
case "$ENV" in
    dev)
        BUCKET_SUFFIX="dev"
        DOMAIN_NAME="dev.app.scaffald.com"
        ENV_LABEL="Development"
        SETUP_DNS=false
        ;;
    preview)
        BUCKET_SUFFIX="preview"
        DOMAIN_NAME="preview.scaffald.com"
        ENV_LABEL="Preview"
        SETUP_DNS=true
        ;;
    production)
        BUCKET_SUFFIX="prod"
        DOMAIN_NAME="app.scaffald.com"
        ENV_LABEL="Production"
        SETUP_DNS=true
        ;;
esac

# Configuration
AWS_PROFILE="${AWS_PROFILE:-scaffald}"
AWS_REGION="${AWS_REGION:-us-east-1}"
BUCKET_NAME="scaffald-app-$BUCKET_SUFFIX"
HOSTED_ZONE_ID="Z0610739109YR6SDKL45L"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}🚀 AWS Infrastructure Setup - $ENV_LABEL${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo "Environment: $ENV"
echo "Bucket: $BUCKET_NAME"
echo "Domain: $DOMAIN_NAME"
echo ""

# Verify AWS credentials
echo -e "${YELLOW}Verifying AWS credentials...${NC}"
if ! aws sts get-caller-identity --profile "$AWS_PROFILE" &>/dev/null; then
    echo -e "${RED}❌ AWS credentials not found for profile: $AWS_PROFILE${NC}"
    echo "   Run: aws configure --profile $AWS_PROFILE"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --profile "$AWS_PROFILE" --query Account --output text)
echo -e "${GREEN}✅ AWS credentials verified (Account: $ACCOUNT_ID)${NC}"
echo ""

# Step 1: Create S3 Bucket
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}📦 Step 1: Creating S3 Bucket${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

# Check if bucket exists
if aws s3api head-bucket --bucket "$BUCKET_NAME" --profile "$AWS_PROFILE" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Bucket $BUCKET_NAME already exists${NC}"
    read -p "Continue with existing bucket? (y/n): " CONTINUE
    if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
        exit 0
    fi
else
    echo "Creating bucket: $BUCKET_NAME"
    if [ "$AWS_REGION" == "us-east-1" ]; then
        aws s3api create-bucket \
            --bucket "$BUCKET_NAME" \
            --region "$AWS_REGION" \
            --profile "$AWS_PROFILE"
    else
        aws s3api create-bucket \
            --bucket "$BUCKET_NAME" \
            --region "$AWS_REGION" \
            --create-bucket-configuration LocationConstraint="$AWS_REGION" \
            --profile "$AWS_PROFILE"
    fi
    echo -e "${GREEN}✅ Bucket created${NC}"
fi

# Configure bucket versioning
echo "Enabling versioning..."
aws s3api put-bucket-versioning \
    --bucket "$BUCKET_NAME" \
    --versioning-configuration Status=Enabled \
    --profile "$AWS_PROFILE"

# Block public access
echo "Configuring public access block..."
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
    --profile "$AWS_PROFILE"

# Enable static website hosting (for error document)
echo "Configuring static website hosting..."
aws s3api put-bucket-website \
    --bucket "$BUCKET_NAME" \
    --website-configuration "ErrorDocument={Key=index.html},IndexDocument={Suffix=index.html}" \
    --profile "$AWS_PROFILE"

echo -e "${GREEN}✅ S3 bucket configured${NC}"
echo ""

# Step 2: Request/Find ACM Certificate
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}🔒 Step 2: SSL Certificate${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

# Check for existing certificate
CERT_ARN=$(aws acm list-certificates \
    --region us-east-1 \
    --profile "$AWS_PROFILE" \
    --query "CertificateSummaryList[?DomainName=='$DOMAIN_NAME'].CertificateArn" \
    --output text)

if [ -z "$CERT_ARN" ] || [ "$CERT_ARN" == "None" ]; then
    if [ "$SETUP_DNS" == "true" ]; then
        echo "Requesting SSL certificate for $DOMAIN_NAME..."
        CERT_ARN=$(aws acm request-certificate \
            --domain-name "$DOMAIN_NAME" \
            --validation-method DNS \
            --region us-east-1 \
            --profile "$AWS_PROFILE" \
            --query 'CertificateArn' \
            --output text)
        
        echo -e "${YELLOW}⚠️  Certificate requested: $CERT_ARN${NC}"
        echo "   You must add DNS validation records to Route53"
        echo "   Run: aws acm describe-certificate --certificate-arn $CERT_ARN --region us-east-1 --profile $AWS_PROFILE"
        echo ""
        read -p "Have you validated the certificate? (y/n): " CERT_VALIDATED
        if [[ ! "$CERT_VALIDATED" =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}⚠️  Continuing without validated certificate. Update CloudFront later.${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Skipping SSL certificate for dev environment (using CloudFront default)${NC}"
        CERT_ARN=""
    fi
else
    echo -e "${GREEN}✅ Found existing certificate: $CERT_ARN${NC}"
    
    # Check certificate status
    CERT_STATUS=$(aws acm describe-certificate \
        --certificate-arn "$CERT_ARN" \
        --region us-east-1 \
        --profile "$AWS_PROFILE" \
        --query 'Certificate.Status' \
        --output text)
    
    if [ "$CERT_STATUS" != "ISSUED" ]; then
        echo -e "${YELLOW}⚠️  Certificate status: $CERT_STATUS${NC}"
        echo "   Certificate must be ISSUED before creating CloudFront distribution"
    fi
fi

echo ""

# Step 3: Create Origin Access Control
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}🔐 Step 3: Creating Origin Access Control${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

OAC_NAME="scaffald-app-$BUCKET_SUFFIX-oac"
OAC_ID=$(aws cloudfront list-origin-access-controls \
    --profile "$AWS_PROFILE" \
    --query "OriginAccessControlList.Items[?Name=='$OAC_NAME'].Id" \
    --output text 2>/dev/null || echo "")

if [ -z "$OAC_ID" ] || [ "$OAC_ID" == "None" ]; then
    echo "Creating Origin Access Control: $OAC_NAME"
    OAC_ID=$(aws cloudfront create-origin-access-control \
        --origin-access-control-config \
            "Name=$OAC_NAME,OriginAccessControlOriginType=s3,SigningBehavior=always,SigningProtocol=sigv4" \
        --profile "$AWS_PROFILE" \
        --query 'OriginAccessControl.Id' \
        --output text)
    
    if [ -z "$OAC_ID" ] || [ "$OAC_ID" == "None" ]; then
        echo -e "${RED}❌ Failed to create Origin Access Control${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Origin Access Control created: $OAC_ID${NC}"
else
    echo -e "${GREEN}✅ Found existing Origin Access Control: $OAC_ID${NC}"
fi

echo ""

# Step 4: Create CloudFront Distribution
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}🌐 Step 4: Creating CloudFront Distribution${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

# Check if distribution already exists
EXISTING_DIST=$(aws cloudfront list-distributions \
    --profile "$AWS_PROFILE" \
    --query "DistributionList.Items[?Aliases.Items[?@=='$DOMAIN_NAME']].Id" \
    --output text)

if [ -n "$EXISTING_DIST" ] && [ "$EXISTING_DIST" != "None" ]; then
    echo -e "${YELLOW}⚠️  CloudFront distribution already exists: $EXISTING_DIST${NC}"
    DISTRIBUTION_ID="$EXISTING_DIST"
else
    echo "Creating CloudFront distribution..."
    
    # Create distribution config file
    DIST_CONFIG_FILE="/tmp/cloudfront-dist-config-$BUCKET_SUFFIX.json"
    
    # Build base config
    cat > "$DIST_CONFIG_FILE" <<EOF
{
  "CallerReference": "scaffald-app-$BUCKET_SUFFIX-$(date +%s)",
  "Comment": "Scaffald App Static Hosting - $ENV_LABEL",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-$BUCKET_NAME",
        "DomainName": "$BUCKET_NAME.s3.$AWS_REGION.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        },
        "OriginAccessControlId": "$OAC_ID"
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-$BUCKET_NAME",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 7,
      "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true,
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    }
  },
  "CacheBehaviors": {
    "Quantity": 1,
    "Items": [
      {
        "PathPattern": "*.html",
        "TargetOriginId": "S3-$BUCKET_NAME",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"]
        },
        "ForwardedValues": {
          "QueryString": false,
          "Cookies": {
            "Forward": "none"
          }
        },
        "MinTTL": 0,
        "DefaultTTL": 0,
        "MaxTTL": 0,
        "Compress": true
      }
    ]
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
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
  },
  "Enabled": true,
EOF

    # Add aliases if certificate is available
    if [ -n "$CERT_ARN" ] && [ "$CERT_ARN" != "None" ]; then
        cat >> "$DIST_CONFIG_FILE" <<EOF
  "Aliases": {
    "Quantity": 1,
    "Items": ["$DOMAIN_NAME"]
  },
  "ViewerCertificate": {
    "ACMCertificateArn": "$CERT_ARN",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
EOF
    else
        cat >> "$DIST_CONFIG_FILE" <<EOF
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": true
  },
EOF
    fi
    
    # Close JSON
    cat >> "$DIST_CONFIG_FILE" <<EOF
  "PriceClass": "PriceClass_100",
  "HttpVersion": "http2and3",
  "IsIPV6Enabled": true
}
EOF
    
    DISTRIBUTION_ID=$(aws cloudfront create-distribution \
        --distribution-config file://"$DIST_CONFIG_FILE" \
        --profile "$AWS_PROFILE" \
        --query 'Distribution.Id' \
        --output text)
    
    if [ -z "$DISTRIBUTION_ID" ] || [ "$DISTRIBUTION_ID" == "None" ]; then
        echo -e "${RED}❌ Failed to create CloudFront distribution${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ CloudFront distribution created: $DISTRIBUTION_ID${NC}"
    echo -e "${YELLOW}⚠️  Distribution deployment takes 15-20 minutes${NC}"
fi

echo ""

# Step 5: Update S3 Bucket Policy with CloudFront ARN
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}📝 Step 5: Updating S3 Bucket Policy${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

CLOUDFRONT_ARN="arn:aws:cloudfront::$ACCOUNT_ID:distribution/$DISTRIBUTION_ID"

BUCKET_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "$CLOUDFRONT_ARN"
        }
      }
    }
  ]
}
EOF
)

echo "$BUCKET_POLICY" > /tmp/bucket-policy.json
aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy file:///tmp/bucket-policy.json \
    --profile "$AWS_PROFILE"

echo -e "${GREEN}✅ Bucket policy updated${NC}"
echo ""

# Step 6: Update Route53 DNS (if enabled)
if [ "$SETUP_DNS" == "true" ]; then
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}🌍 Step 6: Updating Route53 DNS${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    
    CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution \
        --id "$DISTRIBUTION_ID" \
        --profile "$AWS_PROFILE" \
        --query 'Distribution.DomainName' \
        --output text)
    
    echo "CloudFront domain: $CLOUDFRONT_DOMAIN"
    
    # Check if record exists
    EXISTING_RECORD=$(aws route53 list-resource-record-sets \
        --hosted-zone-id "$HOSTED_ZONE_ID" \
        --profile "$AWS_PROFILE" \
        --query "ResourceRecordSets[?Name=='$DOMAIN_NAME.']" \
        --output json)
    
    if echo "$EXISTING_RECORD" | grep -q "$DOMAIN_NAME"; then
        echo -e "${YELLOW}⚠️  DNS record for $DOMAIN_NAME already exists${NC}"
        read -p "Update existing record? (y/n): " UPDATE_DNS
        if [[ "$UPDATE_DNS" =~ ^[Yy]$ ]]; then
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
            aws route53 change-resource-record-sets \
                --hosted-zone-id "$HOSTED_ZONE_ID" \
                --change-batch file:///tmp/route53-change.json \
                --profile "$AWS_PROFILE"
            
            echo -e "${GREEN}✅ Route53 record updated${NC}"
        fi
    else
        echo "Creating Route53 A record..."
        CHANGE_BATCH=$(cat <<EOF
{
  "Changes": [
    {
      "Action": "CREATE",
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
        aws route53 change-resource-record-sets \
            --hosted-zone-id "$HOSTED_ZONE_ID" \
            --change-batch file:///tmp/route53-change.json \
            --profile "$AWS_PROFILE"
        
        echo -e "${GREEN}✅ Route53 record created${NC}"
    fi
    echo ""
else
    echo -e "${YELLOW}⚠️  Skipping DNS setup for dev environment${NC}"
    echo "   Access via CloudFront distribution domain"
    echo ""
fi

# Summary
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Infrastructure Setup Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo "Configuration:"
echo "  - Environment: $ENV_LABEL"
echo "  - S3 Bucket: $BUCKET_NAME"
echo "  - CloudFront Distribution: $DISTRIBUTION_ID"
if [ "$SETUP_DNS" == "true" ]; then
    echo "  - Domain: $DOMAIN_NAME"
fi
echo "  - Route53 Hosted Zone: $HOSTED_ZONE_ID"
echo ""
echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo "  1. Wait for CloudFront distribution to deploy (~15-20 minutes)"
if [ "$SETUP_DNS" == "true" ] && [ -z "$CERT_ARN" ]; then
    echo "  2. Verify SSL certificate is issued (if newly requested)"
fi
echo "  3. Test deployment: pnpm deploy:aws --env $ENV"
echo ""
echo "Environment variables to set:"
echo "  export AWS_ENV=$ENV"
echo "  export AWS_S3_BUCKET=$BUCKET_NAME"
echo "  export AWS_CLOUDFRONT_DISTRIBUTION_ID=$DISTRIBUTION_ID"
if [ "$SETUP_DNS" == "true" ]; then
    echo "  export AWS_DOMAIN=$DOMAIN_NAME"
fi
echo ""
