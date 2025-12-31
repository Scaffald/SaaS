# Development Warnings and Errors

This document explains common warnings and errors you may see during development and whether they need attention.

## Tamagui Warnings

### `[tamagui] skipped loading N module`

**Status**: Usually harmless, informational only

These warnings indicate that Tamagui couldn't statically analyze certain modules during the build process. This is common for:
- Dynamic imports
- Modules with complex conditional exports
- Third-party libraries that don't export components in a way Tamagui can analyze

**To see detailed information:**
```bash
TAMAGUI_SHOW_FULL_BUNDLE_ERRORS=1 pnpm dev
```

**Action**: Usually no action needed. If you see styling issues, enable detailed logging to identify the problematic modules.

## Expo Module Errors (Web Only)

### `An error occurred while requiring the 'ExpoModulesCoreJSLogger' module`
### `No native ExponentConstants module found`
### `The global process.env.EXPO_OS is not defined`

**Status**: Expected on web, harmless

These errors occur because:
- Native Expo modules don't exist in the browser environment
- The app is running on web where these native modules aren't available
- Expo packages gracefully handle missing native modules on web

**Action**: No action needed. These are expected when running on web and don't affect functionality. The app uses web-compatible alternatives automatically.

## Missing Token Warnings

### `missing token borderRadius in category radius - $full`

**Status**: Fixed in recent commits

This warning should no longer appear after the token configuration fix. If you still see it:
1. Rebuild the UI package: `pnpm --filter @unicornlove/ui build`
2. Clear Metro cache: `pnpm dev --clear`

## Reducing Log Noise

To reduce console noise during development:

```bash
# Suppress babel verbose logging (default)
# Only shows when BABEL_VERBOSE=true
pnpm dev

# Suppress Tamagui timing logs (default)
# Only shows when DEBUG=tamagui
pnpm dev

# See all Tamagui details
DEBUG=tamagui TAMAGUI_SHOW_FULL_BUNDLE_ERRORS=1 pnpm dev
```

