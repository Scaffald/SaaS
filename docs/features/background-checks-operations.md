# Background Check Operations Guide

Updated: 2025-11-18

This guide explains how the background check payment + NationSearch integration works in SCF-Neue, including consent capture, environment variables, cron/webhook touch points, and how to run the automated tests we added in REQ-88 Task 6.

## 1. System Overview

| Flow | Entry Point | Billing | Notes |
| --- | --- | --- | --- |
| Worker self-service | `BackgroundCheckWizard` (`apps/expo/app/dashboard/profile/background-check`) | Worker pays 100% up-front | Requires consent + Stripe payment before submitting to NationSearch |
| Organization-initiated | `OrganizationBackgroundCheckRequestForm` (`apps/expo/app/office/ats/request`) | Organization pays via Stripe | Workers are invited via NationSearch; org can optionally attach consent metadata if already collected |
| Admin bootstrap | `backgroundChecks.organizationInitiate` tRPC mutation | Platform/organization | Used by compliance team automation; bypasses Stripe but still records status + sends notification |

Key database tables introduced in `095_create_payment_tables.sql`:

- `core.background_checks` – canonical record for each screening
- `core.background_check_consent` – worker consent snapshot (text + signature metadata)
- `core.background_check_documents` / `background_check_access` – document uploads + shared access log
- `core.payment_transactions` – ledger for Stripe intents linked to screenings

## 2. Environment Variables

| Variable | Purpose |
| --- | --- |
| `NATIONSEARCH_API_KEY` / `NATIONSEARCH_API_SECRET` | API creds used by `_shared/nationsearch/client.ts` |
| `NATIONSEARCH_BASE_URL` | Override for local staging or mock endpoints |
| `NATIONSEARCH_CERT_FINGERPRINT` | Enables TLS pinning if provided |
| `STRIPE_API_KEY_SECRET_ID` / `STRIPE_WEBHOOK_SECRET_ID` | Stored in `core.stripe_settings`, accessed via Vault |
| `STRIPE_MOCK_MODE` | When set to `1`, the tRPC router returns an in-memory Stripe stub (used by tests and local dev without real keys) |

> **Tip:** `STRIPE_MOCK_MODE=1` only affects the server-side helper `loadStripeClient`. All other code paths still run, so you can test payment orchestration without touching the real Stripe API.

## 3. Consent Capture

- Workers sign the disclosure inside `ConsentStep.tsx`. The hook serialises this data and sends it to `backgroundChecks.requestCheck` as `consent`.
- The router writes a normalized record into `core.background_check_consent` with:
  - `consent_text`: `"By proceeding you acknowledge …"` (matches the UI copy)
  - `consent_version`: `2024-11-18`
  - Metadata blob containing signature, IP, user agent, and timestamps
- Consent is **required** for worker-paid flows. Organization flows may optionally include a consent payload if they already collected offline documentation.

## 4. NationSearch Integration

1. `backgroundChecks.requestCheck` creates the screening record and Stripe PaymentIntent.
2. After `confirmCheckPayment` succeeds, `submitBackgroundCheckToNationSearch` calls the provider (`initiateCheck`), queues retries during outages, and logs metadata for auditing.
3. The `functions/background-check-webhook` Edge Function accepts status updates from NationSearch, validates signatures, and issues worker/org notifications via `notifyBackgroundCheckStatusChange`.
4. Two cron helpers in `097_success_fee_cron_jobs.sql` (reused here) enqueue:
   - Daily “due final payment” jobs
   - Weekly duration checks (needed when engagements extend beyond their original duration)

## 5. Testing

1. Ensure Supabase local stack is running (`pnpm supa start`).
2. Run the new router test:
   ```bash
   cd packages/supabase
   STRIPE_MOCK_MODE=1 deno test --allow-all tests/routers/background-checks.test.ts
   ```
   The test suite seeds temporary packages, verifies that consent-less requests fail with `BAD_REQUEST`, and asserts that consent rows are persisted correctly.
3. Run `pnpm check` from the repo root after making changes (required for BrainGrid workflows).

If you need to test the UI flow manually, hit the Expo dashboard route `app/dashboard/profile/background-check` (worker) or `app/office/ats/request` (organization). Those screens now refuse to start payment unless consent has been signed.

## 6. Operations Checklist

- [ ] Vault secrets (`core.stripe_settings`) populated via the admin Stripe settings screen (`apps/expo/app/office/settings/stripe`)
- [ ] NationSearch creds + webhook fingerprint set in the functions runtime
- [ ] `background-check-webhook` deployed and reachable from NationSearch (supply the URL + signing secret on provider side)
- [ ] Cron jobs scheduled through Supabase Edge Functions for duration + payment monitoring
- [ ] `STRIPE_MOCK_MODE` disabled (`unset`) in production

With these steps in place, the background check system fully supports card payments, consent logging, NationSearch orchestration, and auditable worker notifications.

