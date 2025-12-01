#!/bin/bash
# Set up local development by switching between file reference and npm package
# Usage: ./setup-local-dev.sh [file|npm|link]

set -e

MODE="${1:-file}"
CORE_PACKAGE_JSON="/Users/clay/Development/SCF-Scaffald/packages/core/package.json"
STANDALONE_DIR="/Users/clay/Development/_packages/unicornlove-ui"

case "$MODE" in
  file)
    echo "🔧 Setting up file reference for local development..."
    # Use file reference for fast iteration
    if grep -q '"@unicornlove/ui":' "${CORE_PACKAGE_JSON}"; then
      sed -i '' 's|"@unicornlove/ui": "[^"]*"|"@unicornlove/ui": "file:../../_packages/unicornlove-ui"|' "${CORE_PACKAGE_JSON}"
      echo "✅ Updated to use file reference"
    fi
    ;;
  npm)
    echo "📦 Setting up npm package reference..."
    # Get latest published version
    LATEST_VERSION=$(cd "${STANDALONE_DIR}" && node -p "require('./package.json').version")
    if grep -q '"@unicornlove/ui":' "${CORE_PACKAGE_JSON}"; then
      sed -i '' "s|\"@unicornlove/ui\": \"[^\"]*\"|\"@unicornlove/ui\": \"^${LATEST_VERSION}\"|" "${CORE_PACKAGE_JSON}"
      echo "✅ Updated to use npm package @unicornlove/ui@^${LATEST_VERSION}"
    fi
    ;;
  link)
    echo "🔗 Setting up pnpm link..."
    # Link the package
    cd "${STANDALONE_DIR}"
    pnpm link --global
    echo "✅ Package linked globally"
    echo "Run: cd /Users/clay/Development/SCF-Scaffald && pnpm link --global @unicornlove/ui"
    ;;
  *)
    echo "Usage: $0 [file|npm|link]"
    echo "  file - Use file: reference (fastest, for active development)"
    echo "  npm  - Use published npm package (for production testing)"
    echo "  link - Use pnpm link (for testing built package)"
    exit 1
    ;;
esac

echo ""
echo "Run 'pnpm install' in the monorepo root to apply changes"

