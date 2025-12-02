# iOS Sentry Configuration

This guide covers the manual steps required to configure Sentry for iOS in the Expo/React Native app.

## Prerequisites

- Sentry account with organization and project created
- Sentry auth token with appropriate permissions
- Xcode installed and configured

## Step 1: Create sentry.properties File

Create a file at `apps/expo/ios/sentry.properties` with the following content:

```properties
defaults.url=https://sentry.io/
defaults.org=unicorn-labs
defaults.project=scaffald-native
auth.token=YOUR_SENTRY_AUTH_TOKEN
```

**Important:** Replace `YOUR_SENTRY_AUTH_TOKEN` with your actual Sentry auth token. This file should be added to `.gitignore` to keep the token secure.

## Step 2: Configure Xcode Build Phases

You need to modify two Xcode build phases:

### 2.1 Bundle React Native Code and Images (Modify Existing)

Find the existing build phase named "Bundle React Native code and images" and modify it:

**Before:**

```bash
set -e

WITH_ENVIRONMENT="../node_modules/react-native/scripts/xcode/with-environment.sh"
REACT_NATIVE_XCODE="../node_modules/react-native/scripts/react-native-xcode.sh"

/bin/sh -c "$WITH_ENVIRONMENT $REACT_NATIVE_XCODE"
```

**After:**

```bash
set -e

WITH_ENVIRONMENT="../node_modules/react-native/scripts/xcode/with-environment.sh"
SENTRY_XCODE="../node_modules/@sentry/react-native/scripts/sentry-xcode.sh"

# RN 0.81.1+
/bin/sh -c "$WITH_ENVIRONMENT $SENTRY_XCODE"
```

This enables automatic source map upload during the build process.

### 2.2 Upload Debug Symbols to Sentry (New Build Phase)

Create a new "Run Script" build phase named "Upload Debug Symbols to Sentry":

```bash
/bin/sh ../node_modules/@sentry/react-native/scripts/sentry-xcode-debug-files.sh
```

**Important:** This build phase should run **after** the "Bundle React Native code and images" phase.

## Step 3: Environment Variables (Optional)

You can customize the behavior by setting environment variables in `.xcode.env`:

```bash
# Source maps configuration
export SENTRY_PROPERTIES=path/to/sentry.properties
export SENTRY_DISABLE_AUTO_UPLOAD=true # Temporarily disable source map upload
export AUTO_RELEASE=true # Automatically detect release from Xcode project
export SENTRY_CLI_EXECUTABLE="path/to/@sentry/cli/bin/sentry-cli"
export SENTRY_CLI_EXTRA_ARGS="--extra --flags"
export SENTRY_CLI_RN_XCODE_EXTRA_ARGS="--extra --flags"

# Debug symbols configuration
export SENTRY_INCLUDE_NATIVE_SOURCES=true # Upload native iOS sources
export SENTRY_CLI_DEBUG_FILES_UPLOAD_EXTRA_ARGS="--extra --flags"

# Source map paths
export SOURCE_MAP_PATH="path/to/source-maps"
export SENTRY_COLLECT_MODULES="path/to/collect-modules.sh"
export MODULES_PATHS="../node_modules,../my-custom-module"
```

## Step 4: Using Node with nvm or Volta

If you're using nvm or Volta, Xcode may have trouble locating the node binary. Add this to your build script:

```bash
# Add at the beginning of the build script
export NODE_BINARY=$(command -v node)
```

Or use absolute paths:

```bash
# If using nvm
export NODE_BINARY=$HOME/.nvm/versions/node/v20.x.x/bin/node

# If using Volta
export NODE_BINARY=$HOME/.volta/bin/node
```

## Step 5: Add Privacy Manifest

The Sentry SDK requires access to certain device information. Add the required privacy manifest entries to your `Info.plist` or create a `PrivacyInfo.xcprivacy` file.

See [Apple Privacy Manifest](https://docs.sentry.io/platforms/react-native/data-management/apple-privacy-manifest/) for details.

## Step 6: Build and Verify

1. Clean build folder: `Product > Clean Build Folder` in Xcode
2. Build the app: `pnpm ios` or build directly in Xcode
3. Check the build logs for Sentry upload messages
4. Verify source maps and debug symbols appear in Sentry dashboard

## Troubleshooting

### Source Maps Not Uploading

- Check that `SENTRY_DISABLE_AUTO_UPLOAD` is not set to `true`
- Verify `sentry.properties` exists and contains valid credentials
- Check build logs for Sentry-related errors
- Try with `--allow-fetch` flag for debug builds:

```bash
export SENTRY_CLI_RN_XCODE_EXTRA_ARGS="--allow-fetch"
```

### Debug Symbols Not Found

- Ensure the "Upload Debug Symbols" build phase runs after bundle phase
- Verify `SENTRY_INCLUDE_NATIVE_SOURCES=true` if you want native sources
- Check that dSYM files are being generated (Release builds)

### Node Not Found Errors

- Set `NODE_BINARY` environment variable
- Use absolute path to node executable
- Check that the node version matches your development environment

## Additional Resources

- [Sentry React Native Documentation](https://docs.sentry.io/platforms/react-native/)
- [Sentry iOS Configuration](https://docs.sentry.io/platforms/react-native/manual-setup/manual-setup/#ios)
- [Apple Privacy Manifest Guide](https://docs.sentry.io/platforms/react-native/data-management/apple-privacy-manifest/)

