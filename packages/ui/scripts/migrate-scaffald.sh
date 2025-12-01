#!/bin/bash
# Migration script to update SCF-Scaffald to use published @unicornlove/ui package
# Run this after the package has been published to npm

set -e

PACKAGE_VERSION="${1:-latest}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

echo "🔄 Migrating SCF-Scaffald to use @unicornlove/ui@${PACKAGE_VERSION}"

# Update packages/core/package.json
echo "📦 Updating packages/core/package.json..."
sed -i.bak 's/"@unicornlove\/ui": "workspace:\*"/"@unicornlove\/ui": "^'"${PACKAGE_VERSION}"'"/' "${ROOT_DIR}/packages/core/package.json"
rm -f "${ROOT_DIR}/packages/core/package.json.bak"

# Update packages/ui/examples/package.json (if it exists in standalone repo)
if [ -f "${ROOT_DIR}/packages/ui/examples/package.json" ]; then
  echo "📦 Updating packages/ui/examples/package.json..."
  sed -i.bak 's/"@unicornlove\/ui": "workspace:\*"/"@unicornlove\/ui": "^'"${PACKAGE_VERSION}"'"/' "${ROOT_DIR}/packages/ui/examples/package.json"
  rm -f "${ROOT_DIR}/packages/ui/examples/package.json.bak"
fi

# Update pnpm-workspace.yaml to remove packages/ui
echo "📝 Updating pnpm-workspace.yaml..."
if grep -q "packages/ui" "${ROOT_DIR}/pnpm-workspace.yaml"; then
  sed -i.bak '/- packages\/ui/d' "${ROOT_DIR}/pnpm-workspace.yaml"
  rm -f "${ROOT_DIR}/pnpm-workspace.yaml.bak"
fi

# Install dependencies
echo "📥 Installing dependencies..."
cd "${ROOT_DIR}"
pnpm install

# Run checks
echo "✅ Running checks..."
pnpm check

echo "✨ Migration complete! The package is now using @unicornlove/ui@${PACKAGE_VERSION}"
echo ""
echo "Next steps:"
echo "1. Test the application: pnpm dev"
echo "2. Run full test suite: pnpm test:all"
echo "3. If everything works, commit the changes"
echo "4. Optionally remove packages/ui directory after verification period"

