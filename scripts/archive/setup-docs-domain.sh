#!/bin/bash
set -e

echo "🚀 Setting up docs.scaffald.com infrastructure"
echo "=============================================="

# Load AWS credentials from .env
export AWS_ACCESS_KEY_ID=$(grep AWS_KEY .env | cut -d= -f2)
export AWS_SECRET_ACCESS_KEY=$(grep AWS_SECRET .env | cut -d= -f2)
export AWS_DEFAULT_REGION=us-east-1

DOMAIN="docs.scaffald.com"
BUCKET_NAME="scaffald-sdk-docs"
HOSTED_ZONE_ID="Z03807932GT9W30LQ0T67"

echo ""
echo "📦 Step 1: Creating S3 bucket..."
aws s3 mb s3://${BUCKET_NAME} --region us-east-1 2>/dev/null || echo "Bucket already exists"

# Configure bucket for static website hosting
aws s3 website s3://${BUCKET_NAME} \
  --index-document index.html \
  --error-document 404.html

# Set bucket policy for public read access
cat > /tmp/bucket-policy.json << POLICY
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
  }]
}
POLICY

aws s3api put-bucket-policy \
  --bucket ${BUCKET_NAME} \
  --policy file:///tmp/bucket-policy.json

echo "✅ S3 bucket configured"

echo ""
echo "🔒 Step 2: Requesting SSL certificate..."
# Request certificate in us-east-1 (required for CloudFront)
CERT_ARN=$(aws acm request-certificate \
  --domain-name ${DOMAIN} \
  --validation-method DNS \
  --region us-east-1 \
  --query 'CertificateArn' \
  --output text 2>/dev/null || echo "")

if [ -z "$CERT_ARN" ]; then
  echo "⚠️  Certificate may already exist. Checking..."
  CERT_ARN=$(aws acm list-certificates \
    --region us-east-1 \
    --query "CertificateSummaryList[?DomainName=='${DOMAIN}'].CertificateArn" \
    --output text | head -1)
fi

echo "Certificate ARN: $CERT_ARN"

# Get validation record
echo "Waiting for validation records..."
sleep 5
VALIDATION_RECORD=$(aws acm describe-certificate \
  --certificate-arn ${CERT_ARN} \
  --region us-east-1 \
  --query 'Certificate.DomainValidationOptions[0].ResourceRecord' \
  --output json)

VALIDATION_NAME=$(echo $VALIDATION_RECORD | jq -r '.Name')
VALIDATION_VALUE=$(echo $VALIDATION_RECORD | jq -r '.Value')

echo ""
echo "📝 Step 3: Creating DNS validation record..."
cat > /tmp/dns-validation.json << DNSVAL
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "${VALIDATION_NAME}",
      "Type": "CNAME",
      "TTL": 300,
      "ResourceRecords": [{"Value": "${VALIDATION_VALUE}"}]
    }
  }]
}
DNSVAL

aws route53 change-resource-record-sets \
  --hosted-zone-id ${HOSTED_ZONE_ID} \
  --change-batch file:///tmp/dns-validation.json

echo "✅ DNS validation record created"
echo "⏳ Waiting for certificate validation (this may take a few minutes)..."

# Wait for certificate to be validated
aws acm wait certificate-validated \
  --certificate-arn ${CERT_ARN} \
  --region us-east-1 || echo "Validation in progress..."

echo ""
echo "☁️  Step 4: Creating CloudFront distribution..."

cat > /tmp/cloudfront-config.json << CFCONFIG
{
  "CallerReference": "scaffald-sdk-docs-$(date +%s)",
  "Aliases": {
    "Quantity": 1,
    "Items": ["${DOMAIN}"]
  },
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "S3-${BUCKET_NAME}",
      "DomainName": "${BUCKET_NAME}.s3-website-us-east-1.amazonaws.com",
      "CustomOriginConfig": {
        "HTTPPort": 80,
        "HTTPSPort": 443,
        "OriginProtocolPolicy": "http-only"
      }
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-${BUCKET_NAME}",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {"Forward": "none"}
    },
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "MinTTL": 0
  },
  "Comment": "Scaffald SDK Documentation",
  "Enabled": true,
  "ViewerCertificate": {
    "ACMCertificateArn": "${CERT_ARN}",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [{
      "ErrorCode": 404,
      "ResponsePagePath": "/404.html",
      "ResponseCode": "404",
      "ErrorCachingMinTTL": 300
    }]
  }
}
CFCONFIG

DISTRIBUTION_ID=$(aws cloudfront create-distribution \
  --distribution-config file:///tmp/cloudfront-config.json \
  --query 'Distribution.Id' \
  --output text 2>/dev/null || echo "")

if [ -z "$DISTRIBUTION_ID" ]; then
  echo "⚠️  CloudFront distribution may already exist"
  DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Aliases.Items[0]=='${DOMAIN}'].Id" \
    --output text | head -1)
fi

echo "Distribution ID: $DISTRIBUTION_ID"

# Get CloudFront domain name
CF_DOMAIN=$(aws cloudfront get-distribution \
  --id ${DISTRIBUTION_ID} \
  --query 'Distribution.DomainName' \
  --output text)

echo "CloudFront Domain: $CF_DOMAIN"

echo ""
echo "🌐 Step 5: Creating Route 53 record..."
cat > /tmp/dns-record.json << DNSREC
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "${DOMAIN}",
      "Type": "CNAME",
      "TTL": 300,
      "ResourceRecords": [{"Value": "${CF_DOMAIN}"}]
    }
  }]
}
DNSREC

aws route53 change-resource-record-sets \
  --hosted-zone-id ${HOSTED_ZONE_ID} \
  --change-batch file:///tmp/dns-record.json

echo "✅ DNS record created"

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo "Domain: https://${DOMAIN}"
echo "S3 Bucket: ${BUCKET_NAME}"
echo "CloudFront Distribution: ${DISTRIBUTION_ID}"
echo "Certificate: ${CERT_ARN}"
echo ""
echo "📝 Save these for GitHub Actions:"
echo "AWS_S3_BUCKET=${BUCKET_NAME}"
echo "AWS_CLOUDFRONT_DISTRIBUTION_ID=${DISTRIBUTION_ID}"
echo ""
echo "⏳ CloudFront deployment may take 15-20 minutes to propagate globally"
