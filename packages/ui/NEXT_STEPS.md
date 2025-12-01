# Next Steps for REQ-311 Completion

## ✅ Current Status

All automated work is complete:
- ✅ Package configured for standalone use
- ✅ All 106 tests passing (14 test files)
- ✅ Build working (ESM-only output)
- ✅ Type checking passing (Storybook files excluded)
- ✅ CI/CD workflows ready
- ✅ Documentation complete

## 📋 Remaining Manual Tasks

### Task 9: Create Standalone Repository

**Action Required:**
1. Go to https://github.com/organizations/Unicorn/repositories/new
2. Create repository: `unicornlove-ui`
3. Description: "Comprehensive UI component library for Tamagui and Expo"
4. Visibility: Public
5. Do NOT initialize with README/license

**After Repository Creation:**
```bash
# Clone the new repository
cd /path/to/workspace
git clone git@github.com:Unicorn/unicornlove-ui.git
cd unicornlove-ui

# Copy all files from monorepo
cp -r /Users/clay/Development/SCF-Scaffald/packages/ui/* .
cp -r /Users/clay/Development/SCF-Scaffald/packages/ui/.storybook .
cp -r /Users/clay/Development/SCF-Scaffald/packages/ui/.github .
cp /Users/clay/Development/SCF-Scaffald/packages/ui/.releaserc.json .

# Remove monorepo-specific files
rm -rf dist node_modules .turbo

# Initialize and push
git add .
git commit -m "chore: initial commit - migrate from monorepo"
git branch -M main
git push -u origin main
```

**Verify Setup:**
```bash
cd unicornlove-ui
pnpm install
pnpm build
pnpm test:unit
pnpm check:type
```

### Task 10: Configure GitHub and Publish Alpha

**Set Up GitHub Secrets:**
1. Go to repository Settings > Secrets and variables > Actions
2. Add `NPM_TOKEN`:
   - Generate at: https://www.npmjs.com/settings/unicornlove/tokens
   - Type: Automation
   - Scopes: `read:packages`, `write:packages`

**Configure Branch Protection:**
1. Settings > Branches
2. Add rule for `main`:
   - Require pull request reviews
   - Require status checks: `test`, `lint`
   - Require branches to be up to date

**Publish Alpha Version:**
```bash
cd unicornlove-ui

# Test release process
pnpm release:dry-run

# If dry run looks good, manually publish alpha
npm publish --tag alpha --access public
```

**Verify Installation:**
```bash
# In a test project
pnpm add @unicornlove/ui@alpha

# Test imports
import { Button, Card } from '@unicornlove/ui'
```

### Task 11: Local Development Linking (Already Documented)

The linking workflow is already documented in `README.md`. See "Local Development" section.

### Task 12: Migrate SCF-Scaffald

**After package is published:**

```bash
cd /Users/clay/Development/SCF-Scaffald

# Use the migration script
./packages/ui/scripts/migrate-scaffald.sh <version>

# Or manually:
# 1. Update packages/core/package.json:
#    "@unicornlove/ui": "^1.0.0"  # or latest version

# 2. Update pnpm-workspace.yaml:
#    Remove: - packages/ui

# 3. Install and test
pnpm install
pnpm build
pnpm test:all

# 4. If everything works, remove packages/ui
git rm -r packages/ui
git commit -m "chore: migrate to published @unicornlove/ui package"
```

## 📊 Progress Summary

- **Completed:** 9/12 tasks (75%)
- **Manual Steps Remaining:** 3/12 tasks (25%)
- **Code Status:** All committed and ready
- **Test Status:** 100% passing (106/106 tests)

## 🎯 Quick Start Checklist

- [ ] Create GitHub repository `Unicorn/unicornlove-ui`
- [ ] Copy files from `packages/ui` to new repository
- [ ] Push initial commit
- [ ] Set up GitHub secrets (NPM_TOKEN)
- [ ] Configure branch protection
- [ ] Publish alpha version to npm
- [ ] Test installation in separate project
- [ ] Migrate SCF-Scaffald to use published package
- [ ] Remove `packages/ui` from monorepo

## 📝 Notes

- All code is ready and committed to the monorepo
- Storybook type errors are expected until dependencies are installed in standalone repo
- The package builds and tests successfully
- All documentation is in place

**Ready to create the standalone repository!**

