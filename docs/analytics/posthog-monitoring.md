# PostHog Monitoring & Drift Detection

This guide documents the operational configuration for keeping the new analytics stack healthy across environments.

## Environment & Keys

- Provision three PostHog projects (`scaffald-dev`, `scaffald-staging`, `scaffald-prod`).
- Supply keys through the existing variables that land in Expo at build time:
  - `POSTHOG_KEY_DEV`, `POSTHOG_KEY_STAGING`, `POSTHOG_KEY_PROD` (client SDKs)
  - `EXPO_PUBLIC_POSTHOG_API_KEY` (client SDK override for local/dev shells)
  - `POSTHOG_KEY_SERVER` (Supabase edge functions)
- Keep the shared `POSTHOG_HOST` (or `EXPO_PUBLIC_POSTHOG_HOST`) pointing at PostHog Cloud unless you migrate to a self-hosted URL.

`apps/expo/eas.json` already wires `APP_ENV` and the per-environment keys so builds remain isolated.

## Ingestion Rules

Configure the following PostHog ingestion filters per project:

1. **Environment guard** – drop any event where `properties.env` does not match the project (`development`, `staging`, `production`).
2. **Consent enforcement** – reject events missing the `source` property (all client events set `source: 'client'`; server events use `source: 'server'`).
3. **Internal traffic** – filter internal IP ranges and company email domains to keep dashboards customer-facing.

## Health Metrics & Alerts

Recommended dashboard widgets:

- Event volume by environment (`env` property).
- `user_signed_in` vs. `user_signed_out` counts (helps catch imbalances).
- Queue backlog size fed by the offline queue helper (see below).
- Supabase server-side events such as `application_submitted`.

Alerts to wire:

- Event volume drop/rise of >20% day over day.
- Any events leaving the production project where `properties.env` is not `"production"`.
- Offline queue backlog greater than 50 events for more than 10 minutes.

## Runtime Diagnostics

Client code exposes a snapshot helper:

```ts
import { getAnalyticsHealthSnapshot } from '@app/core/utils/analytics/health'

const snapshot = await getAnalyticsHealthSnapshot()
// {
//   initialized: boolean,
//   queuedEvents: number,
//   distinctId: string | null
// }
```

The offline queue drains automatically whenever:

- The user grants analytics consent.
- Network connectivity returns (`@react-native-community/netinfo` listener).

Queued events live in `AsyncStorage` (`analytics:event_queue`) and are trimmed at 100 MB.

## Manual Verification Checklist

- Confirm a canary build sends events to the correct PostHog environment.
- Disable analytics consent and ensure no new events arrive.
- Simulate offline mode, trigger a critical event (`auth_magic_link_requested`), then go online and confirm it flushes.
- Submit an application from staging and verify `application_submitted` events appear in the server-side project.

Keep this document updated whenever the event catalogue or monitoring strategy changes.

