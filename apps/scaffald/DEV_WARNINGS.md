# Development Warnings and Errors

This document explains common warnings and errors you may see during development and whether they need attention.

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
1. Rebuild the UI package: `pnpm --filter @unicornlove/beyond-ui build`
2. Clear Metro cache: `pnpm dev --clear`

## Reducing Log Noise

To reduce console noise during development:

```bash
# Suppress babel verbose logging (default)
# Only shows when BABEL_VERBOSE=true
pnpm dev
```

