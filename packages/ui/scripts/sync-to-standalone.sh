#!/bin/bash
# Portable sync script - discovers paths dynamically
# Sync changes from monorepo packages/ui to standalone unicornlove-ui repository
#
# Environment variables:
#   UNICORNLOVE_UI_DIR - Path to standalone repo (optional, defaults to ../_packages/unicornlove-ui)

set -e

# Get script directory and discover monorepo root dynamically
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
SOURCE_DIR="${MONOREPO_ROOT}/packages/ui"

# Allow override via environment variable, with intelligent defaults
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

echo -e "${BLUE}🔄 Syncing packages/ui to standalone repository${NC}"
echo "Source: ${SOURCE_DIR}"
echo "Target: ${TARGET_DIR}"
echo ""

# Check if directories exist
if [ ! -d "${SOURCE_DIR}" ]; then
  echo -e "${RED}❌ Source directory not found: ${SOURCE_DIR}${NC}"
  exit 1
fi

if [ ! -d "${TARGET_DIR}" ]; then
  echo -e "${YELLOW}⚠️  Standalone repository not found: ${TARGET_DIR}${NC}"
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

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Not a git repository: ${TARGET_DIR}${NC}"
  exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  echo -e "${YELLOW}⚠️  Uncommitted changes detected in standalone repo${NC}"
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted. Please commit or stash changes first."
    exit 1
  fi
fi

# Create a backup branch before syncing
BACKUP_BRANCH="backup-before-sync-$(date +%Y%m%d-%H%M%S)"
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
echo -e "${BLUE}📦 Creating backup branch: ${BACKUP_BRANCH}${NC}"
git branch "${BACKUP_BRANCH}" 2>/dev/null || true

# Return to current branch
git checkout "${CURRENT_BRANCH}" > /dev/null 2>&1 || git checkout -b main > /dev/null 2>&1

echo ""
echo -e "${BLUE}📋 Copying files from monorepo...${NC}"

# Copy files excluding node_modules, dist, and .turbo
rsync -av --delete \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.turbo' \
  --exclude='.git' \
  --exclude='.DS_Store' \
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

echo ""
echo -e "${BLUE}🔧 Replacing catalog: references in devDependencies...${NC}"

# Detect sed command for platform compatibility
if [[ "$OSTYPE" == "darwin"* ]]; then
  SED_CMD="sed -i ''"
else
  SED_CMD="sed -i"
fi

# Replace catalog: references in devDependencies
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

# Check for changes
if git diff --quiet && git diff --cached --quiet; then
  echo ""
  echo -e "${GREEN}✅ No changes to sync - repositories are in sync${NC}"
  # Clean up backup branch if no changes
  git branch -D "${BACKUP_BRANCH}" 2>/dev/null || true
  exit 0
fi

echo ""
echo -e "${BLUE}📝 Changes detected. Review diff:${NC}"
git status --short

echo ""
read -p "Create commit with these changes? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted. Changes staged but not committed."
  echo "Restore from backup: git checkout ${BACKUP_BRANCH} -- ."
  exit 0
fi

# Create commit
COMMIT_MSG="chore: sync from monorepo packages/ui

Synced changes from SCF-Scaffald monorepo:
- Source code updates
- Configuration changes
- Documentation updates

Backup branch: ${BACKUP_BRANCH}
REQ-311: UI Package Separation"

git add .
git commit -m "${COMMIT_MSG}"

echo ""
echo -e "${GREEN}✅ Changes committed${NC}"

# Ask about pushing
echo ""
read -p "Push to remote? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  git push
  echo -e "${GREEN}✅ Changes pushed to remote${NC}"
else
  echo "Changes committed locally. Push manually when ready."
fi

echo ""
echo -e "${GREEN}✨ Sync complete!${NC}"
echo ""
echo "Backup branch: ${BACKUP_BRANCH}"
echo "To restore if needed: git checkout ${BACKUP_BRANCH} -- ."
