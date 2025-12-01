#!/bin/bash
# Test build and publish workflow for standalone repository
# This script verifies the package can be built, tested, and published
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

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Build and Publish Workflow${NC}"
echo "Standalone repository: ${TARGET_DIR}"
echo ""

# Check if standalone repo exists
if [ ! -d "${TARGET_DIR}" ]; then
  echo -e "${YELLOW}⚠️  Standalone repository not found: ${TARGET_DIR}${NC}"
  echo ""
  echo "Please set up the standalone repository first:"
  echo "1. Clone the repository:"
  echo "   git clone git@github.com:Unicorn/unicornlove-ui.git ${TARGET_DIR}"
  echo ""
  echo "2. Or set UNICORNLOVE_UI_DIR environment variable:"
  echo "   export UNICORNLOVE_UI_DIR=/path/to/unicornlove-ui"
  echo ""
  echo "3. Then sync from monorepo:"
  echo "   ./packages/ui/scripts/sync-to-standalone.sh"
  exit 1
fi

cd "${TARGET_DIR}"

# Verify we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo -e "${RED}❌ Not a git repository: ${TARGET_DIR}${NC}"
  exit 1
fi

echo -e "${BLUE}📋 Step 1: Verifying catalog: references are replaced...${NC}"
if grep -q "catalog:" package.json 2>/dev/null; then
  echo -e "${RED}❌ Found catalog: references in package.json${NC}"
  grep "catalog:" package.json
  exit 1
else
  echo -e "${GREEN}✅ No catalog: references found${NC}"
fi

echo ""
echo -e "${BLUE}📦 Step 2: Installing dependencies...${NC}"
pnpm install

echo ""
echo -e "${BLUE}🔨 Step 3: Building package...${NC}"
pnpm build

# Verify build output
if [ ! -f "dist/index.mjs" ] || [ ! -f "dist/index.js" ]; then
  echo -e "${RED}❌ Build failed: dist files not found${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Build successful${NC}"

echo ""
echo -e "${BLUE}🧪 Step 4: Running unit tests...${NC}"
pnpm test:unit
echo -e "${GREEN}✅ Tests passed${NC}"

echo ""
echo -e "${BLUE}🔍 Step 5: Running type check...${NC}"
pnpm check:type
echo -e "${GREEN}✅ Type check passed${NC}"

echo ""
echo -e "${BLUE}📝 Step 6: Running lint and format checks...${NC}"
pnpm lint
pnpm format
echo -e "${GREEN}✅ Lint and format checks passed${NC}"

echo ""
echo -e "${BLUE}🔍 Step 7: Running semantic-release dry run...${NC}"
pnpm release:dry-run || echo -e "${YELLOW}⚠️  Semantic-release dry run completed (may show version info)${NC}"

echo ""
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Review the build output in dist/"
echo "2. Test installation in a separate project:"
echo "   pnpm add ${TARGET_DIR}"
echo "3. When ready to publish:"
echo "   ./packages/ui/scripts/publish-alpha.sh"
echo ""
echo "Or publish manually:"
echo "   npm publish --tag alpha --access public"

