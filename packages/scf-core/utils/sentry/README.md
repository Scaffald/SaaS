# Sentry Integration for SCF-Scaffald

Complete error tracking, performance monitoring, and session replay setup for React Native (iOS/Android) and Web platforms.

## Overview

This implementation provides:

- **Error Tracking**: Automatic capture of JavaScript errors, native crashes, and unhandled rejections
- **Performance Monitoring**: Transaction tracing and performance insights
- **Session Replay**: Visual reproduction of user sessions (Web only, Native in beta)
- **User Context**: Automatic user identification and context enrichment
- **Platform-Specific**: Separate configurations for React Native and Web

## Architecture

```
packages/core/utils/sentry/
├── config.ts           # Environment configuration and DSN management
├── client.native.ts    # React Native (iOS/Android) SDK implementation
├── client.web.ts       # Web SDK implementation  
├── index.ts            # Unified exports (platform-resolved)
├── README.md           # This file
├── IOS_SETUP.md        # iOS-specific configuration steps
└── ANDROID_SETUP.md    # Android-specific configuration steps
```

**Platform Resolution**: The Expo/Metro bundler automatically resolves `client.native.ts` for iOS/Android and `client.web.ts` for web builds.

## Quick Start

### 1. Automated Setup (Recommended)

After running `expo prebuild` or `pnpm prebuild`, the Sentry configuration is automatically applied via the `setup-sentry` script:

```bash
# Prebuild with automatic Sentry setup
pnpm prebuild

# Or prebuild with clean
pnpm prebuild:clean

# Or run setup-sentry manually
pnpm setup-sentry
```

The script is **idempotent** and can be run multiple times safely. It will:
- ✅ Create `ios/sentry.properties` and `android/sentry.properties`
- ✅ Configure Android Gradle integration
- ✅ Update `.gitignore` with Sentry entries
- ⚠️  iOS Xcode build phases require manual setup (see below)

**Environment Variable**: Set `SENTRY_AUTH_TOKEN` to automatically populate the auth token:

```bash
export SENTRY_AUTH_TOKEN="your_sentry_auth_token"
pnpm setup-sentry
```

### 2. Environment Variables

The following environment variables are already configured in `eas.json` and `app.config.ts`:

```bash
# Native (iOS/Android) DSN
EXPO_PUBLIC_SENTRY_DSN_NATIVE="https://11f32683d2e167d8de8e350e7a33a5e3@o1019232.ingest.us.sentry.io/4510467560964096"

# Web DSN  
EXPO_PUBLIC_SENTRY_DSN_WEB="https://549714752feca37523a21ba85bb14760@o1019232.ingest.us.sentry.io/4510467545759744"
```

### 3. Automatic Initialization

Sentry initializes automatically when the app starts via `apps/expo/app/_layout.tsx`:

```typescript
import { initSentry } from '@app/core/utils/sentry'

// Called at app startup
initSentry()
```

### 4. User Context Sync

User context is automatically synchronized via `AuthProvider`:

```typescript
// When user signs in
setSentryUser(userId, email, traits)

// When user signs out
clearSentryUser()
```

## Usage

### Capturing Exceptions

```typescript
import { captureException } from '@app/core/utils/sentry'

try {
  // Your code
} catch (error) {
  captureException(error, {
    extra: 'context',
    someId: 123,
  })
}
```

### Capturing Messages

```typescript
import { captureMessage } from '@app/core/utils/sentry'

captureMessage('Something went wrong', 'warning')
// Levels: 'info' | 'warning' | 'error' | 'fatal' | 'debug'
```

### Adding Breadcrumbs

```typescript
import { addBreadcrumb } from '@app/core/utils/sentry'

addBreadcrumb({
  message: 'User clicked submit',
  level: 'info',
  data: {
    formId: 'signup-form',
  },
})
```

### Setting Tags

```typescript
import { setTag } from '@app/core/utils/sentry'

setTag('feature', 'authentication')
setTag('experiment', 'new-onboarding')
```

### Setting Context

```typescript
import { setContext } from '@app/core/utils/sentry'

setContext('payment', {
  method: 'credit_card',
  amount: 99.99,
  currency: 'USD',
})
```

## Testing

### Test Component

Use the `SentryTestButtons` component to verify integration:

```typescript
import { SentryTestButtons } from '@app/core/components/SentryTestButtons'

// In a development screen
export function DevScreen() {
  return (
    <View>
      {__DEV__ && <SentryTestButtons />}
    </View>
  )
}
```

### Manual Tests

```typescript
import * as Sentry from '@sentry/react-native'

// Test JavaScript error
throw new Error('Test error')

// Test native crash (iOS/Android)
Sentry.nativeCrash()

// Test message capture
Sentry.captureMessage('Test message')
```

### Verification Checklist

After integration, verify:

1. ✅ Errors appear in Sentry dashboard
2. ✅ Source maps are uploaded (readable stack traces)
3. ✅ User context is attached to events
4. ✅ Performance transactions are recorded
5. ✅ Session replays are captured (Web)
6. ✅ Native crashes are reported (iOS/Android)

## Platform-Specific Setup

### iOS Configuration

Source maps and debug symbols must be uploaded during build. See [IOS_SETUP.md](./IOS_SETUP.md) for:

- Creating `sentry.properties`
- Configuring Xcode build phases
- Setting up source map upload
- Uploading debug symbols

### Android Configuration

Gradle integration handles source maps and native symbols. See [ANDROID_SETUP.md](./ANDROID_SETUP.md) for:

- Creating `sentry.properties`
- Enabling Gradle integration
- Configuring Sentry Android Gradle Plugin
- ProGuard/R8 setup

### Web Configuration

Web setup is automatic. The SDK is configured in `client.web.ts` with:

- Automatic source map upload via build process
- Session replay enabled
- Browser tracing integration
- User feedback integration

## Configuration

### Sample Rates

Sample rates are automatically adjusted per environment in `config.ts`:

| Environment | Traces | Replays |
|-------------|--------|---------|
| Development | 100%   | 100%    |
| Staging     | 50%    | 30%     |
| Production  | 20%    | 10%     |

### Environment-Specific Behavior

```typescript
// From config.ts
export const APP_ENV = 'development' | 'staging' | 'production'

// Sample rates automatically adjust
const traceSampleRate = getTraceSampleRate() // 1.0, 0.5, or 0.2
const replaySampleRate = getReplaySampleRate() // 1.0, 0.3, or 0.1
```

### Privacy & Consent

**Important**: Sentry is **always enabled** regardless of user consent for analytics. This is intentional because:

- Error tracking is critical for app stability
- Crashes impact user experience directly
- Error reports help fix bugs that affect all users

PostHog analytics respects user consent, but Sentry error tracking does not.

## Best Practices

### DO ✅

- Capture errors with meaningful context
- Add breadcrumbs for user actions
- Set tags for filtering and searching
- Include relevant user context
- Test error reporting in development
- Monitor Sentry quotas and sample rates

### DON'T ❌

- Capture expected errors (use try-catch)
- Send sensitive data (passwords, tokens)
- Over-sample in production (quota limits)
- Ignore Sentry warnings in logs
- Skip platform-specific setup steps
- Deploy without testing error capture

## Troubleshooting

### Errors Not Appearing in Sentry

1. Check DSN is configured: `console.log(SENTRY_DSN_NATIVE || SENTRY_DSN_WEB)`
2. Verify initialization: `console.log('[sentry] Initialized')`
3. Check network connectivity
4. Look for Sentry errors in console
5. Verify environment (dev/staging/prod)

### Source Maps Not Working

**iOS/Android:**
- Check build logs for upload errors
- Verify `sentry.properties` exists and is valid
- Ensure auth token has upload permissions
- See [IOS_SETUP.md](./IOS_SETUP.md) or [ANDROID_SETUP.md](./ANDROID_SETUP.md)

**Web:**
- Check build output for upload messages
- Verify source maps are generated
- Check Sentry CLI version compatibility

### Performance Issues

If Sentry is impacting performance:

1. Reduce trace sample rate (production: 0.1 = 10%)
2. Reduce replay sample rate (production: 0.05 = 5%)
3. Disable debug mode in production
4. Monitor SDK overhead in profiler

### Native Crashes Not Reported

**iOS:**
- Verify debug symbols are uploaded
- Check dSYM files are included in build
- See [IOS_SETUP.md](./IOS_SETUP.md) for symbol upload

**Android:**
- Enable native symbol upload in Gradle
- Verify ProGuard mapping files
- See [ANDROID_SETUP.md](./ANDROID_SETUP.md) for AGP setup

## Monitoring

### Sentry Dashboard

Access your projects:

- **Native**: https://sentry.io/organizations/unicorn-labs/projects/scaffald-native/
- **Web**: https://sentry.io/organizations/unicorn-labs/projects/scaffald-web/

### Key Metrics

Monitor these metrics regularly:

1. **Error Rate**: Errors per session
2. **Crash-Free Sessions**: % of sessions without crashes
3. **Performance**: Average transaction duration
4. **User Impact**: Number of users affected
5. **Release Health**: Issues per release

## Resources

### Sentry Documentation

- [React Native Guide](https://docs.sentry.io/platforms/react-native/)
- [Web/React Guide](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)

### Internal Documentation

- [IOS_SETUP.md](./IOS_SETUP.md) - iOS configuration steps
- [ANDROID_SETUP.md](./ANDROID_SETUP.md) - Android configuration steps
- [PostHog Analytics](../analytics/README.md) - Analytics setup (separate from Sentry)

## Support

For questions or issues:

1. Check this README and platform-specific guides
2. Review Sentry documentation linked above
3. Check console logs for Sentry errors
4. Contact the development team

---

**Last Updated**: December 2024
**Sentry SDK Versions**: 
- `@sentry/react-native`: ^6.0.0
- `@sentry/react`: ^10.28.0

