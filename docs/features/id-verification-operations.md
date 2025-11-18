# ID Verification Operations Guide

Updated: 2025-11-18

This document captures the operational runbook for the Persona-powered ID verification flow that ships with REQ-88 Task 7. Reference it when rotating secrets, testing the webhook, or validating reminders.

## Environment Variables

Set the following variables in `.env.local`, Supabase dashboard, and any hosting provider:

| Variable | Description |
| --- | --- |
| `PERSONA_API_KEY` | Server-side API key used by the tRPC router to create inquiries |
| `PERSONA_TEMPLATE_ID` | Template that defines the Persona workflow for worker IDs |
| `PERSONA_WEBHOOK_SECRET` | Shared secret for signing webhook payloads (`persona-webhook` Edge Function) |
| `PERSONA_ALLOWED_IPS` | Optional comma-separated allowlist for webhook source IPs |

> The router automatically falls back to a mocked Persona inquiry when `PERSONA_API_KEY` or `PERSONA_TEMPLATE_ID` is not configured—useful for local development.

## Webhook Configuration

Persona webhooks are processed by the Supabase Edge Function located at `packages/supabase/functions/persona-webhook/index.ts`.

### Steps

1. **Deploy the Edge Function** (done automatically by Supabase CLI / dashboard).
2. **Create a Persona webhook** that targets:  
   `https://<your-supabase-url>/functions/v1/persona-webhook`
3. **Provide the signing secret** in the Persona dashboard and copy it into `PERSONA_WEBHOOK_SECRET`.
4. **(Optional) IP allow list**: add Persona’s outbound IPs to `PERSONA_ALLOWED_IPS`. The function will reject calls from other addresses.

The webhook updates the latest `id_verifications` row by:

- Syncing `persona_status`
- Transitioning `badge_status` among `active`, `expired`, and `revoked`
- Refreshing `badge_expires_at` (+6 months) when Persona approves an inquiry

## Badge Expiration Monitoring

Edge Function: `packages/supabase/functions/notify-id-verification-expiration/index.ts`

Schedule this function via Supabase cron (recommended every morning UTC). It performs:

1. **Auto-expiration** for badges whose `badge_expires_at` is in the past.
2. **Reminders** at 30 days and 7 days before expiration.
3. **“Expired” notification** on the day the badge lapses.

Notifications are stored in the existing `notifications` tables and an email is queued via SendGrid when the worker has an email on file. Reminder deduping uses metadata keys:

- `metadata.reminders.id_verification.expiration_30_day`
- `metadata.reminders.id_verification.expiration_7_day`
- `metadata.reminders.id_verification.expiration_expired`

## Testing Checklist

1. `pnpm supa start` to run the local Supabase stack.
2. `STRIPE_MOCK_MODE=1 deno test --allow-all packages/supabase/tests/routers/id-verification.router.test.ts`
3. Manually invoke the webhook using the Persona passthrough tool or `curl`:

```bash
curl -X POST \
  "$SUPABASE_URL/functions/v1/persona-webhook" \
  -H "Content-Type: application/json" \
  -H "persona-signature: v1=$(openssl dgst -sha256 -hmac $PERSONA_WEBHOOK_SECRET payload.json | cut -d' ' -f2)" \
  --data @payload.json
```

4. Trigger the reminder function locally:

```bash
curl -X POST "$SUPABASE_URL/functions/v1/notify-id-verification-expiration"
```

Confirm that new notifications land in `core.notifications` and email deliveries are queued.

## Observability

- **Logs**: Supabase Edge Function logs surface in `supabase logs functions persona-webhook`.
- **Database**: `core.v_id_verification_latest` exposes the current badge status for worker search endpoints.
- **tRPC Admin page**: `IdVerificationAdminPage` now shows live Persona statuses (`persona_status` column) for support teams.

