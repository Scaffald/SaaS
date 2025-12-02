# Sentry Setup Script Documentation

## Overview

The `setup-sentry.mjs` script automates Sentry configuration for iOS and Android after `expo prebuild`. This eliminates the need for manual configuration when the native build folders are regenerated.

## Features

✅ **Idempotent**: Can be run multiple times safely without duplicating configurations  
✅ **Automatic**: Integrated with `pnpm prebuild` and `pnpm prebuild:clean`  
✅ **Android Complete**: Fully configures Android Gradle integration  
✅ **iOS Partial**: Creates properties file, provides Xcode instructions  
✅ **Git Safe**: Automatically updates `.gitignore` with Sentry files  

## Usage

### Automatic (Recommended)

The script runs automatically after prebuild:

```bash
# Standard prebuild (runs setup-sentry automatically)
pnpm prebuild

# Clean prebuild (runs setup-sentry automatically)
pnpm prebuild:clean
```

### Manual

Run the script directly:

```bash
# From project root
pnpm setup-sentry

# Or directly with Node
node scripts/setup-sentry.mjs
```

### With Sentry Auth Token

Set the environment variable to avoid placeholder tokens:

```bash
export SENTRY_AUTH_TOKEN="your_sentry_auth_token"
pnpm setup-sentry
```

Or set it inline:

```bash
SENTRY_AUTH_TOKEN="your_token" pnpm setup-sentry
```

## What It Does

### ✅ Android (Fully Automated)

1. **Creates `android/sentry.properties`**
   ```properties
   defaults.url=https://sentry.io/
   defaults.org=unicorn-labs
   defaults.project=scaffald-native
   auth.token=YOUR_TOKEN
   ```

2. **Adds Sentry Gradle Integration** to `app/build.gradle`:
   ```gradle
   apply from: "../../node_modules/@sentry/react-native/sentry.gradle"
   ```

3. **Adds Sentry Android Gradle Plugin** to `build.gradle`:
   ```gradle
   classpath("io.sentry:sentry-android-gradle-plugin:4.17.0")
   ```

4. **Configures Sentry Plugin** in `app/build.gradle`:
   ```gradle
   apply plugin: "io.sentry.android.gradle"
   
   sentry {
       uploadNativeSymbols = true
       includeNativeSources = true
       autoInstallation {
           enabled = false
       }
   }
   ```

### ⚠️ iOS (Partial Automation)

1. **Creates `ios/sentry.properties`** (same format as Android)

2. **Provides Instructions** for manual Xcode configuration:
   - Modify "Bundle React Native code and images" build phase
   - Add "Upload Debug Symbols to Sentry" build phase

**iOS requires manual Xcode configuration** because modifying `.pbxproj` files programmatically is complex and error-prone. Two options:

#### Option 1: Sentry CLI (Recommended)
```bash
npx @sentry/wizard@latest -i reactNative --saas --org unicorn-labs --project scaffald-native
```

#### Option 2: Manual Configuration
Follow detailed instructions in `packages/core/utils/sentry/IOS_SETUP.md`

### 🔒 Git Safety

Updates `apps/expo/.gitignore`:
```gitignore
# Sentry
ios/sentry.properties
android/sentry.properties
```

## Idempotency

The script checks for existing configurations before making changes:

```bash
# First run
✅ Added Sentry Gradle integration to app/build.gradle
✅ Added Sentry Android Gradle Plugin to build.gradle
✅ Applied and configured Sentry plugin in app/build.gradle

# Second run (no duplicates)
ℹ️  Sentry Gradle integration already configured
ℹ️  Sentry Android Gradle Plugin already configured
ℹ️  Sentry plugin already applied
```

## Workflow Integration

### Package.json Scripts

```json
{
  "prebuild": "pnpm --filter expo-app prebuild && pnpm setup-sentry",
  "prebuild:clean": "pnpm --filter expo-app prebuild --clean && pnpm setup-sentry",
  "prebuild:only": "pnpm --filter expo-app prebuild",
  "setup-sentry": "node scripts/setup-sentry.mjs"
}
```

### Typical Development Flow

```bash
# 1. Initial setup or after clean
pnpm prebuild:clean
# → Generates iOS/Android folders
# → Automatically runs setup-sentry
# → Ready to build!

# 2. Regular prebuild (if needed)
pnpm prebuild
# → Updates iOS/Android folders
# → Automatically runs setup-sentry
# → Maintains Sentry configuration

# 3. Build and run
pnpm ios      # or pnpm android
```

## Prerequisites

- iOS and/or Android folders must exist (`expo prebuild` creates them)
- Node.js installed
- For iOS Xcode configuration: Xcode installed

## Error Handling

### Missing iOS/Android Folders

```bash
❌ iOS and Android folders not found.
ℹ️  Run "pnpm prebuild" first to generate native folders.
```

**Solution**: Run `pnpm prebuild` first.

### Missing Xcode Project

```bash
⚠️  Xcode project file not found
```

**Solution**: Ensure `expo prebuild` completed successfully.

### Missing Build Files

```bash
❌ android/app/build.gradle not found
```

**Solution**: Re-run `expo prebuild` to regenerate files.

## Troubleshooting

### Script Doesn't Run After Prebuild

Check that the command includes the setup script:
```bash
pnpm prebuild
# Should show "setup-sentry" in output
```

If not, run manually:
```bash
pnpm setup-sentry
```

### Placeholder Auth Token

If you see:
```
⚠️  android/sentry.properties created with placeholder token
```

**Solutions**:
1. Set environment variable: `export SENTRY_AUTH_TOKEN="your_token"`
2. Manually edit the properties files
3. Add to your `.env` file (if project supports it)

### Gradle Build Fails

If Android build fails with Sentry errors:

1. Check `android/sentry.properties` has valid auth token
2. Verify Sentry version compatibility
3. Check `build.gradle` for conflicts
4. Try clean build: `cd apps/expo/android && ./gradlew clean`

### iOS Build Fails

If iOS build fails with Sentry errors:

1. Ensure Xcode build phases are configured (see IOS_SETUP.md)
2. Check `ios/sentry.properties` has valid auth token
3. Verify node path if using nvm/volta
4. Clean build folder in Xcode

## Manual Configuration

If you prefer manual setup over automation:

```bash
# Run prebuild without Sentry setup
pnpm prebuild:only

# Then manually configure following:
# - packages/core/utils/sentry/IOS_SETUP.md
# - packages/core/utils/sentry/ANDROID_SETUP.md
```

## Script Updates

To modify the script:

1. Edit `scripts/setup-sentry.mjs`
2. Test with: `pnpm setup-sentry`
3. Verify idempotency by running twice
4. Test with clean prebuild: `pnpm prebuild:clean`

## Related Documentation

- **Main README**: `packages/core/utils/sentry/README.md`
- **iOS Setup**: `packages/core/utils/sentry/IOS_SETUP.md`
- **Android Setup**: `packages/core/utils/sentry/ANDROID_SETUP.md`
- **Expo Prebuild**: [Expo Prebuild Documentation](https://docs.expo.dev/workflow/prebuild/)

## Support

For issues with the script:

1. Check this documentation
2. Review script output for specific errors
3. Verify prerequisites are met
4. Check related documentation
5. Contact development team

---

**Last Updated**: December 2024  
**Script Version**: 1.0.0  
**Maintainer**: Development Team

