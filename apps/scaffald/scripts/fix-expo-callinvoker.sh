#!/bin/bash

# Fix expo-modules-core CallInvoker + CallbackWrapper imports for Expo SDK 55
# This is a temporary workaround until Expo SDK 55 stable includes the fix

HEADER="../../node_modules/expo/node_modules/expo-modules-core/ios/JSI/EXJSIUtils.h"
IMPL="../../node_modules/expo/node_modules/expo-modules-core/ios/JSI/EXJSIUtils.mm"

if [ -f "$HEADER" ]; then
  if ! grep -q "ReactCommon/CallInvoker.h" "$HEADER"; then
    echo "📝 Applying CallInvoker fix to EXJSIUtils.h..."
    sed -i '' '9i\
#import <ReactCommon/CallInvoker.h>
' "$HEADER"
    echo "✅ CallInvoker fix applied successfully"
  else
    echo "✓ CallInvoker fix already applied"
  fi
else
  echo "⚠️  expo-modules-core not found at expected location"
  echo "   This is normal if expo hasn't been installed yet"
fi

if [ -f "$IMPL" ]; then
  if ! grep -q "react/bridging/CallbackWrapper.h" "$IMPL"; then
    echo "📝 Applying CallbackWrapper fix to EXJSIUtils.mm..."
    sed -i '' 's|#import <ExpoModulesCore/EXJSIConversions.h>|#import <react/bridging/CallbackWrapper.h>\
\
#import <ExpoModulesCore/EXJSIConversions.h>|' "$IMPL"
    echo "✅ CallbackWrapper fix applied successfully"
  else
    echo "✓ CallbackWrapper fix already applied"
  fi
else
  echo "⚠️  EXJSIUtils.mm not found at expected location"
fi
