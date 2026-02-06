#!/bin/bash

# Fix expo-modules-core CallInvoker import for Expo SDK 55
# This is a temporary workaround until Expo SDK 55 stable includes the fix

FILE="../../node_modules/expo/node_modules/expo-modules-core/ios/JSI/EXJSIUtils.h"

if [ -f "$FILE" ]; then
  if ! grep -q "ReactCommon/CallInvoker.h" "$FILE"; then
    echo "📝 Applying CallInvoker fix to expo-modules-core..."
    sed -i '' '9i\
#import <ReactCommon/CallInvoker.h>
' "$FILE"
    echo "✅ CallInvoker fix applied successfully"
  else
    echo "✓ CallInvoker fix already applied"
  fi
else
  echo "⚠️  expo-modules-core not found at expected location"
  echo "   This is normal if expo hasn't been installed yet"
fi
