#!/bin/bash
# Portable local development setup script
# Usage: ./setup-local-dev.sh [link|npm|workspace]
# 
# Environment variables:
#   UNICORNLOVE_UI_DIR - Path to standalone repo (optional, defaults to ../_packages/unicornlove-ui)

set -e

MODE="${1:-link}"

# Get script directory and discover monorepo root dynamically
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
CORE_PACKAGE_JSON="${MONOREPO_ROOT}/packages/core/package.json"

# Allow override via environment variable, with intelligent defaults
if [ -z "${UNICORNLOVE_UI_DIR}" ]; then
  # Try common locations
  if [ -d "${MONOREPO_ROOT}/../_packages/unicornlove-ui" ]; then
    STANDALONE_DIR="${MONOREPO_ROOT}/../_packages/unicornlove-ui"
  elif [ -d "${MONOREPO_ROOT}/../unicornlove-ui" ]; then
    STANDALONE_DIR="${MONOREPO_ROOT}/../unicornlove-ui"
  else
    STANDALONE_DIR="${MONOREPO_ROOT}/../_packages/unicornlove-ui"
  fi
else
  STANDALONE_DIR="${UNICORNLOVE_UI_DIR}"
fi

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detect sed command for platform compatibility
if [[ "$OSTYPE" == "darwin"* ]]; then
  SED_CMD="sed -i ''"
else
  SED_CMD="sed -i"
fi

case "$MODE" in
  link)
    echo -e "${BLUE}🔗 Setting up pnpm link for local development${NC}"
    echo ""
    
    # Check if standalone repo exists
    if [ ! -d "${STANDALONE_DIR}" ]; then
      echo -e "${YELLOW}⚠️  Standalone repo not found at: ${STANDALONE_DIR}${NC}"
      echo ""
      echo "Options:"
      echo "1. Set UNICORNLOVE_UI_DIR environment variable:"
      echo "   export UNICORNLOVE_UI_DIR=/path/to/unicornlove-ui"
      echo ""
      echo "2. Clone the repo:"
      echo "   git clone git@github.com:Unicorn/unicornlove-ui.git ${STANDALONE_DIR}"
      echo ""
      echo "3. Or use npm mode instead:"
      echo "   $0 npm"
      exit 1
    fi
    
    # Link from standalone repo
    echo -e "${BLUE}📦 Linking package from: ${STANDALONE_DIR}${NC}"
    cd "${STANDALONE_DIR}"
    
    if [ ! -f "package.json" ]; then
      echo -e "${YELLOW}⚠️  package.json not found in standalone repo${NC}"
      exit 1
    fi
    
    pnpm link --global
    
    # Link in monorepo
    echo -e "${BLUE}🔗 Linking in monorepo...${NC}"
    cd "${MONOREPO_ROOT}"
    
    # Unlink first if already linked to avoid conflicts
    pnpm unlink --global @unicornlove/ui 2>/dev/null || true
    
    pnpm link --global @unicornlove/ui
    
    echo ""
    echo -e "${GREEN}✅ pnpm link set up!${NC}"
    echo ""
    echo "Development workflow:"
    echo "1. Make changes in: ${MONOREPO_ROOT}/packages/ui"
    echo "2. Sync: Run ./packages/ui/scripts/sync-to-standalone.sh"
    echo "3. Build: cd ${STANDALONE_DIR} && pnpm build"
    echo "4. Changes available immediately in monorepo"
    ;;
    
  npm)
    echo -e "${BLUE}📦 Setting up npm package reference${NC}"
    
    # Try to get version from standalone repo if available, otherwise from npm
    if [ -f "${STANDALONE_DIR}/package.json" ]; then
      VERSION=$(cd "${STANDALONE_DIR}" && node -p "require('./package.json').version")
      echo "Using version from local repo: ${VERSION}"
    else
      echo "Fetching latest version from npm..."
      VERSION=$(npm view @unicornlove/ui version 2>/dev/null || echo "^1.0.1")
      echo "Using version: ${VERSION}"
    fi
    
    if [ ! -f "${CORE_PACKAGE_JSON}" ]; then
      echo -e "${YELLOW}⚠️  package.json not found: ${CORE_PACKAGE_JSON}${NC}"
      exit 1
    fi
    
    if grep -q '"@unicornlove/ui":' "${CORE_PACKAGE_JSON}"; then
      $SED_CMD "s|\"@unicornlove/ui\": \"[^\"]*\"|\"@unicornlove/ui\": \"^${VERSION}\"|" "${CORE_PACKAGE_JSON}"
      echo -e "${GREEN}✅ Updated to use npm package @unicornlove/ui@^${VERSION}${NC}"
    else
      echo -e "${YELLOW}⚠️  @unicornlove/ui not found in dependencies${NC}"
      exit 1
    fi
    ;;
    
  workspace)
    echo -e "${BLUE}🔧 Setting up workspace (file:) reference${NC}"
    
    if [ ! -d "${STANDALONE_DIR}" ]; then
      echo -e "${YELLOW}⚠️  Standalone repo not found: ${STANDALONE_DIR}${NC}"
      echo "Cannot set up workspace reference without the repo."
      echo "Set UNICORNLOVE_UI_DIR environment variable or clone the repo first."
      exit 1
    fi
    
    # Calculate relative path from packages/core to standalone repo
    # Use Python for reliable cross-platform path resolution if available
    if command -v python3 &> /dev/null; then
      RELATIVE_PATH=$(python3 -c "import os, sys; print(os.path.relpath('${STANDALONE_DIR}', '${MONOREPO_ROOT}/packages/core'))")
    else
      # Fallback: try realpath if available
      if command -v realpath &> /dev/null; then
        RELATIVE_PATH=$(realpath --relative-to="${MONOREPO_ROOT}/packages/core" "${STANDALONE_DIR}" 2>/dev/null || echo "../../../_packages/unicornlove-ui")
      else
        # Simple fallback
        RELATIVE_PATH="../../../_packages/unicornlove-ui"
      fi
    fi
    
    if [ ! -f "${CORE_PACKAGE_JSON}" ]; then
      echo -e "${YELLOW}⚠️  package.json not found: ${CORE_PACKAGE_JSON}${NC}"
      exit 1
    fi
    
    if grep -q '"@unicornlove/ui":' "${CORE_PACKAGE_JSON}"; then
      $SED_CMD "s|\"@unicornlove/ui\": \"[^\"]*\"|\"@unicornlove/ui\": \"file:${RELATIVE_PATH}\"|" "${CORE_PACKAGE_JSON}"
      echo -e "${GREEN}✅ Updated to use workspace reference: file:${RELATIVE_PATH}${NC}"
    else
      echo -e "${YELLOW}⚠️  @unicornlove/ui not found in dependencies${NC}"
      exit 1
    fi
    ;;
    
  *)
    echo "Usage: $0 [link|npm|workspace]"
    echo ""
    echo "  link      - Use pnpm link (recommended, most portable)"
    echo "  npm       - Use published npm package"
    echo "  workspace - Use file: reference (fastest iteration)"
    echo ""
    echo "Environment variables:"
    echo "  UNICORNLOVE_UI_DIR - Path to standalone repo"
    echo "                       Default: ${MONOREPO_ROOT}/../_packages/unicornlove-ui"
    echo ""
    echo "Current paths:"
    echo "  Monorepo root: ${MONOREPO_ROOT}"
    echo "  Standalone dir: ${STANDALONE_DIR}"
    exit 1
    ;;
esac

echo ""
echo "Run 'pnpm install' in the monorepo root to apply changes"
