#!/bin/bash
# Publish alpha version to npm
# Uses dynamic path discovery - set UNICORNLOVE_UI_DIR to override

set -e

# Get script directory and discover paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

# Allow override via environment variable
if [ -z "${UNICORNLOVE_UI_DIR}" ]; then
  # Try common locations
  if [ -d "${MONOREPO_ROOT}/../_packages/unicornlove-ui" ]; then
    TARGET_DIR="${MONOREPO_ROOT}/../_packages/unicornlove-ui"
  elif [ -d "${MONOREPO_ROOT}/../unicornlove-ui" ]; then
    TARGET_DIR="${MONOREPO_ROOT}/../unicornlove-ui"
  else
    TARGET_DIR="${MONOREPO_ROOT}/../_packages/unicornlove-ui"
  fi
else
  TARGET_DIR="${UNICORNLOVE_UI_DIR}"
fi

if [ ! -d "${TARGET_DIR}" ]; then
  echo "❌ Repository directory not found: ${TARGET_DIR}"
  echo ""
  echo "Options:"
  echo "1. Set UNICORNLOVE_UI_DIR environment variable:"
  echo "   export UNICORNLOVE_UI_DIR=/path/to/unicornlove-ui"
  echo ""
  echo "2. Clone the repository:"
  echo "   git clone git@github.com:Unicorn/unicornlove-ui.git ${TARGET_DIR}"
  exit 1
fi

cd "${TARGET_DIR}"

echo "📦 Publishing alpha version to npm..."
echo "Repository: ${TARGET_DIR}"
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
