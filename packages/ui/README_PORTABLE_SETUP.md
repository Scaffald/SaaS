# Portable Setup - Quick Reference

## ✅ What Changed

- **Removed all hardcoded paths** from scripts
- **Default to npm package** in `packages/core/package.json`
- **Dynamic path discovery** - scripts find paths automatically
- **Environment variable support** - `UNICORNLOVE_UI_DIR` for custom locations

## Quick Start

### Default (Just Works)
```bash
pnpm install  # Uses published npm package
```

### Local Development
```bash
# Most portable (recommended)
./packages/ui/scripts/setup-local-dev.sh link

# Fastest iteration
./packages/ui/scripts/setup-local-dev.sh workspace

# Production testing
./packages/ui/scripts/setup-local-dev.sh npm
```

## For New Developers

1. **Clone monorepo**: `git clone ...`
2. **Install dependencies**: `pnpm install`
3. **Done!** Uses published package by default

No need to clone standalone repo unless actively developing UI package.

## Custom Setup

```bash
export UNICORNLOVE_UI_DIR=/your/custom/path
./packages/ui/scripts/setup-local-dev.sh link
```

## Full Documentation

See `DEVELOPER_SETUP.md` for complete guide.

