#!/bin/bash
# Attaches a custom domain alias + ACM cert to an existing CloudFront distribution
# Usage: ./scripts/attach-cf-alias.sh <distribution-id> <domain>
# Run this once AWS releases the CNAME from the old deleted account

set -euo pipefail

DISTRIBUTION_ID="${1:-}"
DOMAIN="${2:-}"
AWS_PROFILE="${AWS_PROFILE:-scaffald}"
WILDCARD_CERT_ARN="arn:aws:acm:us-east-1:827046730742:certificate/4e2b56a9-6b19-4ea8-aa2c-47781b65678e"

[ -z "$DISTRIBUTION_ID" ] && echo "Usage: $0 <distribution-id> <domain>" && exit 1
[ -z "$DOMAIN" ] && echo "Usage: $0 <distribution-id> <domain>" && exit 1

echo "Fetching current distribution config..."
ETAG=$(aws cloudfront get-distribution-config \
  --id "$DISTRIBUTION_ID" \
  --profile "$AWS_PROFILE" \
  --query 'ETag' --output text)

aws cloudfront get-distribution-config \
  --id "$DISTRIBUTION_ID" \
  --profile "$AWS_PROFILE" \
  --query 'DistributionConfig' > /tmp/cf-config.json

echo "Updating config with alias $DOMAIN..."
python3 - <<EOF
import json

with open('/tmp/cf-config.json') as f:
    config = json.load(f)

config['Aliases'] = {'Quantity': 1, 'Items': ['$DOMAIN']}
config['ViewerCertificate'] = {
    'ACMCertificateArn': '$WILDCARD_CERT_ARN',
    'SSLSupportMethod': 'sni-only',
    'MinimumProtocolVersion': 'TLSv1.2_2021'
}

with open('/tmp/cf-config-updated.json', 'w') as f:
    json.dump(config, f)
EOF

aws cloudfront update-distribution \
  --id "$DISTRIBUTION_ID" \
  --distribution-config file:///tmp/cf-config-updated.json \
  --if-match "$ETAG" \
  --profile "$AWS_PROFILE" \
  --query 'Distribution.{Id:Id,Domain:DomainName}' \
  --output json

echo "✅ Alias $DOMAIN attached to $DISTRIBUTION_ID"
rm -f /tmp/cf-config.json /tmp/cf-config-updated.json
