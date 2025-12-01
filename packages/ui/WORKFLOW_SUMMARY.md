# Complete Development Workflow Summary

This document summarizes the complete hybrid development workflow for `@unicornlove/ui`.

## Overview

The `@unicornlove/ui` package uses a hybrid maintenance approach:
- **Development**: Happens in `packages/ui/` (monorepo)
- **Publishing**: Happens in standalone repository
- **Consumption**: Monorepo uses published npm package

## Complete Workflow

### 1. Making Changes

**Edit in monorepo:**
```bash
# All development happens here
packages/ui/src/components/...
```

### 2. Sync to Standalone Repository

**Sync changes:**
```bash
./packages/ui/scripts/sync-to-standalone.sh
```

This script:
- Copies files from monorepo to standalone repo
- Replaces `catalog:` references with explicit versions
- Preserves git history in standalone repo

### 3. Test Build and Publish

**Verify package is ready:**
```bash
./packages/ui/scripts/test-build-publish.sh
```

This script verifies:
- ✅ No `catalog:` references remain
- ✅ Package builds successfully
- ✅ Tests pass
- ✅ Type checking passes
- ✅ Lint and format checks pass
- ✅ Semantic-release dry run works

### 4. Publish

**Publish alpha version (for testing):**
```bash
./packages/ui/scripts/publish-alpha.sh
```

**Or publish via semantic-release (automated):**
- Push to `main` branch in standalone repo
- GitHub Actions workflow runs semantic-release
- Automatically publishes to npm

### 5. Consume in Monorepo

**Default (npm package):**
```bash
# Already configured - uses published package
pnpm install
```

**Local development (link mode):**
```bash
./packages/ui/scripts/setup-local-dev.sh link
pnpm install
```

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `sync-to-standalone.sh` | Sync changes from monorepo to standalone repo |
| `test-build-publish.sh` | Test complete build and publish workflow |
| `publish-alpha.sh` | Publish alpha version to npm |
| `setup-local-dev.sh` | Switch between npm/link/workspace modes |
| `sync-and-publish.sh` | Complete sync and publish workflow |

## Local Development Modes

### npm Mode (Default)
- Uses published npm package
- Best for: Production testing, stable development
- Command: `./packages/ui/scripts/setup-local-dev.sh npm`

### link Mode (Recommended)
- Links standalone repo via pnpm link
- Best for: Active UI development
- Command: `./packages/ui/scripts/setup-local-dev.sh link`
- Workflow: Edit in monorepo → Sync → Build standalone → Changes available

### workspace Mode (Fastest)
- Uses file: reference to standalone repo
- Best for: Fast iteration cycles
- Command: `./packages/ui/scripts/setup-local-dev.sh workspace`

## CI/CD Workflows

GitHub Actions workflows in `.github/workflows/`:

1. **test.yml** - Runs tests on PRs and pushes
2. **lint.yml** - Lint, format, and type checking
3. **security.yml** - Weekly security audits
4. **publish.yml** - Automated publishing via semantic-release

## Key Files

- `package.json` - Standalone configuration (no catalog: references)
- `tsconfig.json` - Standalone TypeScript config
- `tsup.config.ts` - Build configuration (ESM output)
- `vitest.config.ts` - Test configuration
- `.releaserc.json` - Semantic-release configuration
- `.storybook/` - Storybook configuration

## Documentation

- `DEVELOPER_SETUP.md` - Complete developer setup guide
- `PUBLISHING_GUIDE.md` - Publishing workflow
- `AI_AGENTS_README.md` - AI agent context
- `.cursor/rules/ui-package-hybrid.mdc` - Cursor rules

## Environment Variables

- `UNICORNLOVE_UI_DIR` - Override standalone repo location
  - Default: `../_packages/unicornlove-ui` (relative to monorepo root)

## Quick Reference

```bash
# Complete workflow
./packages/ui/scripts/sync-to-standalone.sh
./packages/ui/scripts/test-build-publish.sh
./packages/ui/scripts/publish-alpha.sh

# Local development
./packages/ui/scripts/setup-local-dev.sh link
cd ../_packages/unicornlove-ui && pnpm build
cd ../../SCF-Scaffald && pnpm install
```

## Status

✅ All infrastructure in place
✅ Scripts created and tested
✅ Documentation complete
✅ CI/CD workflows configured
✅ Ready for publishing

