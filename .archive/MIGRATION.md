# Migration Guide: Standalone Repository Setup

This guide documents the process for creating the standalone `@unicornlove/ui` repository and migrating from the monorepo.

## Prerequisites

- GitHub access to create repositories under the `Unicorn` organization
- npm account with access to publish `@unicornlove` scoped packages
- Local development environment with pnpm installed

## Step 1: Create GitHub Repository

1. Go to https://github.com/organizations/Unicorn/repositories/new
2. Repository name: `unicornlove-ui`
3. Description: "Comprehensive UI component library for Tamagui and Expo"
4. Visibility: Public (for open-source package)
5. Initialize with: **Do not** initialize with README, .gitignore, or license (we'll copy from monorepo)
6. Click "Create repository"

## Step 2: Prepare Repository Content

The `packages/ui` directory in this monorepo contains all the code needed for the standalone repository. The following files should be copied:

### Core Files (Required)
- `package.json` - Already configured with standalone dependencies
- `tsconfig.json` - Standalone TypeScript configuration
- `tsup.config.ts` - ESM-only build configuration
- `vitest.config.ts` - Standalone test configuration
- `vitest.setup.ts` - Test setup file
- `.releaserc.json` - Semantic-release configuration
- `README.md` - Package documentation
- `LICENSE` - MIT license
- `CHANGELOG.md` - Version history
- `CONTRIBUTING.md` - Contribution guidelines

### Source Code
- `src/` - All component source code
- `docs/` - Documentation files
- `examples/` - Example applications

### Configuration
- `.storybook/` - Storybook configuration
- `.github/workflows/` - CI/CD workflows

### Build Output (Do NOT copy)
- `dist/` - Will be generated during build
- `node_modules/` - Will be installed via pnpm

## Step 3: Initialize Standalone Repository

```bash
# Create new directory for standalone repo
cd /path/to/workspace
git clone git@github.com:Unicorn/unicornlove-ui.git
cd unicornlove-ui

# Copy all files from monorepo packages/ui
cp -r /path/to/SCF-Scaffald/packages/ui/* .
cp -r /path/to/SCF-Scaffald/packages/ui/.storybook .
cp -r /path/to/SCF-Scaffald/packages/ui/.github .
cp /path/to/SCF-Scaffald/packages/ui/.releaserc.json .

# Remove monorepo-specific files
rm -rf dist node_modules .turbo

# Initialize git (if not already initialized)
git init
git add .
git commit -m "chore: initial commit - migrate from monorepo"
git branch -M main
git remote add origin git@github.com:Unicorn/unicornlove-ui.git
git push -u origin main
```

## Step 4: Verify Standalone Build

```bash
cd unicornlove-ui
pnpm install
pnpm build
pnpm test:unit
pnpm check:type
```

All commands should pass without errors.

## Step 5: Set Up GitHub Secrets

In the GitHub repository settings, add the following secrets:

1. **NPM_TOKEN**: npm access token with publish permissions for `@unicornlove` scope
   - Generate at: https://www.npmjs.com/settings/unicornlove/tokens
   - Required scopes: `read:packages`, `write:packages`

2. **GITHUB_TOKEN**: Automatically provided by GitHub Actions (no action needed)

## Step 6: Configure Branch Protection

1. Go to repository Settings > Branches
2. Add rule for `main` branch:
   - Require pull request reviews
   - Require status checks to pass:
     - `test` workflow
     - `lint` workflow
   - Require branches to be up to date

## Step 7: Publish Alpha Version

```bash
cd unicornlove-ui

# Test the release process (dry run)
pnpm release:dry-run

# If dry run looks good, manually publish alpha
npm publish --tag alpha --access public
```

Or let semantic-release handle it on the first commit to main (after setting up secrets).

## Step 8: Test Package Installation

In a test project:

```bash
pnpm add @unicornlove/ui@alpha
```

Verify imports work:
```tsx
import { Button, Card } from '@unicornlove/ui'
```

## Step 9: Set Up Local Development Linking

See README.md "Local Development" section for linking workflow.

## Step 10: Migrate SCF-Scaffald

Once the package is published and tested:

1. Update `packages/core/package.json`:
   ```json
   "@unicornlove/ui": "^1.0.0"  // or latest version
   ```

2. Update `apps/expo/package.json` if it has direct dependency

3. Remove `packages/ui` from monorepo:
   ```bash
   git rm -r packages/ui
   ```

4. Update `pnpm-workspace.yaml`:
   ```yaml
   packages:
     - apps/*
     - packages/core
     # - packages/ui  # Remove this line
     - packages/supabase
     - packages/schemas
     - packages/trpc
   ```

5. Update any imports if needed (should be compatible)

6. Test the application:
   ```bash
   pnpm install
   pnpm build
   pnpm test:all
   ```

7. Commit changes:
   ```bash
   git commit -m "chore: migrate to published @unicornlove/ui package"
   ```

## Troubleshooting

### Build Errors
- Ensure all dependencies are installed: `pnpm install`
- Check TypeScript version compatibility
- Verify tsup configuration

### Test Failures
- Check vitest.setup.ts is properly configured
- Verify react-native-web mocks are working
- Check test environment (jsdom)

### Publishing Issues
- Verify NPM_TOKEN has correct permissions
- Check package.json name matches npm scope
- Ensure version follows semantic versioning

## Rollback Plan

If issues arise, you can temporarily revert:

1. In SCF-Scaffald, change back to workspace dependency:
   ```json
   "@unicornlove/ui": "workspace:*"
   ```

2. Restore `packages/ui` from git history if needed

3. Keep the standalone repo for future migration when ready

