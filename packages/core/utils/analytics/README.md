# Analytics Implementation

## Overview

This analytics implementation uses Expo's platform-specific file extensions (`.native.ts` and `.web.ts`) to provide PostHog analytics support across all platforms (iOS, Android, and Web) while maximizing code reuse through shared modules.

## Architecture

```
analytics/
├── config.ts          # Shared environment & configuration
├── types.ts           # Shared TypeScript types
├── utils.ts           # Shared utility functions
├── events.ts          # Event schemas and validation
├── client.native.ts   # Native implementation (posthog-react-native)
├── client.web.ts      # Web implementation (posthog-js)
├── health.ts          # Analytics health checks
└── queue.ts           # Event queuing system
```

## Platform-Specific Implementations

### Native (iOS/Android)
- Uses `posthog-react-native` SDK
- Storage: AsyncStorage
- Lifecycle events: Native app lifecycle tracking

### Web
- Uses `posthog-js` SDK
- Storage: localStorage + cookies
- Lifecycle events: Pageview and pageleave tracking

## Shared Modules

### config.ts
Exports environment configuration:
- `POSTHOG_KEY`: API key from environment
- `POSTHOG_HOST`: PostHog host URL
- `APP_ENV`: Application environment (development/staging/production)
- `CHANNEL`: Update channel
- `isAllowedEnvironment`: Whether analytics should run

### types.ts
Common TypeScript types:
- `AnalyticsEnvironment`: Environment type
- `InitAnalyticsOptions`: Initialization options
- `SuperProperties`: Common event properties
- `EventProperties`: Event property type

### utils.ts
Shared utility functions:
- `isAnalyticsAvailable()`: Checks if PostHog is configured
- `buildSuperProperties()`: Builds common properties for all events

## API

Both implementations export the same API:

```typescript
// Initialization
export function initAnalytics(options: InitAnalyticsOptions): Promise<void>

// User identification
export function identify(userId: string, properties?: EventProperties): void
export function alias(aliasId: string): void
export function reset(propertiesToKeep?: boolean): void

// Event tracking
export function capture(event: string, properties?: EventProperties): void
export function captureEvent<T>(event: T, properties: AnalyticsEventProperties<T>): boolean
export function screen(name: string, properties?: EventProperties): void

// Lifecycle
export function flush(): Promise<void>
export function shutdownAnalytics(timeoutMs?: number): Promise<void>

// Query methods
export const isAnalyticsAvailable: () => boolean
export const analyticsEnv: AnalyticsEnvironment
export const getAnalyticsClient: () => unknown
export const isAnalyticsInitialized: () => boolean
```

## Usage

Import analytics functions normally - the bundler automatically selects the correct implementation:

```typescript
import { initAnalytics, captureEvent } from '@app/core/utils/analytics/client'

// Initialize with user consent
await initAnalytics({ hasConsent: true, debug: __DEV__ })

// Track events
captureEvent('user_signed_in', {
  provider: 'google',
  is_new_user: false,
})
```

## Testing

### Web Testing
```bash
# Start web development server
pnpm web

# Open browser and check console for:
# "[analytics] PostHog initialized on web"
```

### Native Testing
```bash
# iOS
pnpm ios

# Android
pnpm android

# Check console for:
# "[analytics debug] client initialized true"
```

### Verification
1. Events should appear in PostHog dashboard
2. No "[analytics] Skipping PostHog init on web platform" message on web
3. Platform-specific properties are set correctly
4. Bundle size: Each platform only includes its SDK

## Benefits

- **80% code reuse**: Config, types, and utils shared across platforms
- **Type safety**: Consistent API enforced by shared types
- **Smaller bundles**: Each platform only includes its SDK
- **No runtime checks**: Bundler handles platform selection at build time
- **Single source of truth**: Environment logic in one place
- **Easier maintenance**: Change config once, affects all platforms

## Environment Variables

Required for analytics to function:

```bash
# PostHog API key (public, safe for client bundles)
EXPO_PUBLIC_POSTHOG_API_KEY=phc_xxx

# PostHog host (optional, defaults to app.posthog.com)
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## Implementation Notes

1. **Platform Detection**: The bundler (Metro for Expo) automatically selects:
   - `client.native.ts` for iOS and Android
   - `client.web.ts` for web builds

2. **Consent Management**: Analytics requires explicit user consent via `initAnalytics({ hasConsent: true })`

3. **Environment Gating**: Analytics only runs in allowed environments (production with production channel, or development mode)

4. **Event Validation**: All events are validated against schemas in `events.ts`

5. **Screen Tracking**: 
   - Native: Uses `client.screen(name, properties)`
   - Web: Converts to `$pageview` event with URL

