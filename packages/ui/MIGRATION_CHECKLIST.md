# Migration Checklist for SCF-Scaffald

## Pre-Migration

- [x] Standalone repository created: `Unicorn/unicornlove-ui`
- [x] All tests passing (106/106)
- [x] Build working successfully
- [ ] Alpha version published to npm
- [ ] Installation tested in separate project

## Migration Steps

### 1. Publish Package to NPM

```bash
cd /Users/clay/Development/unicornlove-ui

# Login to npm (if not already)
npm login

# Publish alpha version
npm publish --tag alpha --access public
```

### 2. Update SCF-Scaffald Dependencies

```bash
cd /Users/clay/Development/SCF-Scaffald

# Use migration script
./packages/ui/scripts/migrate-scaffald.sh 1.0.0

# Or manually:
# 1. Update packages/core/package.json:
#    Change: "@unicornlove/ui": "workspace:*"
#    To:     "@unicornlove/ui": "^1.0.0"

# 2. Update pnpm-workspace.yaml:
#    Remove line: - packages/ui

# 3. Install dependencies
pnpm install
```

### 3. Verify Migration

```bash
# Build
pnpm build

# Run tests
pnpm test:all

# Start dev server
pnpm dev

# Check for any import errors
```

### 4. Clean Up (After Verification Period)

```bash
# Remove packages/ui directory
git rm -r packages/ui
git commit -m "chore: remove packages/ui - migrated to published package"
```

## Rollback Plan

If issues are found:

```bash
# Revert to workspace dependency
git checkout HEAD -- packages/core/package.json pnpm-workspace.yaml

# Add packages/ui back to workspace
echo "  - packages/ui" >> pnpm-workspace.yaml

# Reinstall
pnpm install
```

## Notes

- Keep `packages/ui` in monorepo for a verification period (1-2 weeks)
- Monitor for any issues with published package
- Update version in SCF-Scaffald as new versions are released

