#!/bin/bash
# Comprehensive status check for all AWS deployment components

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

AWS_PROFILE="${AWS_PROFILE:-scf-notify}"

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}📊 AWS Deployment Status Check${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Check nameservers
echo -e "${BLUE}1. Nameserver Status${NC}"
CURRENT_NS=$(dig +short NS scaffald.com 2>/dev/null | sort | tr '\n' ' ')
ROUTE53_NS=$(aws route53 get-hosted-zone --id Z0610739109YR6SDKL45L --profile "$AWS_PROFILE" --query 'DelegationSet.NameServers' --output text 2>/dev/null | tr '\t' '\n' | sort | tr '\n' ' ')

if [[ "$CURRENT_NS" == *"awsdns"* ]]; then
    echo -e "${GREEN}  ✅ Nameservers point to Route53${NC}"
else
    echo -e "${YELLOW}  ⏳ Nameservers still at: $CURRENT_NS${NC}"
    echo -e "${YELLOW}  ⏳ Expected: Route53 nameservers${NC}"
    echo -e "${YELLOW}  ⏳ DNS propagation can take up to 48 hours${NC}"
fi
echo ""

# Check SSL certificates
echo -e "${BLUE}2. SSL Certificate Status${NC}"
DEV_CERT="arn:aws:acm:us-east-1:625030017471:certificate/7b66a184-999d-4e25-8d02-957824b9adf4"
PREVIEW_CERT="arn:aws:acm:us-east-1:625030017471:certificate/a41f1cd3-ebb1-428b-923f-0de6e08870ad"
PROD_CERT="arn:aws:acm:us-east-1:625030017471:certificate/d6c9b9af-bce0-4a2a-8bbe-c0d8d64d024c"

check_cert() {
    local cert_arn=$1
    local domain=$2
    local status=$(aws acm describe-certificate \
        --certificate-arn "$cert_arn" \
        --region us-east-1 \
        --profile "$AWS_PROFILE" \
        --query 'Certificate.Status' \
        --output text 2>/dev/null)
    
    if [ "$status" == "ISSUED" ]; then
        echo -e "${GREEN}  ✅ $domain: ISSUED${NC}"
        return 0
    else
        echo -e "${YELLOW}  ⏳ $domain: $status${NC}"
        return 1
    fi
}

ALL_CERTS_READY=true
check_cert "$DEV_CERT" "dev.scaffald.com" || ALL_CERTS_READY=false
check_cert "$PREVIEW_CERT" "preview.scaffald.com" || ALL_CERTS_READY=false
check_cert "$PROD_CERT" "app.scaffald.com" || ALL_CERTS_READY=false
echo ""

# Check CloudFront aliases
echo -e "${BLUE}3. CloudFront Distribution Aliases${NC}"
DEV_DIST="E2GNS3I4O5M1RZ"
PREVIEW_DIST="E3R40C1707V33O"
PROD_DIST="E9DEIB1JW8O8H"

check_alias() {
    local dist_id=$1
    local env=$2
    local aliases=$(aws cloudfront get-distribution --id "$dist_id" --profile "$AWS_PROFILE" --query 'Distribution.DistributionConfig.Aliases.Items' --output json 2>/dev/null | jq -r '.[]' 2>/dev/null)
    
    if [ -n "$aliases" ] && [ "$aliases" != "null" ]; then
        echo -e "${GREEN}  ✅ $env: $aliases${NC}"
        return 0
    else
        echo -e "${YELLOW}  ⏳ $env: No alias configured${NC}"
        return 1
    fi
}

ALL_ALIASES_READY=true
check_alias "$DEV_DIST" "dev" || ALL_ALIASES_READY=false
check_alias "$PREVIEW_DIST" "preview" || ALL_ALIASES_READY=false
check_alias "$PROD_DIST" "production" || ALL_ALIASES_READY=false
echo ""

# Check DNS records
echo -e "${BLUE}4. DNS Records Status${NC}"
DNS_RECORDS=$(aws route53 list-resource-record-sets \
    --hosted-zone-id Z0610739109YR6SDKL45L \
    --profile "$AWS_PROFILE" \
    --query "ResourceRecordSets[?Name=='dev.scaffald.com.' || Name=='preview.scaffald.com.' || Name=='app.scaffald.com.']" \
    --output json 2>/dev/null)

if [ -n "$DNS_RECORDS" ] && [ "$DNS_RECORDS" != "[]" ]; then
    echo "$DNS_RECORDS" | jq -r '.[] | "  \(if .AliasTarget then "✅" else "⏳" end) \(.Name) (\(.Type)) → \(.AliasTarget.DNSName // .ResourceRecords[0].Value)"'
else
    echo -e "${YELLOW}  ⏳ No DNS A records found for custom domains${NC}"
fi
echo ""

# Check CloudFront deployment status
echo -e "${BLUE}5. CloudFront Deployment Status${NC}"
check_deployment() {
    local dist_id=$1
    local env=$2
    local status=$(aws cloudfront get-distribution --id "$dist_id" --profile "$AWS_PROFILE" --query 'Distribution.Status' --output text 2>/dev/null)
    
    if [ "$status" == "Deployed" ]; then
        echo -e "${GREEN}  ✅ $env: Deployed${NC}"
        return 0
    else
        echo -e "${YELLOW}  ⏳ $env: $status${NC}"
        return 1
    fi
}

ALL_DEPLOYED=true
check_deployment "$DEV_DIST" "dev" || ALL_DEPLOYED=false
check_deployment "$PREVIEW_DIST" "preview" || ALL_DEPLOYED=false
check_deployment "$PROD_DIST" "production" || ALL_DEPLOYED=false
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════${NC}"
if [ "$ALL_CERTS_READY" = true ] && [ "$ALL_ALIASES_READY" = true ] && [ "$ALL_DEPLOYED" = true ]; then
    echo -e "${GREEN}✅ ALL SYSTEMS GREEN!${NC}"
    echo ""
    echo "Your domains should be accessible at:"
    echo "  - https://dev.scaffald.com"
    echo "  - https://preview.scaffald.com"
    echo "  - https://app.scaffald.com"
else
    echo -e "${YELLOW}⏳ Some components still pending...${NC}"
    echo ""
    if [ "$ALL_CERTS_READY" = false ]; then
        echo "  - SSL certificates still validating"
        echo "    (Wait for nameservers to propagate, then run: ./scripts/check-and-complete-domains.sh)"
    fi
    if [ "$ALL_ALIASES_READY" = false ]; then
        echo "  - CloudFront aliases not configured"
        echo "    (Will be done automatically when certificates validate)"
    fi
    if [ "$ALL_DEPLOYED" = false ]; then
        echo "  - CloudFront distributions still deploying"
        echo "    (Takes 15-20 minutes after changes)"
    fi
fi
echo -e "${BLUE}═══════════════════════════════════════${NC}"

