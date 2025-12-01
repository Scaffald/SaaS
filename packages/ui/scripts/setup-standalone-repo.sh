#!/bin/bash
# Automated script to set up the standalone unicornlove-ui repository
# This script handles: repository creation, file copying, initial commit, and verification

set -e

REPO_NAME="unicornlove-ui"
ORG="Unicorn"
SOURCE_DIR="/Users/clay/Development/SCF-Scaffald/packages/ui"
WORKSPACE_DIR="/Users/clay/Development"
TARGET_DIR="${WORKSPACE_DIR}/${REPO_NAME}"

echo "🚀 Setting up standalone repository for @unicornlove/ui"
echo ""

# Step 1: Create GitHub repository
echo "📦 Step 1: Creating GitHub repository..."
if gh repo view "${ORG}/${REPO_NAME}" &>/dev/null; then
  echo "⚠️  Repository ${ORG}/${REPO_NAME} already exists. Skipping creation."
else
  gh repo create "${ORG}/${REPO_NAME}" \
    --public \
    --description "Comprehensive UI component library for Tamagui and Expo" \
    --clone=false
  echo "✅ Repository created: https://github.com/${ORG}/${REPO_NAME}"
fi

# Step 2: Clone or prepare directory
echo ""
echo "📥 Step 2: Preparing local directory..."
if [ -d "${TARGET_DIR}" ]; then
  echo "⚠️  Directory ${TARGET_DIR} already exists."
  read -p "Remove and recreate? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "${TARGET_DIR}"
  else
    echo "❌ Aborting. Please remove the directory manually or choose a different location."
    exit 1
  fi
fi

# Clone the repository
git clone "git@github.com:${ORG}/${REPO_NAME}.git" "${TARGET_DIR}"
cd "${TARGET_DIR}"

# Step 3: Copy files
echo ""
echo "📋 Step 3: Copying files from monorepo..."

# Copy files excluding node_modules, dist, and .turbo
rsync -av --exclude='node_modules' --exclude='dist' --exclude='.turbo' --exclude='.git' \
  "${SOURCE_DIR}"/ .

# Ensure hidden files are copied
if [ -d "${SOURCE_DIR}/.storybook" ]; then
  cp -r "${SOURCE_DIR}"/.storybook .
fi
if [ -d "${SOURCE_DIR}/.github" ]; then
  cp -r "${SOURCE_DIR}"/.github .
fi
if [ -f "${SOURCE_DIR}/.releaserc.json" ]; then
  cp "${SOURCE_DIR}"/.releaserc.json .
fi
if [ -f "${SOURCE_DIR}/.gitignore" ]; then
  cp "${SOURCE_DIR}"/.gitignore .
fi

# Remove any accidentally copied monorepo-specific files
rm -rf dist node_modules .turbo 2>/dev/null || true

# Step 4: Initial commit
echo ""
echo "💾 Step 4: Creating initial commit..."
git add .
git commit -m "chore: initial commit - migrate from monorepo

- Standalone package configuration
- All dependencies with explicit versions
- ESM-only build output
- Comprehensive test suite (106 tests passing)
- Storybook documentation
- CI/CD workflows
- Semantic-release configuration

REQ-311: UI Package Separation"

# Step 5: Push to GitHub
echo ""
echo "📤 Step 5: Pushing to GitHub..."
git branch -M main
git push -u origin main

# Step 6: Verify setup
echo ""
echo "✅ Step 6: Verifying setup..."
echo "Installing dependencies..."
pnpm install

echo "Building package..."
pnpm build

echo "Running tests..."
pnpm test:unit

echo "Type checking..."
pnpm check:type

echo ""
echo "🎉 Repository setup complete!"
echo ""
echo "Repository: https://github.com/${ORG}/${REPO_NAME}"
echo "Local directory: ${TARGET_DIR}"
echo ""
echo "Next steps:"
echo "1. Set up GitHub secrets (NPM_TOKEN):"
echo "   gh secret set NPM_TOKEN --repo ${ORG}/${REPO_NAME}"
echo ""
echo "2. Configure branch protection (optional):"
echo "   See packages/ui/scripts/setup-branch-protection.sh"
echo ""
echo "3. Publish alpha version:"
echo "   cd ${TARGET_DIR}"
echo "   npm publish --tag alpha --access public"

