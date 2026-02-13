#!/bin/bash
# Scaffald SDK Public Repository Setup Script
# Run this after creating the public repository at github.com/Scaffald/sdk

set -e

echo "🚀 Scaffald SDK Public Repository Setup"
echo "========================================"
echo ""

# Check if public repo exists
echo "📋 Step 1: Create Public Repository"
echo "   Go to: https://github.com/organizations/Scaffald/repositories/new"
echo "   - Name: sdk"
echo "   - Visibility: Public"
echo "   - Don't initialize (we'll push from here)"
echo ""
read -p "Press Enter once you've created the repository..."

# Add remote
echo ""
echo "🔗 Step 2: Adding remote..."
git remote add scaffald-sdk git@github.com:Scaffald/sdk.git 2>/dev/null || echo "Remote already exists"

# Initial sync using subtree
echo ""
echo "📦 Step 3: Syncing SDK package to public repo..."
echo "   This will push packages/scaffald-sdk/ to Scaffald/sdk"
git subtree split --prefix packages/scaffald-sdk -b scaffald-sdk-temp
git push scaffald-sdk scaffald-sdk-temp:main --force
git branch -D scaffald-sdk-temp

echo ""
echo "✅ Initial sync complete!"
echo ""

# Configure GitHub Pages
echo "📄 Step 4: Enable GitHub Pages"
echo "   Go to: https://github.com/Scaffald/sdk/settings/pages"
echo "   - Source: Deploy from a branch"
echo "   - Branch: gh-pages / (root)"
echo "   Note: gh-pages branch will be created by the first docs deployment"
echo ""
read -p "Press Enter once you've noted this..."

# Set up sync token
echo ""
echo "🔐 Step 5: Set up Auto-Sync Token"
echo "   1. Create token: https://github.com/settings/tokens/new"
echo "      - Name: 'UNI-Construct to Scaffald/sdk Sync'"
echo "      - Scopes: repo, workflow"
echo "   2. Add to UNI-Construct secrets:"
echo "      https://github.com/Unicorn/UNI-Construct/settings/secrets/actions"
echo "      - Name: SCAFFALD_SDK_SYNC_TOKEN"
echo "      - Value: [your token]"
echo ""
read -p "Press Enter once you've added the token..."

# Test the sync
echo ""
echo "🧪 Step 6: Test Auto-Sync Workflow"
echo "   Making a test change to trigger sync..."
cd packages/scaffald-sdk
echo "<!-- Automated sync test $(date) -->" >> README.md
git add README.md
git commit -m "test: verify auto-sync workflow"
git push origin main

echo ""
echo "   ✓ Pushed test commit"
echo "   ✓ Watch workflow at: https://github.com/Unicorn/UNI-Construct/actions"
echo "   ✓ Verify sync at: https://github.com/Scaffald/sdk"
echo ""

# Configure repository settings
echo "⚙️  Step 7: Configure Repository Settings"
echo "   Go to: https://github.com/Scaffald/sdk/settings"
echo ""
echo "   General:"
echo "   - ✅ Enable Issues"
echo "   - ✅ Enable Discussions"
echo ""
echo "   Topics (for discoverability):"
echo "   - sdk, scaffald, typescript, javascript, api-client, oauth, rest-api"
echo ""
echo "   About:"
echo "   - Website: https://scaffald.github.io/sdk/"
echo "   - Description: Official JavaScript/TypeScript SDK for the Scaffald API"
echo ""

# Summary
echo ""
echo "════════════════════════════════════════"
echo "✅ Setup Complete!"
echo "════════════════════════════════════════"
echo ""
echo "📦 npm Package: https://www.npmjs.com/package/@scaffald/sdk"
echo "💻 GitHub Repo: https://github.com/Scaffald/sdk"
echo "📚 Documentation: https://scaffald.github.io/sdk/ (after first deploy)"
echo ""
echo "🎉 The Scaffald SDK is now public!"
