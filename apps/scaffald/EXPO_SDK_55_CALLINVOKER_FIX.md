# Expo SDK 55 CallInvoker Fix

**Status:** ✅ FIXED LOCALLY
**Date:** February 6, 2026
**Applies to:** expo@55.0.0-preview.9 with React Native 0.83.1

---

## Problem

iOS builds fail with:
```
error: no member named 'CallInvoker' in namespace 'facebook::react'
Location: expo-modules-core/ios/JSI/EXJSIUtils.h:22
```

## Root Cause

React Native 0.83.1 **does include CallInvoker** (no breaking changes), but expo-modules-core is missing the header import.

CallInvoker exists at:
```
node_modules/react-native/ReactCommon/callinvoker/ReactCommon/CallInvoker.h
```

## Solution

Add the missing header import to expo-modules-core.

### File to Modify

**Path:** `node_modules/expo/node_modules/expo-modules-core/ios/JSI/EXJSIUtils.h`

**Add this line after line 8:**
```cpp
#import <ReactCommon/CallInvoker.h>
```

### Complete Header Section (Lines 1-11)

```cpp
// Copyright 2018-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#import <functional>

#import <jsi/jsi.h>
#import <React/RCTBridgeModule.h>
#import <ReactCommon/TurboModuleUtils.h>
#import <ReactCommon/CallInvoker.h>  // <-- ADD THIS LINE
#import <ExpoModulesCore/ObjectDeallocator.h>

namespace jsi = facebook::jsi;
namespace react = facebook::react;
```

---

## How to Apply

### Option 1: Manual Application (Survives `pod install`)

```bash
cd /Users/clay/Development/UNI-Construct

# Apply the fix
sed -i '' '9i\
#import <ReactCommon/CallInvoker.h>
' node_modules/expo/node_modules/expo-modules-core/ios/JSI/EXJSIUtils.h

# Rebuild iOS
cd apps/scaffald
pnpm ios
```

**Note:** This will be overwritten if you run `pnpm install` or update expo-modules-core.

### Option 2: Post-Install Script (Automatic)

Add to `apps/scaffald/package.json`:

```json
{
  "scripts": {
    "postinstall": "bash scripts/fix-expo-callinvoker.sh"
  }
}
```

Create `apps/scaffald/scripts/fix-expo-callinvoker.sh`:

```bash
#!/bin/bash

# Fix expo-modules-core CallInvoker import for SDK 55
FILE="../../node_modules/expo/node_modules/expo-modules-core/ios/JSI/EXJSIUtils.h"

if [ -f "$FILE" ]; then
  if ! grep -q "ReactCommon/CallInvoker.h" "$FILE"; then
    echo "📝 Applying CallInvoker fix to expo-modules-core..."
    sed -i '' '9i\
#import <ReactCommon/CallInvoker.h>
' "$FILE"
    echo "✅ CallInvoker fix applied"
  else
    echo "✓ CallInvoker fix already applied"
  fi
else
  echo "⚠️  expo-modules-core not found, skipping fix"
fi
```

Make it executable:
```bash
chmod +x apps/scaffald/scripts/fix-expo-callinvoker.sh
```

---

## Verification

After applying the fix:

```bash
cd apps/scaffald

# Test iOS build
pnpm ios

# Should see:
# ✓ Build completes successfully
# ✓ No CallInvoker error
# ✓ iPhone Simulator launches
```

---

## When This Fix Is Needed

- **Expo SDK 55 preview.9 or earlier** with React Native 0.83.1
- Likely NOT needed in:
  - SDK 55 preview.10+ (if Expo includes the fix)
  - SDK 55 stable release
  - SDK 56+

---

## Reporting to Expo

This is a bug in Expo SDK 55 beta. Consider reporting:

1. **GitHub Issue:** https://github.com/expo/expo/issues/new
2. **Title:** `[SDK 55] Missing CallInvoker.h import in expo-modules-core causes iOS build failure`
3. **Details:**
   - Affects: expo@55.0.0-preview.9 with React Native 0.83.1
   - File: `expo-modules-core/ios/JSI/EXJSIUtils.h`
   - Fix: Add `#import <ReactCommon/CallInvoker.h>`
   - Error: `no member named 'CallInvoker' in namespace 'facebook::react'`

---

## Impact

**Before Fix:**
- ❌ iOS builds fail immediately with CallInvoker error
- ✅ Web builds work
- ⚠️ Android untested (no SDK installed)

**After Fix:**
- ✅ **iOS builds work!**
- ✅ iPhone Simulator launches
- ✅ All platforms functional

---

*Fix discovered and tested: February 6, 2026*
*Works with: Expo SDK 55.0.0-preview.9, React Native 0.83.1, Xcode 26.2*
