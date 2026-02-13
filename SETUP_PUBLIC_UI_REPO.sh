#!/bin/bash
# Scaffald UI Public Repository Setup Script
# Run this after creating the public repository at github.com/Scaffald/ui

set -e

echo "🚀 Scaffald UI Public Repository Setup"
echo "========================================"
echo ""

# Check if public repo exists
echo "📋 Step 1: Create Public Repository"
echo "   Go to: https://github.com/organizations/Scaffald/repositories/new"
echo "   - Name: ui"
echo "   - Visibility: Public"
echo "   - Don't initialize (we'll push from here)"
echo ""
read -p "Press Enter once you've created the repository..."

# Add remote
echo ""
echo "🔗 Step 2: Adding remote..."
git remote add scaffald-ui git@github.com:Scaffald/ui.git 2>/dev/null || echo "Remote already exists"

# Initial sync using subtree
echo ""
echo "📦 Step 3: Syncing UI package to public repo..."
echo "   This will push packages/scaffald-ui/ to Scaffald/ui"
git subtree split --prefix packages/scaffald-ui -b scaffald-ui-temp
git push scaffald-ui scaffald-ui-temp:main --force
git branch -D scaffald-ui-temp

echo ""
echo "✅ Initial sync complete!"
echo ""

# Configure GitHub Pages
echo "📄 Step 4: Enable GitHub Pages"
echo "   Go to: https://github.com/Scaffald/ui/settings/pages"
echo "   - Source: GitHub Actions"
echo "   Note: Pages will be deployed by the deploy-ui-docs workflow"
echo ""
read -p "Press Enter once you've configured Pages..."

# Set up sync token
echo ""
echo "🔐 Step 5: Set up Auto-Sync Token"
echo "   1. Create token: https://github.com/settings/tokens/new"
echo "      - Name: 'UNI-Construct to Scaffald/ui Sync'"
echo "      - Scopes: repo, workflow"
echo "   2. Add to UNI-Construct secrets:"
echo "      https://github.com/Unicorn/UNI-Construct/settings/secrets/actions"
echo "      - Name: SCAFFALD_UI_SYNC_TOKEN"
echo "      - Value: [your token]"
echo ""
read -p "Press Enter once you've added the token..."

# Set up NPM token
echo ""
echo "📦 Step 6: Set up NPM Publishing Token"
echo "   1. Create token: https://www.npmjs.com/settings/[username]/tokens"
echo "      - Type: Automation (for CI/CD)"
echo "      - Name: 'Scaffald UI Publishing'"
echo "   2. Add to UNI-Construct secrets:"
echo "      https://github.com/Unicorn/UNI-Construct/settings/secrets/actions"
echo "      - Name: NPM_TOKEN"
echo "      - Value: [your token]"
echo ""
read -p "Press Enter once you've added the NPM token..."

# Test the sync
echo ""
echo "🧪 Step 7: Test Auto-Sync & Release Workflow"
echo "   Making a test change to trigger sync and release..."
cd packages/scaffald-ui
echo "<!-- Automated sync test $(date) -->" >> README.md
git add README.md
git commit -m "feat(ui): verify auto-sync and publishing workflows

This test commit will trigger:
- Sync to github.com/Scaffald/ui
- Release to npm via semantic-release
- Documentation deployment to GitHub Pages"
git push origin main

echo ""
echo "   ✓ Pushed test commit"
echo "   ✓ Watch workflows at: https://github.com/Unicorn/UNI-Construct/actions"
echo "   ✓ Verify sync at: https://github.com/Scaffald/ui"
echo "   ✓ Verify npm release at: https://www.npmjs.com/package/@scaffald/ui"
echo "   ✓ Verify docs at: https://scaffald.github.io/ui/"
echo ""

# Configure repository settings
echo "⚙️  Step 8: Configure Repository Settings"
echo "   Go to: https://github.com/Scaffald/ui/settings"
echo ""
echo "   General:"
echo "   - ✅ Enable Issues"
echo "   - ✅ Enable Discussions"
echo ""
echo "   Topics (for discoverability):"
echo "   - ui, scaffald, react-native, expo, design-system, components, typescript"
echo ""
echo "   About:"
echo "   - Website: https://scaffald.github.io/ui/"
echo "   - Description: Best-in-class UI framework for Expo (React Native + Web)"
echo ""

# Summary
echo ""
echo "════════════════════════════════════════"
echo "✅ Setup Complete!"
echo "════════════════════════════════════════"
echo ""
echo "📦 npm Package: https://www.npmjs.com/package/@scaffald/ui"
echo "💻 GitHub Repo: https://github.com/Scaffald/ui"
echo "📚 Documentation: https://scaffald.github.io/ui/ (after first deploy)"
echo ""
echo "🎉 Scaffald UI is now public!"
echo ""
echo "Next steps:"
echo "1. Verify the test commit triggered all 3 workflows"
echo "2. Check that @scaffald/ui appears on npm"
echo "3. Verify documentation site deployed successfully"
echo "4. Update README.public.md if needed"
echo ""
