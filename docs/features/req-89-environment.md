# REQ-89 · Notification System Environment Setup

This document captures the provider credentials and Supabase secrets that must be configured before deploying the multi-channel notification system.

## 1. Core Secrets

All secrets should be stored via Supabase Vault (CLI command `pnpm supa secrets set ...`). The values below are referenced by the Edge Functions and cron workers introduced for REQ-89.

| Secret | Purpose | Notes |
| --- | --- | --- |
| `SENDGRID_API_KEY` | SendGrid API key with Mail Send permission | Create under *Settings → API Keys* |
| `SENDGRID_FROM_EMAIL` | Default `from` address for transactional email | Must be a verified sender | 
| `SENDGRID_FROM_NAME` | Display name for email sender | Optional; defaults to `Scaffald` |
| `SENDGRID_TEMPLATE_ID` | (Optional) Dynamic template ID for notification emails | When omitted, the adapter falls back to plain HTML |
| `SENDGRID_SANDBOX_MODE` | Set to `true` to test without delivering email | Useful for staging |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | Required for SMS |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | Required for SMS |
| `TWILIO_SMS_FROM` | Verified Twilio phone number | Must be capable of outbound SMS |
| `TWILIO_SMS_STATUS_CALLBACK` | (Optional) HTTPS URL for delivery callbacks | Defaults to the deployed SMS webhook |
| `EXPO_ACCESS_TOKEN` | Expo access token for push receipts | Create via `expo login && expo whoami` |

### CLI Helper

```bash
# Example: configure SendGrid + Twilio secrets in one command
pnpm supa secrets set \
  SENDGRID_API_KEY="sk_live_…" \
  SENDGRID_FROM_EMAIL="notifications@scaffald.com" \
  SENDGRID_FROM_NAME="Scaffald" \
  TWILIO_ACCOUNT_SID="ACxxxxxxxx" \
  TWILIO_AUTH_TOKEN="••••••" \
  TWILIO_SMS_FROM="+15555551234" \
  EXPO_ACCESS_TOKEN="ExponentPushToken-…"
```

### Cron Job Settings (GUCs)

The pg_cron workers rely on two custom configuration values. Set them once per environment:

```bash
# Base URL for Edge Function invocations
pnpm supa db query "ALTER DATABASE postgres SET app.supabase_url = 'https://YOUR-PROJECT.supabase.co';"

# Service-role key used for cron-authenticated requests
pnpm supa db query "ALTER DATABASE postgres SET app.service_role_key = 'supasecret...';"
```

## 2. Local Development

Add the same keys to the root `.env.local` used by the Supabase CLI. The Edge Functions read environment values directly via `Deno.env.get(...)` so local and remote instances share the same contract.

```env
SENDGRID_API_KEY=sk_local_...
SENDGRID_FROM_EMAIL=notifications@localhost.dev
SENDGRID_FROM_NAME="Scaffald Dev"
SENDGRID_SANDBOX_MODE=true
TWILIO_ACCOUNT_SID=AC_local
TWILIO_AUTH_TOKEN=local-secret
TWILIO_SMS_FROM=+15005550006
EXPO_ACCESS_TOKEN=ExponentPushToken-local
```

> **Tip:** When `SENDGRID_SANDBOX_MODE=true`, SendGrid accepts the request but does not deliver email—ideal for staging.

## 3. Webhook Configuration

### SendGrid Event Webhook
- **Endpoint:** `<SUPABASE_URL>/functions/v1/webhooks/email`
- **Events:** `processed`, `delivered`, `open`, `click`, `bounce`, `dropped`, `spamreport`
- **Verification:** Enable signed event payloads (optional). The handler currently trusts the SendGrid source network.

### Twilio Messaging Webhook
- **Status Callback URL:** `<SUPABASE_URL>/functions/v1/webhooks/sms`
- **Events Covered:** `queued`, `sent`, `delivered`, `failed`, `undelivered`

### Push Provider Callbacks (Optional)
- **Endpoint:** `<SUPABASE_URL>/functions/v1/webhooks/push`
- Use for Firebase/APNs style delivery callbacks when Expo is not authoritative.

## 4. Cron Jobs & Health Checks

The migration `025_req_89_notifications_expansion.sql` registers the following pg_cron jobs once `pg_cron` is available:

| Job | Schedule | Target |
| --- | --- | --- |
| `notifications-send-worker` | Every minute | `notify-send-worker` Edge Function |
| `notifications-check-receipts` | Every 15 minutes | `notify-check-receipts` Edge Function |
| `notifications-digest-daily` | 07:00 UTC daily | `notify-digest-daily` Edge Function |
| `notifications-digest-weekly` | Monday 08:00 UTC | `notify-digest-weekly` Edge Function |

Use the CLI to view the active jobs:

```bash
pnpm supa db query "select * from cron.job order by jobname;"
```

## 5. Testing Matrix

| Channel | What to verify | Tooling |
| --- | --- | --- |
| Email | Delivery + sandbox mode | SendGrid Activity Feed, Email Test account |
| SMS | Status updates flow to webhook | Twilio Messaging Logs |
| Push | Ticket receipt + expo receipt polling | `notify-check-receipts` logs + Expo push receipt viewer |

Record manual test runs in the BrainGrid requirement once credentials are provisioned.
