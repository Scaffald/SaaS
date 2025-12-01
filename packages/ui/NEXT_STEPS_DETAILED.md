# REQ-311: Next Steps - Detailed Guide

## Current Status

✅ **All automated work complete:**
- All dependencies have explicit versions (ready for standalone)
- devDependencies use catalog: (will be replaced when creating standalone repo)
- All configuration files ready (TypeScript, build, tests, CI/CD)
- Documentation and scripts ready

## Remaining Manual Steps

### Step 1: Create Standalone Repository

**Option A: Use Automated Script (Recommended)**

```bash
cd /Users/clay/Development/SCF-Scaffald
./packages/ui/scripts/setup-standalone-repo.sh
```

This script will:
1. Create GitHub repository `Unicorn/unicornlove-ui`
2. Clone it locally
3. Copy all files from `packages/ui`
4. **Automatically replace catalog: in devDependencies**
5. Create initial commit
6. Push to GitHub
7. Verify setup (install, build, test, type check)

**Option B: Manual Creation**

1. Create repository on GitHub: https://github.com/organizations/Unicorn/repositories/new
   - Name: `unicornlove-ui`
   - Description: "Comprehensive UI component library for Tamagui and Expo"
   - Public repository
   - Do NOT initialize with README/license

2. Clone and copy files:
   ```bash
   cd /Users/clay/Development
   git clone git@github.com:Unicorn/unicornlove-ui.git
   cd unicornlove-ui
   
   # Copy files
   rsync -av --exclude='node_modules' --exclude='dist' --exclude='.turbo' --exclude='.git' \
     ../SCF-Scaffald/packages/ui/ .
   
   # Copy hidden files
   cp -r ../SCF-Scaffald/packages/ui/.storybook .
   cp -r ../SCF-Scaffald/packages/ui/.github .
   cp ../SCF-Scaffald/packages/ui/.releaserc.json .
   cp ../SCF-Scaffald/packages/ui/.gitignore .
   
   # Replace catalog: in devDependencies
   ../SCF-Scaffald/packages/ui/scripts/fix-dev-dependencies.sh
   
   # Initial commit
   git add .
   git commit -m "chore: initial commit - migrate from monorepo"
   git push -u origin main
   ```

3. Verify setup:
   ```bash
   pnpm install
   pnpm build
   pnpm test:unit
   pnpm check:type
   ```

### Step 2: Configure GitHub Secrets

```bash
# Generate NPM token at: https://www.npmjs.com/settings/unicornlove/tokens
# Token type: Automation
# Scopes: read:packages, write:packages

# Set secret
gh secret set NPM_TOKEN --repo Unicorn/unicornlove-ui
```

### Step 3: Configure Branch Protection (Optional)

```bash
cd /Users/clay/Development/SCF-Scaffald
./packages/ui/scripts/setup-branch-protection.sh
```

Or manually:
1. Go to repository Settings > Branches
2. Add rule for `main`:
   - Require pull request reviews (1 approval)
   - Require status checks: `test`, `lint`
   - Require branches to be up to date

### Step 4: Publish Alpha Version

```bash
cd /Users/clay/Development/unicornlove-ui

# Build and test first
pnpm build
pnpm test:unit

# Dry run to verify
pnpm release:dry-run

# Publish alpha
npm publish --tag alpha --access public
```

Or use the script:
```bash
cd /Users/clay/Development/SCF-Scaffald
./packages/ui/scripts/publish-alpha.sh
```

### Step 5: Test Installation

```bash
# In a test project
pnpm add @unicornlove/ui@alpha

# Or specific version
pnpm add @unicornlove/ui@1.0.0
```

### Step 6: Migrate SCF-Scaffald

After verifying the published package works:

```bash
cd /Users/clay/Development/SCF-Scaffald

# Use migration script
./packages/ui/scripts/migrate-scaffald.sh 1.0.0

# Or manually:
# 1. Update packages/core/package.json:
#    "@unicornlove/ui": "^1.0.0"

# 2. Update pnpm-workspace.yaml:
#    Remove: - packages/ui

# 3. Install and test
pnpm install
pnpm build
pnpm test:all
pnpm dev  # Test dev server

# 4. If everything works, remove packages/ui (after verification period)
git rm -r packages/ui
git commit -m "chore: remove packages/ui - migrated to published package"
```

### Step 7: Update BrainGrid

As each step completes, update BrainGrid task statuses:
- Task 1: Mark COMPLETED after repository created
- Task 10: Mark COMPLETED after alpha published
- Task 12: Mark COMPLETED after SCF-Scaffald migration verified
- REQ-311: Mark COMPLETED after all tasks done

## Notes

- **devDependencies:** The setup script automatically replaces `catalog:` references with explicit versions when creating the standalone repo
- **Verification Period:** Keep `packages/ui` in monorepo for 1-2 weeks after migration to ensure stability
- **Rollback:** If issues arise, you can revert to workspace dependency by restoring `packages/ui` from git history

## Quick Checklist

- [ ] Create standalone GitHub repository
- [ ] Copy files and replace devDependencies catalog: references
- [ ] Verify repository builds and tests pass
- [ ] Configure NPM_TOKEN secret
- [ ] Configure branch protection (optional)
- [ ] Publish alpha version to npm
- [ ] Test installation in separate project
- [ ] Migrate SCF-Scaffald to use published package
- [ ] Test SCF-Scaffald thoroughly
- [ ] Remove packages/ui from monorepo (after verification)
- [ ] Update BrainGrid tasks
- [ ] Mark REQ-311 as COMPLETED

