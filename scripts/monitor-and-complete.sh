#!/bin/bash
# Monitor certificate validation and automatically complete domain setup
# Runs checks every 30 seconds until all certificates are validated and setup is complete

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

AWS_PROFILE="${AWS_PROFILE:-scf-notify}"

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}🔄 Monitoring Certificate Validation${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo "This script will:"
echo "  1. Check certificate status every 30 seconds"
echo "  2. Automatically complete domain setup when certificates validate"
echo "  3. Continue until all domains are green"
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""

ITERATION=0
MAX_ITERATIONS=120  # 60 minutes max (120 * 30 seconds)

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
    ITERATION=$((ITERATION + 1))
    
    echo -e "${BLUE}[Check $ITERATION] $(date '+%H:%M:%S')${NC}"
    
    # Run the check and complete script
    if ./scripts/check-and-complete-domains.sh 2>&1 | grep -q "✅.*Setup complete"; then
        echo ""
        echo -e "${GREEN}═══════════════════════════════════════${NC}"
        echo -e "${GREEN}🎉 All domains are now complete!${NC}"
        echo -e "${GREEN}═══════════════════════════════════════${NC}"
        echo ""
        
        # Run final status check
        ./scripts/check-full-status.sh
        
        exit 0
    fi
    
    # Wait 30 seconds before next check
    if [ $ITERATION -lt $MAX_ITERATIONS ]; then
        echo ""
        sleep 30
    fi
done

echo ""
echo -e "${YELLOW}⚠️  Maximum monitoring time reached${NC}"
echo "Certificates may still be validating. Run manually:"
echo "  ./scripts/check-and-complete-domains.sh"

