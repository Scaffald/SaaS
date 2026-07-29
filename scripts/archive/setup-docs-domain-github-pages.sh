#!/bin/bash
set -e

echo "🚀 Setting up docs.scaffald.com with GitHub Pages"
echo "================================================="

# Load AWS credentials
export AWS_ACCESS_KEY_ID=$(grep AWS_KEY .env | cut -d= -f2)
export AWS_SECRET_ACCESS_KEY=$(grep AWS_SECRET .env | cut -d= -f2)
export AWS_DEFAULT_REGION=us-east-1

DOMAIN="docs.scaffald.com"
GITHUB_PAGES="scaffald.github.io"
HOSTED_ZONE_ID="Z03807932GT9W30LQ0T67"

echo ""
echo "📝 Step 1: Adding CNAME file to Docusaurus static folder..."
echo "${DOMAIN}" > packages/scaffald-sdk/docs-site/static/CNAME
echo "✅ CNAME file created"

echo ""
echo "🌐 Step 2: Creating DNS CNAME record in Route 53..."
cat > /tmp/dns-cname.json << DNSCNAME
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "${DOMAIN}",
      "Type": "CNAME",
      "TTL": 300,
      "ResourceRecords": [{"Value": "${GITHUB_PAGES}"}]
    }
  }]
}
DNSCNAME

aws route53 change-resource-record-sets \
  --hosted-zone-id ${HOSTED_ZONE_ID} \
  --change-batch file:///tmp/dns-cname.json

echo "✅ DNS CNAME record created"

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Commit and push the CNAME file:"
echo "   git add packages/scaffald-sdk/docs-site/static/CNAME"
echo "   git commit -m 'feat(docs): add custom domain docs.scaffald.com'"
echo "   git push origin main"
echo ""
echo "2. Wait for GitHub Pages deployment workflow to complete"
echo ""
echo "3. Configure custom domain in GitHub repo settings:"
echo "   https://github.com/Scaffald/sdk/settings/pages"
echo "   - Custom domain: ${DOMAIN}"
echo "   - Enforce HTTPS: ✓"
echo ""
echo "4. Wait for DNS propagation (5-10 minutes)"
echo ""
echo "5. Your docs will be live at: https://${DOMAIN}"
