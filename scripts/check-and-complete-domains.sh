#!/bin/bash
# Check SSL certificate status and complete domain setup when ready
# This script will check all certificates and run completion scripts for any that are ready

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

AWS_PROFILE="${AWS_PROFILE:-scf-notify}"

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}🔍 Checking SSL Certificate Status${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Certificate ARNs
DEV_CERT="arn:aws:acm:us-east-1:625030017471:certificate/7b66a184-999d-4e25-8d02-957824b9adf4"
PREVIEW_CERT="arn:aws:acm:us-east-1:625030017471:certificate/a41f1cd3-ebb1-428b-923f-0de6e08870ad"
PROD_CERT="arn:aws:acm:us-east-1:625030017471:certificate/d6c9b9af-bce0-4a2a-8bbe-c0d8d64d024c"

# Check each certificate
check_cert() {
    local cert_arn=$1
    local domain=$2
    local status=$(aws acm describe-certificate \
        --certificate-arn "$cert_arn" \
        --region us-east-1 \
        --profile "$AWS_PROFILE" \
        --query 'Certificate.Status' \
        --output text 2>/dev/null)
    
    echo -n "$domain.scaffald.com: "
    if [ "$status" == "ISSUED" ]; then
        echo -e "${GREEN}✅ ISSUED${NC}"
        return 0
    else
        echo -e "${YELLOW}⏳ $status${NC}"
        return 1
    fi
}

# Check all certificates
DEV_READY=false
PREVIEW_READY=false
PROD_READY=false

if check_cert "$DEV_CERT" "dev"; then
    DEV_READY=true
fi

if check_cert "$PREVIEW_CERT" "preview"; then
    PREVIEW_READY=true
fi

if check_cert "$PROD_CERT" "app"; then
    PROD_READY=true
fi

echo ""

# Run completion scripts for ready certificates
if [ "$DEV_READY" = true ]; then
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}🚀 Completing dev.scaffald.com setup${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    ./scripts/complete-dev-domain.sh
    echo ""
fi

if [ "$PREVIEW_READY" = true ]; then
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}🚀 Completing preview.scaffald.com setup${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    ./scripts/complete-preview-domain.sh
    echo ""
fi

if [ "$PROD_READY" = true ]; then
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}🚀 Completing app.scaffald.com setup${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    ./scripts/complete-prod-domain.sh
    echo ""
fi

# Summary
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

ALL_READY=true

if [ "$DEV_READY" = false ]; then
    echo -e "${YELLOW}⏳ dev.scaffald.com: Waiting for certificate validation${NC}"
    ALL_READY=false
else
    echo -e "${GREEN}✅ dev.scaffald.com: Setup complete${NC}"
fi

if [ "$PREVIEW_READY" = false ]; then
    echo -e "${YELLOW}⏳ preview.scaffald.com: Waiting for certificate validation${NC}"
    ALL_READY=false
else
    echo -e "${GREEN}✅ preview.scaffald.com: Setup complete${NC}"
fi

if [ "$PROD_READY" = false ]; then
    echo -e "${YELLOW}⏳ app.scaffald.com: Waiting for certificate validation${NC}"
    ALL_READY=false
else
    echo -e "${GREEN}✅ app.scaffald.com: Setup complete${NC}"
fi

echo ""

if [ "$ALL_READY" = true ]; then
    echo -e "${GREEN}✅ All domains are ready!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Wait 15-20 minutes for CloudFront distributions to deploy"
    echo "  2. Test domains:"
    echo "     - https://dev.scaffald.com"
    echo "     - https://preview.scaffald.com"
    echo "     - https://app.scaffald.com"
    echo "  3. Once verified, update nameservers at your registrar"
else
    echo -e "${YELLOW}⏳ Some certificates are still pending validation${NC}"
    echo ""
    echo "Run this script again in a few minutes:"
    echo "  ./scripts/check-and-complete-domains.sh"
fi

