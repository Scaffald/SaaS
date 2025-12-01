#!/bin/bash
# Set up branch protection for the unicornlove-ui repository

set -e

REPO_NAME="unicornlove-ui"
ORG="Unicorn"
BRANCH="main"

echo "🔒 Setting up branch protection for ${ORG}/${REPO_NAME}..."

# Get repository ID
REPO_ID=$(gh api "repos/${ORG}/${REPO_NAME}" --jq '.id')

# Create branch protection rule using JSON
gh api "repos/${ORG}/${REPO_NAME}/branches/${BRANCH}/protection" \
  --method PUT \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["test", "lint"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "restrictions": null
}
EOF

echo "✅ Branch protection configured for ${BRANCH} branch"
echo ""
echo "Protection rules:"
echo "- Require status checks: test, lint"
echo "- Require pull request reviews: 1 approval"
echo "- Enforce admins: true"

