# Developer Setup Guide for @unicornlove/ui

This guide helps new developers set up the UI package for local development without hardcoded paths.

## Quick Start

The package is published to npm and can be used immediately:

```bash
# Install dependencies (will use published package)
pnpm install
```

## Local Development Setup

For active development on the UI package, you have three options:

### Option 1: pnpm link (Recommended - Most Portable)

This is the most portable approach and works across different directory structures.

**Setup:**

1. **Clone the standalone repository** (if you need to publish or sync):
   ```bash
   # Default location (recommended)
   git clone git@github.com:Unicorn/unicornlove-ui.git ../_packages/unicornlove-ui
   
   # Or custom location
   export UNICORNLOVE_UI_DIR=/path/to/your/unicornlove-ui
   git clone git@github.com:Unicorn/unicornlove-ui.git "${UNICORNLOVE_UI_DIR}"
   ```

2. **Set up the link**:
   ```bash
   ./packages/ui/scripts/setup-local-dev.sh link
   pnpm install
   ```

**Pros:**
- ✅ No hardcoded paths
- ✅ Works on any developer machine
- ✅ Changes reflect immediately after building standalone repo
- ✅ Most portable solution

**Cons:**
- Requires building standalone repo after changes
- Requires syncing changes from monorepo to standalone repo first

### Option 2: Workspace (file:) Reference (Fastest Iteration)

For the fastest development iteration cycle.

**Setup:**

1. **Clone the standalone repository**:
   ```bash
   git clone git@github.com:Unicorn/unicornlove-ui.git ../_packages/unicornlove-ui
   ```

2. **Set up workspace reference**:
   ```bash
   ./packages/ui/scripts/setup-local-dev.sh workspace
   pnpm install
   ```

**Pros:**
- ✅ Fastest iteration cycle
- ✅ Changes reflect immediately
- ✅ No build step needed

**Cons:**
- Uses relative file paths (may need adjustment based on directory structure)
- Less portable than link mode

### Option 3: npm Package (Production Testing)

Use the published npm package for testing production builds.

**Setup:**

```bash
./packages/ui/scripts/setup-local-dev.sh npm
pnpm install
```

**Pros:**
- ✅ Tests actual published package
- ✅ Simulates production environment
- ✅ No local setup needed

**Cons:**
- ❌ Requires publishing new versions for each change
- ❌ Slower iteration cycle

## Environment Variables

### `UNICORNLOVE_UI_DIR`

Override the default location of the standalone repository:

```bash
export UNICORNLOVE_UI_DIR=/custom/path/to/unicornlove-ui
./packages/ui/scripts/setup-local-dev.sh link
```

**Default locations tried:**
1. `../_packages/unicornlove-ui` (relative to monorepo root)
2. `../unicornlove-ui` (relative to monorepo root)
3. Falls back to `../_packages/unicornlove-ui` if neither exists

## Development Workflow

### Making Changes

1. **Edit files in monorepo**: Work in `packages/ui/` (source of truth)
2. **Sync to standalone repo** (if using link or workspace mode):
   ```bash
   ./packages/ui/scripts/sync-to-standalone.sh
   ```
3. **Build standalone repo** (if using link mode):
   ```bash
   cd "${UNICORNLOVE_UI_DIR:-../_packages/unicornlove-ui}" && pnpm build
   ```
4. **Test changes** in the monorepo application

### Publishing New Versions

1. **Sync changes**:
   ```bash
   ./packages/ui/scripts/sync-to-standalone.sh
   ```

2. **In standalone repo**:
   ```bash
   cd "${UNICORNLOVE_UI_DIR:-../_packages/unicornlove-ui}"
   pnpm build
   pnpm test:unit
   npm version patch  # or minor, major
   npm publish
   ```

3. **Update monorepo** (optional, if switching to npm mode):
   ```bash
   ./packages/ui/scripts/setup-local-dev.sh npm
   pnpm install
   ```

## Scripts Reference

### `setup-local-dev.sh`

Switches between different development modes.

```bash
# Link mode (recommended)
./packages/ui/scripts/setup-local-dev.sh link

# Workspace mode (fastest)
./packages/ui/scripts/setup-local-dev.sh workspace

# npm mode (production testing)
./packages/ui/scripts/setup-local-dev.sh npm
```

### `sync-to-standalone.sh`

Syncs changes from monorepo to standalone repository.

```bash
./packages/ui/scripts/sync-to-standalone.sh
```

Uses `UNICORNLOVE_UI_DIR` environment variable if set, otherwise tries common locations.

## Troubleshooting

### "Standalone repo not found"

**Solution:** Clone the repository or set `UNICORNLOVE_UI_DIR`:
```bash
export UNICORNLOVE_UI_DIR=/path/to/unicornlove-ui
```

### "Package not found" after linking

**Solution:** Make sure you've built the standalone repo:
```bash
cd "${UNICORNLOVE_UI_DIR:-../_packages/unicornlove-ui}"
pnpm build
```

### Path issues with workspace mode

**Solution:** Use link mode instead (more portable):
```bash
./packages/ui/scripts/setup-local-dev.sh link
```

### Switching back to npm package

```bash
./packages/ui/scripts/setup-local-dev.sh npm
pnpm install
```

## Current Configuration

- **Default Mode**: npm package (published version)
- **Development Mode**: Use `setup-local-dev.sh link` for local development
- **Standalone Repo**: Detected automatically or via `UNICORNLOVE_UI_DIR`

## Summary

- ✅ **No hardcoded paths** - Scripts discover paths dynamically
- ✅ **Portable** - Works across different developer machines
- ✅ **Flexible** - Multiple modes for different use cases
- ✅ **Easy setup** - Single command to configure

For most developers, the default npm package works fine. Use `link` mode when actively developing the UI package.

