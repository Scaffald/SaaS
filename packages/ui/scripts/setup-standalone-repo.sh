#!/bin/bash
# Automated script to set up the standalone unicornlove-ui repository
# This script handles: repository creation, file copying, initial commit, and verification

set -e

# Get script directory and discover monorepo root dynamically
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
SOURCE_DIR="${MONOREPO_ROOT}/packages/ui"

# Allow override via environment variable
WORKSPACE_DIR="${WORKSPACE_DIR:-$(cd "${MONOREPO_ROOT}/.." && pwd)}"
REPO_NAME="unicornlove-ui"
ORG="Unicorn"
TARGET_DIR="${WORKSPACE_DIR}/${REPO_NAME}"

echo "🚀 Setting up standalone repository for @unicornlove/ui"
echo "Source: ${SOURCE_DIR}"
echo "Target: ${TARGET_DIR}"
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
    echo "Set WORKSPACE_DIR environment variable to customize location."
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

# Replace catalog: references in devDependencies with explicit versions
echo ""
echo "🔧 Replacing catalog: references in devDependencies..."

# Use helper script if available
if [ -f "${SOURCE_DIR}/scripts/fix-dev-dependencies.sh" ]; then
  bash "${SOURCE_DIR}/scripts/fix-dev-dependencies.sh" "${TARGET_DIR}/package.json" "${MONOREPO_ROOT}/pnpm-workspace.yaml"
else
  # Inline replacements
  if [[ "$OSTYPE" == "darwin"* ]]; then
    SED_CMD="sed -i ''"
  else
    SED_CMD="sed -i"
  fi
  
  if grep -q '"@biomejs/biome": "catalog:"' package.json 2>/dev/null; then
    $SED_CMD 's/"@biomejs\/biome": "catalog:"/"@biomejs\/biome": "~2.3.6"/' package.json
    echo "  ✓ @biomejs/biome"
  fi
  if grep -q '"@types/node": "catalog:"' package.json 2>/dev/null; then
    $SED_CMD 's/"@types\/node": "catalog:"/"@types\/node": "~20.0.0"/' package.json
    echo "  ✓ @types/node"
  fi
  if grep -q '"@types/react": "catalog:"' package.json 2>/dev/null; then
    $SED_CMD 's/"@types\/react": "catalog:"/"@types\/react": "~19.1.0"/' package.json
    echo "  ✓ @types/react"
  fi
  if grep -q '"typescript": "catalog:"' package.json 2>/dev/null; then
    $SED_CMD 's/"typescript": "catalog:"/"typescript": "~5.9.2"/' package.json
    echo "  ✓ typescript"
  fi
fi

# Step 4: Initial commit
echo ""
echo "💾 Step 4: Creating initial commit..."
git add .
git commit -m "chore: initial commit - migrate from monorepo

- Standalone package configuration
- All dependencies with explicit versions
- ESM-only build output
- Comprehensive test suite
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
