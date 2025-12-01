# Standalone Repository Setup Checklist

This checklist ensures all necessary files and configurations are in place for the standalone `@unicornlove/ui` repository.

## ✅ Pre-Migration Checklist

### Core Configuration Files
- [x] `package.json` - Standalone dependencies, no catalog: references
- [x] `tsconfig.json` - Standalone config, no extends from monorepo
- [x] `tsup.config.ts` - ESM-only output configuration
- [x] `vitest.config.ts` - Standalone test configuration
- [x] `vitest.setup.ts` - Test setup file
- [x] `.releaserc.json` - Semantic-release configuration
- [x] `.gitignore` - Repository-specific ignore patterns

### Documentation
- [x] `README.md` - Package documentation with installation and usage
- [x] `CHANGELOG.md` - Version history
- [x] `CONTRIBUTING.md` - Contribution guidelines
- [x] `LICENSE` - MIT license
- [x] `MIGRATION.md` - Migration guide for repository setup
- [x] `REPOSITORY_SETUP.md` - This file

### Source Code
- [x] `src/` - All component source code
- [x] `docs/` - Documentation files
- [x] `examples/` - Example applications

### Development Tools
- [x] `.storybook/` - Storybook configuration
- [x] `.github/workflows/` - CI/CD workflows (test, lint, security, publish)
- [x] `scripts/` - Helper scripts (migrate-scaffald.sh)

### Build & Test
- [x] Build configuration (tsup)
- [x] Test configuration (vitest)
- [x] Type checking (TypeScript)
- [x] Linting (Biome)

## 📋 Repository Creation Steps

1. **Create GitHub Repository**
   - Name: `unicornlove-ui`
   - Organization: `Unicorn`
   - Visibility: Public
   - Do NOT initialize with README/license

2. **Copy Files**
   ```bash
   # From SCF-Scaffald root
   cp -r packages/ui/* /path/to/unicornlove-ui/
   cp -r packages/ui/.storybook /path/to/unicornlove-ui/
   cp -r packages/ui/.github /path/to/unicornlove-ui/
   ```

3. **Initialize Git**
   ```bash
   cd /path/to/unicornlove-ui
   git init
   git add .
   git commit -m "chore: initial commit - migrate from monorepo"
   git branch -M main
   git remote add origin git@github.com:Unicorn/unicornlove-ui.git
   git push -u origin main
   ```

4. **Verify Setup**
   ```bash
   pnpm install
   pnpm build
   pnpm test:unit
   pnpm check:type
   ```

5. **Configure GitHub**
   - Add NPM_TOKEN secret (Settings > Secrets and variables > Actions)
   - Set up branch protection for main branch
   - Require status checks: test, lint

6. **Publish Alpha Version**
   ```bash
   pnpm release:dry-run  # Test first
   npm publish --tag alpha --access public
   ```

## 🔍 Verification Checklist

After repository creation, verify:

- [ ] Repository is accessible at https://github.com/Unicorn/unicornlove-ui
- [ ] All files are present and committed
- [ ] `pnpm install` completes without errors
- [ ] `pnpm build` generates dist/ folder with ESM files
- [ ] `pnpm test:unit` runs all tests successfully
- [ ] `pnpm check:type` passes TypeScript checks
- [ ] GitHub Actions workflows are configured
- [ ] NPM_TOKEN secret is set in repository
- [ ] Package can be installed: `pnpm add @unicornlove/ui@alpha`
- [ ] Storybook runs: `pnpm storybook`

## 🚀 Post-Migration

Once the standalone repository is working:

1. Update SCF-Scaffald to use published package
2. Test linking workflow for local development
3. Remove packages/ui from monorepo (after verification period)
4. Update documentation and announce release

