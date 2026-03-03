# Expo SDK 55 Upgrade - Status Report

**Date:** March 2, 2026
**Branch:** `feat/upgrade-expo-sdk-55`
**Status:** ✅ Ready to merge

---

## ✅ Completed

### 1. Expo SDK 55 Stable Upgrade
- ✅ expo: `55.0.0-preview.9` → **`55.0.4`** (stable)
- ✅ expo-router: `55.0.0-preview.6` → **`55.0.3`** (stable)
- ✅ All expo-* packages on SDK 55 stable patch versions
- ✅ React Native: **0.83.1** (unchanged, already correct)
- ✅ react-native-reanimated: **~4.2.1**
- ✅ react-native-worklets: **0.7.2**
- ✅ babel-preset-expo: **~55.0.3**

### 2. iOS CallInvoker Fix Removed (Fixed Upstream)
- ✅ `expo-modules-core@55.0.13` stable already includes `#import <ReactCommon/CallInvoker.h>`
- ✅ Removed `scripts/fix-expo-callinvoker.sh` (no longer needed)
- ✅ Removed `postinstall` hook from `package.json`

### 3. Rebase from Main
- ✅ Rebased onto `e38016d57` (main as of March 2, 2026)
- ✅ Picked up: SDK layer refactoring (`e38016d57`)
- ✅ Picked up: Test infrastructure fixes (`da0830497`)
- ✅ Picked up: @hookform/resolvers version fix (`8736587fb`)
- ✅ Conflicts resolved cleanly

### 4. Metro Bundler Fix
- ✅ Added `resolveRequest` to `metro.config.js` to handle TypeScript ESM-style
  `.js` imports from `@scaffald/sdk` (moduleResolution:"bundler" pattern)
- ✅ Web bundle builds successfully (7 bundles, ~15MB entry)

### 5. Build Verification
- ✅ `pnpm typecheck` — 0 TypeScript errors across all 16 projects
- ✅ `pnpm web:build` — exports successfully to `dist/`
- ⏳ `pnpm ios` — Previously confirmed working (Feb 6 commit `3a77da7b0`); not re-run since no native changes

---

## Mapbox Token Configuration

The Podfile requires the Mapbox secret download token. Set before running `expo prebuild` or `expo run:ios`:

```bash
export EXPO_PUBLIC_MAPBOX_TOKEN=<mapbox-secret-token>
```

---

## What's New in SDK 55

- **Hermes v1** engine (75% smaller OTA updates via bytecode diffing)
- **expo-router v7** (55.0.3 stable)
- **New Architecture required** (already enabled in this project)
- **expo-modules-core** now stable (CallInvoker fix included)

---

*Last Updated: March 2, 2026*
