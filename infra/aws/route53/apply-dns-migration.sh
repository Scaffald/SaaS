#!/bin/bash
# Script to apply DNS migration from CloudFlare to Route53
# Usage: ./apply-dns-migration.sh [--dry-run]

set -e

HOSTED_ZONE_ID="Z0610739109YR6SDKL45L"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CHANGE_BATCH_FILE="$SCRIPT_DIR/scaffald-complete-records.json"
AWS_PROFILE="scaffald"

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed"
    exit 1
fi

# Check if change batch file exists
if [ ! -f "$CHANGE_BATCH_FILE" ]; then
    echo "Error: Change batch file not found: $CHANGE_BATCH_FILE"
    exit 1
fi

# Validate JSON syntax
if ! jq empty "$CHANGE_BATCH_FILE" 2>/dev/null; then
    echo "Error: Invalid JSON in change batch file"
    exit 1
fi

echo "Route53 DNS Migration Script"
echo "============================"
echo "Hosted Zone ID: $HOSTED_ZONE_ID"
echo "Change Batch File: $CHANGE_BATCH_FILE"
echo "AWS Profile: $AWS_PROFILE"
echo ""

# Show what will be changed
echo "Records to be created/updated:"
jq -r '.Changes[] | "\(.Action): \(.ResourceRecordSet.Name) (\(.ResourceRecordSet.Type))"' "$CHANGE_BATCH_FILE"
echo ""

if [ "$1" == "--dry-run" ]; then
    echo "DRY RUN MODE - No changes will be applied"
    echo "To apply changes, run without --dry-run flag"
    exit 0
fi

# Confirm before applying
read -p "Apply these DNS changes to Route53? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Migration cancelled"
    exit 0
fi

# Apply the change batch
echo "Applying DNS changes..."
CHANGE_ID=$(aws route53 change-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch "file://$CHANGE_BATCH_FILE" \
    --profile "$AWS_PROFILE" \
    --query 'ChangeInfo.Id' \
    --output text)

echo "Change submitted successfully!"
echo "Change ID: $CHANGE_ID"
echo ""
echo "To check status:"
echo "  aws route53 get-change --id $CHANGE_ID --profile $AWS_PROFILE"
echo ""
echo "To verify records:"
echo "  aws route53 list-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID --profile $AWS_PROFILE"

