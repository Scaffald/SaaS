#!/bin/bash
# Non-interactive AWS infrastructure provisioner for Scaffald app
# Creates S3 + OAC + CloudFront + Route53 for dev, preview, and production
# Safe to re-run: all steps are idempotent

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

AWS_PROFILE="${AWS_PROFILE:-scaffald}"
AWS_REGION="${AWS_REGION:-us-east-1}"
HOSTED_ZONE_ID="Z03807932GT9W30LQ0T67"
WILDCARD_CERT_ARN="arn:aws:acm:us-east-1:827046730742:certificate/4e2b56a9-6b19-4ea8-aa2c-47781b65678e"

log()  { echo -e "${BLUE}$*${NC}"; }
ok()   { echo -e "${GREEN}✅ $*${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $*${NC}"; }
die()  { echo -e "${RED}❌ $*${NC}"; exit 1; }

# ──────────────────────────────────────────────────────────────────────────────
provision_env() {
  local ENV="$1"          # dev | preview | production
  local DOMAIN="$2"       # app.scaffald.com | preview.scaffald.com | dev.scaffald.com
  local BUCKET="$([ "$ENV" = "production" ] && echo "app-scaffald-com" || echo "${ENV}-scaffald-com")"
  local LABEL="$(tr '[:lower:]' '[:upper:]' <<< "${ENV:0:1}")${ENV:1}"

  echo ""
  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo -e "${BLUE}🚀 Provisioning: $LABEL ($DOMAIN)${NC}"
  echo -e "${BLUE}═══════════════════════════════════════${NC}"

  # ── S3 bucket ──────────────────────────────────────────────────────────────
  log "S3: $BUCKET"
  if aws s3api head-bucket --bucket "$BUCKET" --profile "$AWS_PROFILE" 2>/dev/null; then
    ok "Bucket exists: $BUCKET"
  else
    aws s3api create-bucket --bucket "$BUCKET" --region "$AWS_REGION" --profile "$AWS_PROFILE"
    ok "Bucket created: $BUCKET"
  fi

  aws s3api put-bucket-versioning \
    --bucket "$BUCKET" \
    --versioning-configuration Status=Enabled \
    --profile "$AWS_PROFILE" --region "$AWS_REGION"

  aws s3api put-public-access-block \
    --bucket "$BUCKET" \
    --public-access-block-configuration \
      "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
    --profile "$AWS_PROFILE" --region "$AWS_REGION"

  ok "S3 configured"

  # ── Origin Access Control ──────────────────────────────────────────────────
  local OAC_NAME="scaffald-app-${ENV}-oac"
  log "OAC: $OAC_NAME"
  local OAC_ID
  OAC_ID=$(aws cloudfront list-origin-access-controls \
    --profile "$AWS_PROFILE" \
    --query "OriginAccessControlList.Items[?Name=='$OAC_NAME'].Id" \
    --output text 2>/dev/null || echo "")

  if [ -z "$OAC_ID" ] || [ "$OAC_ID" = "None" ]; then
    OAC_ID=$(aws cloudfront create-origin-access-control \
      --origin-access-control-config \
        "Name=$OAC_NAME,OriginAccessControlOriginType=s3,SigningBehavior=always,SigningProtocol=sigv4,Description=OAC for $BUCKET" \
      --profile "$AWS_PROFILE" \
      --query 'OriginAccessControl.Id' \
      --output text)
    ok "OAC created: $OAC_ID"
  else
    ok "OAC exists: $OAC_ID"
  fi

  # ── CloudFront distribution ────────────────────────────────────────────────
  local CF_COMMENT="Scaffald App - $LABEL"
  log "CloudFront distribution for $DOMAIN"
  local DISTRIBUTION_ID
  DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --profile "$AWS_PROFILE" \
    --query "DistributionList.Items[?Comment=='$CF_COMMENT'].Id" \
    --output text 2>/dev/null || echo "")

  if [ -z "$DISTRIBUTION_ID" ] || [ "$DISTRIBUTION_ID" = "None" ]; then
    # Try with custom domain alias first; fall back to no-alias if CNAME is still
    # held by the old (deleted) account — AWS releases CNAMEs with a delay.
    local DIST_CONFIG_WITH_ALIAS
    DIST_CONFIG_WITH_ALIAS=$(cat <<JSON
{
  "CallerReference": "scaffald-app-${ENV}-$(date +%s)",
  "Comment": "$CF_COMMENT",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "S3-$BUCKET",
      "DomainName": "$BUCKET.s3.$AWS_REGION.amazonaws.com",
      "S3OriginConfig": { "OriginAccessIdentity": "" },
      "OriginAccessControlId": "$OAC_ID"
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-$BUCKET",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": { "Quantity": 2, "Items": ["GET","HEAD"], "CachedMethods": { "Quantity": 2, "Items": ["GET","HEAD"] } },
    "ForwardedValues": { "QueryString": false, "Cookies": { "Forward": "none" } },
    "MinTTL": 0, "DefaultTTL": 86400, "MaxTTL": 31536000,
    "Compress": true,
    "TrustedSigners": { "Enabled": false, "Quantity": 0 }
  },
  "CacheBehaviors": {
    "Quantity": 1,
    "Items": [{
      "PathPattern": "*.html",
      "TargetOriginId": "S3-$BUCKET",
      "ViewerProtocolPolicy": "redirect-to-https",
      "AllowedMethods": { "Quantity": 2, "Items": ["GET","HEAD"] },
      "ForwardedValues": { "QueryString": false, "Cookies": { "Forward": "none" } },
      "MinTTL": 0, "DefaultTTL": 0, "MaxTTL": 0,
      "Compress": true,
      "TrustedSigners": { "Enabled": false, "Quantity": 0 }
    }]
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      { "ErrorCode": 403, "ResponsePagePath": "/index.html", "ResponseCode": "200", "ErrorCachingMinTTL": 300 },
      { "ErrorCode": 404, "ResponsePagePath": "/index.html", "ResponseCode": "200", "ErrorCachingMinTTL": 300 }
    ]
  },
  "Aliases": { "Quantity": 1, "Items": ["$DOMAIN"] },
  "ViewerCertificate": {
    "ACMCertificateArn": "$WILDCARD_CERT_ARN",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "Enabled": true,
  "PriceClass": "PriceClass_100",
  "HttpVersion": "http2and3",
  "IsIPV6Enabled": true
}
JSON
)
    # First attempt: with custom domain
    set +e
    DISTRIBUTION_ID=$(echo "$DIST_CONFIG_WITH_ALIAS" | aws cloudfront create-distribution \
      --distribution-config file:///dev/stdin \
      --profile "$AWS_PROFILE" \
      --query 'Distribution.Id' \
      --output text 2>/tmp/cf-create-err.txt)
    local CF_EXIT=$?
    set -e

    if [ $CF_EXIT -ne 0 ] && grep -q "CNAMEAlreadyExists" /tmp/cf-create-err.txt 2>/dev/null; then
      warn "CNAME $DOMAIN still held by old account — creating without alias (re-run to add later)"
      # Create without alias using default CloudFront cert
      local DIST_CONFIG_NO_ALIAS
      DIST_CONFIG_NO_ALIAS=$(echo "$DIST_CONFIG_WITH_ALIAS" | \
        python3 -c "import sys,json; d=json.load(sys.stdin); d.pop('Aliases',None); d['ViewerCertificate']={'CloudFrontDefaultCertificate':True}; print(json.dumps(d))")
      DISTRIBUTION_ID=$(echo "$DIST_CONFIG_NO_ALIAS" | aws cloudfront create-distribution \
        --distribution-config file:///dev/stdin \
        --profile "$AWS_PROFILE" \
        --query 'Distribution.Id' \
        --output text)
      warn "Created without custom domain: $DISTRIBUTION_ID"
      warn "Run 'scripts/attach-cf-alias.sh $DISTRIBUTION_ID $DOMAIN' once CNAME is released"
    elif [ $CF_EXIT -ne 0 ]; then
      cat /tmp/cf-create-err.txt
      die "Failed to create CloudFront distribution"
    else
      ok "CloudFront created: $DISTRIBUTION_ID (deploying ~15 min)"
    fi
    rm -f /tmp/cf-create-err.txt
  else
    ok "CloudFront exists: $DISTRIBUTION_ID"
  fi

  # ── S3 bucket policy (allow CloudFront OAC) ────────────────────────────────
  local ACCOUNT_ID
  ACCOUNT_ID=$(aws sts get-caller-identity --profile "$AWS_PROFILE" --query Account --output text)
  local CF_ARN="arn:aws:cloudfront::$ACCOUNT_ID:distribution/$DISTRIBUTION_ID"

  aws s3api put-bucket-policy \
    --bucket "$BUCKET" \
    --profile "$AWS_PROFILE" \
    --policy "{
      \"Version\": \"2012-10-17\",
      \"Statement\": [{
        \"Sid\": \"AllowCloudFrontOAC\",
        \"Effect\": \"Allow\",
        \"Principal\": { \"Service\": \"cloudfront.amazonaws.com\" },
        \"Action\": \"s3:GetObject\",
        \"Resource\": \"arn:aws:s3:::$BUCKET/*\",
        \"Condition\": { \"StringEquals\": { \"AWS:SourceArn\": \"$CF_ARN\" } }
      }]
    }"
  ok "Bucket policy set"

  # ── Route53 DNS ────────────────────────────────────────────────────────────
  local CF_DOMAIN
  CF_DOMAIN=$(aws cloudfront get-distribution \
    --id "$DISTRIBUTION_ID" \
    --profile "$AWS_PROFILE" \
    --query 'Distribution.DomainName' \
    --output text)

  local CHANGE_BATCH
  CHANGE_BATCH=$(cat <<JSON
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "$DOMAIN",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z2FDTNDATAQYW2",
        "DNSName": "$CF_DOMAIN",
        "EvaluateTargetHealth": false
      }
    }
  }]
}
JSON
)
  echo "$CHANGE_BATCH" | aws route53 change-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch file:///dev/stdin \
    --profile "$AWS_PROFILE" > /dev/null
  ok "Route53 DNS → $CF_DOMAIN"

  # ── Output for GitHub secrets ──────────────────────────────────────────────
  echo ""
  echo "  SCAFFALD_AWS_S3_BUCKET_$(tr '[:lower:]' '[:upper:]' <<< "$ENV")=$BUCKET"
  echo "  SCAFFALD_AWS_CLOUDFRONT_DISTRIBUTION_ID_$(tr '[:lower:]' '[:upper:]' <<< "$ENV")=$DISTRIBUTION_ID"
  echo ""
}

# ── Main ──────────────────────────────────────────────────────────────────────
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}🏗️  Scaffald App Infrastructure Setup${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

aws sts get-caller-identity --profile "$AWS_PROFILE" > /dev/null || die "AWS credentials invalid for profile: $AWS_PROFILE"
ok "AWS credentials verified"

TARGET="${1:-all}"
case "$TARGET" in
  production) provision_env production app.scaffald.com ;;
  preview)    provision_env preview    preview.scaffald.com ;;
  dev)        provision_env dev        dev.scaffald.com ;;
  all)
    provision_env production app.scaffald.com
    provision_env preview    preview.scaffald.com
    provision_env dev        dev.scaffald.com
    ;;
  *) die "Usage: $0 [production|preview|dev|all]" ;;
esac

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Infrastructure provisioning complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo "Next: add the GitHub secrets above, then push to prod/preview/main to deploy."
echo "Note: New CloudFront distributions take ~15 min to go live."
echo "      DNS propagation takes up to 60 min (usually ~5 min)."
echo ""
