# Expo SDK 55 Monitoring Plan

**Created:** February 6, 2026
**Current Version Tested:** expo@55.0.0-preview.9
**Status:** Blocked by iOS CallInvoker error

---

## Current Situation

The Expo SDK 55 beta upgrade is **technically complete** but blocked by a critical iOS build error:

```
error: no member named 'CallInvoker' in namespace 'facebook::react'
Location: expo-modules-core/ios/JSI/EXJSIUtils.h:22
```

**Root Cause:** React Native 0.83.1 refactored the JSI CallInvoker API, but expo-modules-core in preview.9 hasn't been updated to match the new structure.

---

## What's Complete ✅

1. **All Dependencies Updated**
   - expo: 55.0.0-preview.9
   - react-native: 0.83.1
   - All expo-* packages updated to SDK 55 versions
   - react-native-worklets: 0.7.2 installed

2. **Configuration Updated**
   - pnpm-workspace.yaml catalog synchronized
   - eas.json fixed (removed invalid fields)
   - app.config.ts updated (owner and projectId)
   - Native directories regenerated with expo prebuild

3. **Permanent Solutions Implemented**
   - Mapbox token environment variable configuration
   - .env.local and .env.example files created
   - UI package peer dependencies updated

4. **Testing Completed**
   - ✅ Web build: WORKS (10,420 modules, 3.4s)
   - ✅ Metro bundler: WORKS with Tamagui
   - ❌ iOS build: BLOCKED by CallInvoker error
   - ⚠️ Android build: Untested (no SDK installed)

5. **Documentation**
   - EXPO_SDK_55_CRITICAL_ISSUES.md - Detailed error analysis
   - EXPO_SDK_55_UPGRADE_STATUS.md - Progress tracking
   - This monitoring plan

---

## Monitoring Schedule

### Weekly Checks (Every Monday)

Check for new preview releases:

```bash
npm view expo versions --json | jq '.[] | select(startswith("55.0.0"))' | tail -5
```

Look for:
- `55.0.0-preview.10` or higher
- `55.0.0-rc.0` (release candidate)
- `55.0.0` (stable release)

### Where to Monitor

1. **NPM Registry** (most reliable):
   - https://www.npmjs.com/package/expo?activeTab=versions

2. **Expo Blog** (official announcements):
   - https://expo.dev/changelog

3. **Expo GitHub Releases**:
   - https://github.com/expo/expo/releases

4. **Expo Discord** (community discussions):
   - #sdk-55-beta channel

---

## When to Retry the Upgrade

### Immediate Retry Triggers

Retry immediately if you see:

1. **Preview.10+ Released**
   - Check changelog for "CallInvoker", "JSI", or "React Native 0.83" mentions
   - Run: `npm view expo@55.0.0-preview.10 --json | jq '.dependencies["react-native"]'`

2. **Release Candidate Published**
   - RC versions are typically production-ready
   - Retry upgrade immediately

3. **Stable Release (55.0.0)**
   - All beta issues should be resolved
   - Full upgrade recommended

### How to Retry

From your current branch:

```bash
cd /Users/clay/Development/UNI-Construct/apps/scaffald

# Update to newer preview
npx expo install expo@next --fix

# Update catalog
# (manually edit pnpm-workspace.yaml with new versions)

# Sync dependencies
cd ../.. && pnpm install

# Clean rebuild
cd apps/scaffald
rm -rf ios/build ios/Pods ios/Podfile.lock
cd ios && pod install --repo-update && cd ..

# Test iOS build
pnpm ios
```

---

## Alternative Options

### Option 1: File an Issue with Expo

If you want the issue prioritized:

1. **Search existing issues**: https://github.com/expo/expo/issues
2. **If not found, create new issue** with:
   - Title: `[SDK 55] iOS build fails with CallInvoker error in expo-modules-core`
   - Include the error from EXPO_SDK_55_CRITICAL_ISSUES.md
   - Mention: React Native 0.83.1, expo-modules-core, preview.9
   - Add label: `SDK 55`

### Option 2: Revert and Wait

If you need iOS development immediately:

```bash
cd /Users/clay/Development/UNI-Construct

# Switch back to main (SDK 54)
git checkout main

# Or use backup branch
git checkout backup/pre-sdk-55-upgrade

# Reinstall dependencies
pnpm install --frozen-lockfile

# Rebuild native
cd apps/scaffald
rm -rf ios android
pnpm prebuild:clean
cd ios && pod install
```

Your upgrade work is preserved on `feat/upgrade-expo-sdk-55` branch.

### Option 3: Try EAS Cloud Builds

Cloud builds may have patches:

1. **Set up new EAS project** (requires interactive session)
2. **Run development builds**:
   ```bash
   eas build --profile development --platform ios
   eas build --profile development --platform android
   ```
3. **If successful**, continue development with cloud builds while waiting for local fix

---

## Decision Matrix

| Scenario | Recommendation | Timeline |
|----------|---------------|----------|
| Preview.10+ with fix released | Upgrade immediately | Same day |
| RC or stable released | Upgrade immediately | Same day |
| Need iOS dev now | Revert to SDK 54 | Today |
| Can wait 1-2 weeks | Monitor weekly | Check Mondays |
| Need to ship soon | Stay on SDK 54 | Wait for stable |
| Web-only development | Continue on SDK 55 | Now |

---

## Expected Timeline

Based on previous SDK releases:

- **Preview to RC**: Typically 2-4 weeks
- **RC to Stable**: Typically 1-2 weeks
- **Total Beta Period**: Usually 6-8 weeks

SDK 55 preview.0 was released January 21, 2026.
SDK 55 preview.9 was released February 3, 2026.

**Estimated stable release**: Late February to Early March 2026

---

## Contact Points

If issues arise:

- **Expo Forums**: https://forums.expo.dev/
- **Expo Discord**: https://chat.expo.dev/
- **GitHub Issues**: https://github.com/expo/expo/issues
- **Twitter/X**: @expo

---

## Preserved Work

All upgrade work is committed to: `feat/upgrade-expo-sdk-55`

Commits:
- Configuration fixes (eas.json, app.config.ts)
- Documentation updates
- Mapbox permanent solution
- All dependency updates

When SDK 55 is stable, merge this branch to complete the upgrade.

---

*Last Updated: February 6, 2026*
*Next Check: February 10, 2026 (Monday)*
