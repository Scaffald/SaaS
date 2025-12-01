# AI Agents: Important Context for @unicornlove/ui

## ⚠️ CRITICAL: Hybrid Maintenance Architecture

This package uses a **hybrid maintenance approach** that AI agents MUST understand:

### Quick Facts

1. **Two Locations**: 
   - Monorepo: `packages/ui/` (development source of truth)
   - Standalone: `/Users/clay/Development/_packages/unicornlove-ui` or custom via `UNICORNLOVE_UI_DIR` (publishing)

2. **Consumption**: Monorepo uses `@unicornlove/ui@^1.0.1` from npm (published package)

3. **Workflow**: Develop in monorepo → Sync to standalone → Publish → Consume via npm

4. **NOT in workspace**: `packages/ui/` is not in `pnpm-workspace.yaml`

5. **All imports**: 253+ imports use `@unicornlove/ui` package name, NOT direct paths

### Before Making Changes

- ✅ Check if changes need publishing (use sync workflow)
- ✅ Verify current dev mode (npm/link/workspace)
- ✅ Edit in `packages/ui/src/` (monorepo location)
- ✅ Use sync script: `./packages/ui/scripts/sync-to-standalone.sh`
- ❌ Don't delete `packages/ui/` folder (it's the source of truth)
- ❌ Don't assume it's a workspace package
- ❌ Don't make changes directly in standalone repo without syncing from monorepo

### Development Modes

Three modes available via `./packages/ui/scripts/setup-local-dev.sh`:

1. **npm mode** (default): Uses published npm package
2. **link mode**: Links standalone repo for testing
3. **workspace mode**: Fast iteration with file reference

### Full Documentation

- `.cursor/rules/ui-package-hybrid.mdc` - Complete workflow and rules
- `DEVELOPER_SETUP.md` - Developer setup guide
- `README.md` - Package documentation

