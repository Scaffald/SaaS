# Expo SDK 55 Beta - Critical Issues Found

**Date:** February 6, 2026  
**Tested Version:** expo@55.0.0-preview.9  
**React Native:** 0.83.1  
**Status:** 🚨 **MULTIPLE BLOCKERS FOUND**

## Executive Summary

While the Expo SDK 55 beta upgrade **completed successfully** for dependencies and configuration, **iOS builds encounter a critical blocker** during testing:

- ❌ **iOS Build:** FAILED (CallInvoker API compatibility issue)
- ❌ **Android Build:** NOT TESTED (SDK not installed on this machine)
- ✅ **Web Build:** WORKS (Metro bundler successful)

## 🔴 Critical Issues

### 1. iOS Build Failure (BLOCKER)

**Error:**
```
no member named 'CallInvoker' in namespace 'facebook::react'
Location: expo-modules-core/ios/JSI/EXJSIUtils.h:22
```

**Root Cause:**  
React Native 0.83.1 has refactored the JSI `CallInvoker` API, but expo-modules-core (bundled with preview.9) hasn't been updated to match the new API structure.

**Impact:** Cannot build iOS apps locally

**Workaround Options:**
1. ✅ **Wait for fix:** Expo will likely release preview.10+ with the fix
2. ⚠️ **Try EAS Build:** Cloud builds may have patches applied
3. ❌ **Manual patch:** Not recommended (would need to patch node_modules)

---

### 2. Web Build Status (✅ WORKS)

**Status:** Web builds are working correctly after retesting

**Details:**
- Metro bundler successfully compiles 10,420 modules
- Web app serves on http://localhost:8081
- Tamagui builds correctly in 2.9 seconds
- No module initialization errors

**Note:** Initial documentation was incorrect due to port conflict being misinterpreted as a module error

---

### 3. Android Build Not Tested

**Error:**
```
Failed to resolve the Android SDK path
Default install location not found: /Users/clay/Library/Android/sdk
```

**Root Cause:** Android SDK not installed/configured on this development machine

**Impact:** Cannot test Android builds locally

**Workaround:**  
- Install Android Studio and configure ANDROID_HOME
- OR test via EAS Build (recommended)

---

## ✅ What DID Work

1. **Dependency Upgrade:** All packages updated successfully
2. **iOS Pods Installation:** Completed (147 pods, including Mapbox)
3. **Mapbox Token Configuration:** Permanent solution implemented
4. **Metro Bundler:** Starts successfully
5. **Configuration Files:** All updated correctly
6. **Native Code Generation:** expo prebuild completed
7. **Catalog Synchronization:** pnpm workspace in sync

---

## 📊 Compatibility Matrix

| Component | Status | Notes |
|-----------|--------|-------|
| Dependencies | ✅ Installed | All SDK 55 versions |
| iOS Pods | ✅ Installed | 147 pods, 391s |
| iOS Build | ❌ Failed | CallInvoker error |
| Android Build | ⚠️ Untested | SDK not installed |
| Web Build | ✅ Works | 10,420 modules, 3.4s |
| Metro Bundler | ✅ Works | Tamagui builds correctly |
| TypeScript | ⚠️ Pre-existing errors | Not SDK 55 related |

---

## 🎯 Recommendations

### Option 1: Wait for Stable Release (RECOMMENDED)

**Timeline:** Likely weeks, not months  
**Pros:**  
- All issues will be resolved
- Official support and documentation
- Production-ready

**Cons:**  
- Must wait
- Can't use SDK 55 features yet

**Action:** Revert to SDK 54 and wait for SDK 55 stable release

---

### Option 2: Test with EAS Build

**Timeline:** Can try today  
**Pros:**  
- Cloud builds may have patches
- Can test iOS/Android without local setup
- Real device testing possible

**Cons:**  
- Build time ~20-30 min each
- May still fail with same errors
- Costs EAS build credits

**Action:** Try building with `pnpm eas:build:dev:ios` and `pnpm eas:build:dev:android`

---

### Option 3: Monitor for Updates

**Timeline:** Check daily/weekly  
**Pros:**  
- Can upgrade when fixed
- Keep current progress

**Cons:**  
- Uncertainty on timeline
- Stuck in limbo

**Action:** Watch for expo@55.0.0-preview.10+ releases

---

## 🔄 Rollback Instructions

To revert to SDK 54:

```bash
# Return to backup branch
git checkout backup/pre-sdk-55-upgrade

# Or revert commits
git checkout feat/upgrade-expo-sdk-55
git revert HEAD~3..HEAD  # Revert last 3 commits

# Restore dependencies
pnpm install --frozen-lockfile

# Rebuild native
cd apps/scaffald
rm -rf ios android
pnpm prebuild
cd ios && pod install
```

---

## 📝 Conclusion

**Expo SDK 55 beta preview.9 is NOT production-ready for iOS.** The CallInvoker API incompatibility prevents iOS builds from completing. However, web builds work successfully.

**Recommended Action:** Either:
1. **Revert to SDK 54** and wait for SDK 55 stable release (safest)
2. **Wait for preview.10+** with CallInvoker fix (risky)
3. **Try EAS Build** to see if cloud builds work (experimental)

The upgrade work completed (dependencies, configuration, Mapbox token) will be valuable when SDK 55 stable is released.

---

*Generated: February 6, 2026*  
*Tested on: macOS with Xcode 26.2*
