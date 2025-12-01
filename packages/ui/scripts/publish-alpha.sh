#!/bin/bash
# Publish alpha version to npm

set -e

REPO_NAME="unicornlove-ui"
WORKSPACE_DIR="/Users/clay/Development"
TARGET_DIR="${WORKSPACE_DIR}/${REPO_NAME}"

if [ ! -d "${TARGET_DIR}" ]; then
  echo "❌ Repository directory not found: ${TARGET_DIR}"
  echo "Please run setup-standalone-repo.sh first"
  exit 1
fi

cd "${TARGET_DIR}"

echo "📦 Publishing alpha version to npm..."
echo ""

# Check if logged in to npm
if ! npm whoami &>/dev/null; then
  echo "⚠️  Not logged in to npm. Please run: npm login"
  exit 1
fi

# Verify build
echo "🔨 Building package..."
pnpm build

# Verify tests
echo "🧪 Running tests..."
pnpm test:unit

# Dry run first
echo ""
echo "🔍 Running semantic-release dry run..."
pnpm release:dry-run

echo ""
read -p "Dry run looks good? Publish alpha version? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Aborted"
  exit 1
fi

# Publish alpha
echo ""
echo "🚀 Publishing alpha version..."
npm publish --tag alpha --access public

VERSION=$(node -p "require('./package.json').version")
echo ""
echo "✅ Published @unicornlove/ui@${VERSION} (alpha tag)"
echo ""
echo "Test installation:"
echo "  pnpm add @unicornlove/ui@alpha"
echo ""
echo "Or install specific version:"
echo "  pnpm add @unicornlove/ui@${VERSION}"

