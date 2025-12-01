# Local Development Setup for @unicornlove/ui

## Hybrid Approach: Monorepo Development + Published Package

The UI package is maintained in both locations:
- **Development**: `packages/ui/` in SCF-Scaffald monorepo
- **Published**: `@unicornlove/ui` npm package from `/Users/clay/Development/_packages/unicornlove-ui`

## Local Development Options

### Option 1: Use File Reference (Recommended for Active Development)

Update `packages/core/package.json` to use a file reference:

```json
{
  "dependencies": {
    "@unicornlove/ui": "file:../../_packages/unicornlove-ui"
  }
}
```

**Pros:**
- Fast iteration - changes reflect immediately
- Works seamlessly with pnpm workspaces
- No linking/unlinking needed

**Cons:**
- Requires running `pnpm install` after changes
- File path is absolute/relative to monorepo

### Option 2: Use Published Package (Recommended for Production Testing)

Use the published npm package:

```json
{
  "dependencies": {
    "@unicornlove/ui": "^1.0.1"
  }
}
```

**Pros:**
- Tests the actual published package
- Simulates production environment
- No local dependencies

**Cons:**
- Requires publishing new versions for each change
- Slower iteration cycle

### Option 3: pnpm link (For Testing Published Package Locally)

```bash
# In standalone repo
cd /Users/clay/Development/_packages/unicornlove-ui
pnpm link --global

# In monorepo
cd /Users/clay/Development/SCF-Scaffald
pnpm link --global @unicornlove/ui
```

**Pros:**
- Tests built package
- No need to publish for testing

**Cons:**
- Requires building after each change
- Can have symlink issues with workspaces

## Recommended Workflow

1. **Development**: Use file reference (Option 1)
   - Make changes in `packages/ui/`
   - Sync to standalone repo when ready
   - Test with file reference

2. **Pre-Publish Testing**: Use pnpm link (Option 3)
   - Sync changes to standalone repo
   - Build and link
   - Test in monorepo

3. **Production**: Use published package (Option 2)
   - After publishing, update to npm version
   - Test thoroughly before deploying

## Sync Workflow

When you make changes in the monorepo and want to test/publish:

```bash
# Sync from monorepo to standalone repo
cd /Users/clay/Development/SCF-Scaffald
./packages/ui/scripts/sync-to-standalone.sh

# Or use the full sync-and-publish script
./packages/ui/scripts/sync-and-publish.sh
```

## Current Setup

- **Published Version**: 1.0.1
- **Standalone Repo**: `/Users/clay/Development/_packages/unicornlove-ui`
- **Monorepo Location**: `packages/ui/`

