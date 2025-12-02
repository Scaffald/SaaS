# Android Sentry Configuration

This guide covers the manual steps required to configure Sentry for Android in the Expo/React Native app.

## Prerequisites

- Sentry account with organization and project created
- Sentry auth token with appropriate permissions
- Android Studio installed and configured

## Step 1: Create sentry.properties File

Create a file at `apps/expo/android/sentry.properties` with the following content:

```properties
defaults.url=https://sentry.io/
defaults.org=unicorn-labs
defaults.project=scaffald-native
auth.token=YOUR_SENTRY_AUTH_TOKEN
```

**Important:** Replace `YOUR_SENTRY_AUTH_TOKEN` with your actual Sentry auth token. This file should be added to `.gitignore` to keep the token secure.

## Step 2: Enable Gradle Integration

### 2.1 Add Sentry Gradle Integration

Edit `apps/expo/android/app/build.gradle` and add the following line **before** the `android` block:

```gradle
apply from: "../../node_modules/@sentry/react-native/sentry.gradle"

android {
    // ... your existing android configuration
}
```

This enables automatic source map upload during the build process.

### 2.2 Configure Environment Variables (Optional)

You can customize the behavior by setting environment variables:

```bash
export SENTRY_PROPERTIES=path/to/sentry.properties
export SENTRY_DISABLE_AUTO_UPLOAD=true # Temporarily disable source maps upload

export SENTRY_DIST=1234
export SENTRY_RELEASE=app@1.0.0
```

## Step 3: Enable Sentry Android Gradle Plugin (AGP)

### 3.1 Add AGP Dependency

Edit `apps/expo/android/build.gradle` and add the Sentry Android Gradle Plugin:

```gradle
buildscript {
    dependencies {
        // Other dependencies ...
        classpath("io.sentry:sentry-android-gradle-plugin:4.17.0")
    }
}
```

### 3.2 Apply and Configure the Plugin

Edit `apps/expo/android/app/build.gradle` and add:

```gradle
apply plugin: "io.sentry.android.gradle"

sentry {
    // Enables or disables the automatic configuration of Native Symbols
    // for Sentry. This executes sentry-cli automatically so
    // you don't need to do it manually.
    // Default is disabled.
    uploadNativeSymbols = true

    // Enables or disables the automatic upload of the app's native source code to Sentry.
    // This executes sentry-cli with the --include-sources param automatically so
    // you don't need to do it manually.
    // This option has an effect only when [uploadNativeSymbols] is enabled.
    // Default is disabled.
    includeNativeSources = true

    // `@sentry/react-native` ships with compatible `sentry-android`
    // This option would install the latest version that ships with the SDK or SAGP
    // which might be incompatible with the React Native SDK
    // Enable auto-installation of Sentry components (sentry-android SDK and okhttp, timber and fragment integrations).
    // Default is enabled.
    autoInstallation {
        enabled = false
    }

    // Additional configuration options
    // tracingInstrumentation {
    //     enabled = true
    //     features = ["database", "file-io", "okhttp", "compose"]
    // }
}
```

**Important Notes:**
- Set `autoInstallation.enabled = false` because `@sentry/react-native` already includes the correct version
- Enable `uploadNativeSymbols` for native crash reporting
- Enable `includeNativeSources` to upload native source code for better debugging

## Step 4: ProGuard/R8 Configuration (Production Builds)

For production builds with code minification, ensure ProGuard rules are configured:

Edit `apps/expo/android/app/proguard-rules.pro`:

```proguard
# Sentry
-keepattributes LineNumberTable,SourceFile
-dontwarn org.slf4j.**
-dontwarn javax.servlet.**

# Keep Sentry classes
-keep class io.sentry.** { *; }
-keep interface io.sentry.** { *; }
```

## Step 5: Build and Verify

1. Clean build: `cd apps/expo/android && ./gradlew clean`
2. Build the app: `pnpm android` or build directly in Android Studio
3. Check the build logs for Sentry upload messages:
   ```
   > Task :app:sentryCollectSourcesRelease
   > Task :app:sentryUploadNativeSymbolsRelease
   > Task :app:sentryUploadProguardMappingsRelease
   ```
4. Verify source maps and debug symbols appear in Sentry dashboard

## Step 6: Test Error Reporting

After building, test that errors are being reported:

```typescript
import * as Sentry from '@sentry/react-native';

// Trigger a test error
throw new Error('Test Sentry Android integration');

// Or use Sentry directly
Sentry.captureException(new Error('Test error'));
```

## Troubleshooting

### Source Maps Not Uploading

- Check that `SENTRY_DISABLE_AUTO_UPLOAD` is not set to `true`
- Verify `sentry.properties` exists and contains valid credentials
- Check build logs for Sentry-related errors
- Try running Gradle with `--info` or `--debug` flags:

```bash
cd apps/expo/android
./gradlew assembleRelease --info | grep -i sentry
```

### Native Symbols Not Uploading

- Ensure `uploadNativeSymbols = true` in sentry configuration
- Check that the Sentry Android Gradle Plugin is applied correctly
- Verify build logs show `sentryUploadNativeSymbolsRelease` task
- Check Sentry auth token has permissions for uploads

### Plugin Version Conflicts

If you see warnings about Sentry version conflicts:

```
The Sentry SDK version [X.Y.Z] does not match the Sentry Android Gradle Plugin version [A.B.C]
```

Solutions:
- Ensure `autoInstallation.enabled = false` in sentry configuration
- Update `@sentry/react-native` to the latest version
- Check the [compatibility matrix](https://docs.sentry.io/platforms/android/configuration/gradle/)

### Build Performance Issues

Source map and symbol upload can slow down builds. For development builds:

```bash
# Disable uploads for faster builds
export SENTRY_DISABLE_AUTO_UPLOAD=true
```

Or only enable for release builds by adding to `build.gradle`:

```gradle
sentry {
    uploadNativeSymbols = !project.hasProperty('devBuild')
}
```

## Additional Resources

- [Sentry React Native Documentation](https://docs.sentry.io/platforms/react-native/)
- [Sentry Android Configuration](https://docs.sentry.io/platforms/react-native/manual-setup/manual-setup/#android)
- [Sentry Android Gradle Plugin](https://docs.sentry.io/platforms/android/configuration/gradle/)
- [ProGuard Configuration](https://docs.sentry.io/platforms/android/configuration/gradle/#proguard--r8--dexguard)

