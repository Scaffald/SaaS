#!/bin/bash
# Sync from monorepo to standalone repo, publish, and set up local dev linking
# This is a complete workflow script for maintaining the hybrid setup

set -e

SOURCE_DIR="/Users/clay/Development/SCF-Scaffald/packages/ui"
TARGET_DIR="/Users/clay/Development/_packages/unicornlove-ui"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Syncing, Publishing, and Setting Up Local Dev Workflow${NC}"
echo ""

# Step 1: Sync files
echo -e "${BLUE}📋 Step 1: Syncing files from monorepo to standalone repo...${NC}"

if [ ! -d "${SOURCE_DIR}" ]; then
  echo -e "${RED}❌ Source directory not found: ${SOURCE_DIR}${NC}"
  exit 1
fi

if [ ! -d "${TARGET_DIR}" ]; then
  echo -e "${RED}❌ Target directory not found: ${TARGET_DIR}${NC}"
  exit 1
fi

cd "${TARGET_DIR}"

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

# Create backup branch
BACKUP_BRANCH="backup-before-sync-$(date +%Y%m%d-%H%M%S)"
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
echo -e "${BLUE}📦 Creating backup branch: ${BACKUP_BRANCH}${NC}"
git branch "${BACKUP_BRANCH}" 2>/dev/null || true

# Sync files using rsync
echo -e "${BLUE}📥 Copying files...${NC}"
rsync -av --delete \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.turbo' \
  --exclude='.git' \
  --exclude='.DS_Store' \
  "${SOURCE_DIR}"/ .

# Copy hidden directories/files
for dir in .storybook .github; do
  if [ -d "${SOURCE_DIR}/${dir}" ]; then
    cp -r "${SOURCE_DIR}/${dir}" .
  fi
done

for file in .releaserc.json .gitignore; do
  if [ -f "${SOURCE_DIR}/${file}" ]; then
    cp "${SOURCE_DIR}/${file}" .
  fi
done

# Remove monorepo-specific files
rm -rf dist node_modules .turbo 2>/dev/null || true

# Replace catalog: references in devDependencies
echo ""
echo -e "${BLUE}🔧 Replacing catalog: references in devDependencies...${NC}"

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

# Step 2: Install dependencies and build
echo ""
echo -e "${BLUE}📦 Step 2: Installing dependencies and building...${NC}"
pnpm install
pnpm build

# Step 3: Test
echo ""
echo -e "${BLUE}🧪 Step 3: Running tests...${NC}"
pnpm test:unit

# Step 4: Commit changes
echo ""
echo -e "${BLUE}💾 Step 4: Committing changes...${NC}"

if git diff --quiet && git diff --cached --quiet; then
  echo -e "${GREEN}✅ No changes to commit - repositories are in sync${NC}"
else
  git add .
  
  COMMIT_MSG="chore: sync from monorepo packages/ui

Synced changes from SCF-Scaffald monorepo:
- Source code updates
- Configuration changes
- Documentation updates
- Scripts and workflows

Backup branch: ${BACKUP_BRANCH}
REQ-311: UI Package Separation"
  
  git commit -m "${COMMIT_MSG}"
  echo -e "${GREEN}✅ Changes committed${NC}"
fi

# Step 5: Publish to npm
echo ""
echo -e "${BLUE}📤 Step 5: Publishing to npm...${NC}"

read -p "Publish to npm? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  # Check if logged in
  if ! npm whoami &>/dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to npm. Please run: npm login${NC}"
    exit 1
  fi
  
  # Dry run first
  echo -e "${BLUE}🔍 Running dry run...${NC}"
  pnpm release:dry-run
  
  read -p "Dry run looks good? Publish? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Publish
    CURRENT_VERSION=$(node -p "require('./package.json').version")
    echo -e "${BLUE}🚀 Publishing version ${CURRENT_VERSION}...${NC}"
    npm publish --access public
    
    echo ""
    echo -e "${GREEN}✅ Published @unicornlove/ui@${CURRENT_VERSION}${NC}"
  else
    echo "Publishing skipped."
  fi
else
  echo "Publishing skipped."
fi

# Step 6: Push to GitHub
echo ""
echo -e "${BLUE}📤 Step 6: Pushing to GitHub...${NC}"

read -p "Push to GitHub? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  git push
  echo -e "${GREEN}✅ Pushed to GitHub${NC}"
else
  echo "Push skipped."
fi

# Step 7: Set up pnpm link for local development
echo ""
echo -e "${BLUE}🔗 Step 7: Setting up pnpm link for local development...${NC}"

read -p "Set up pnpm link? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  # Link the package globally
  echo -e "${BLUE}Linking package globally...${NC}"
  cd "${TARGET_DIR}"
  pnpm link --global
  
  # Link in monorepo
  echo -e "${BLUE}Linking in monorepo...${NC}"
  cd "${SOURCE_DIR}/../../.."
  pnpm link --global @unicornlove/ui
  
  echo ""
  echo -e "${GREEN}✅ pnpm link set up!${NC}"
  echo ""
  echo "Local development workflow:"
  echo "1. Make changes in: ${SOURCE_DIR}"
  echo "2. Sync changes: Run this script again"
  echo "3. Or use watch mode: cd ${TARGET_DIR} && pnpm build --watch"
else
  echo "pnpm link setup skipped."
fi

echo ""
echo -e "${GREEN}✨ All done!${NC}"
echo ""
echo "Summary:"
echo "- Files synced from monorepo to standalone repo"
echo "- Package built and tested"
echo "- Changes committed"
echo "- Backup branch: ${BACKUP_BRANCH}"

