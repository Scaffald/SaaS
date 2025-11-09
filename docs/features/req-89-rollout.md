# REQ-89 · Deployment & Rollout Checklist

This checklist summarizes the steps required to deploy the multi-channel notification system into staging and production environments. Use it alongside `docs/features/req-89-environment.md` when preparing infrastructure.

## 1. Pre-flight

- [ ] Ensure all migrations up to `025_req_89_notifications_expansion.sql` have been applied (`pnpm supa db push`).
- [ ] Set database GUCs for cron: `app.supabase_url` and `app.service_role_key`.
- [ ] Provision provider credentials (SendGrid, Twilio, Expo) and populate Supabase secrets (`pnpm supa secrets set ...`).
- [ ] Confirm pg_cron extension is enabled on the target database.

## 2. Deploy Code

1. Merge code changes and trigger the CI pipeline.
2. Run validation locally prior to deployment:
   ```bash
   pnpm check
   pnpm build
   deno test --allow-all packages/supabase/functions/trpc/__tests__/notifications-preferences.test.ts
   ```
3. Promote build to staging, then production.

## 3. Post-Deployment Validation

- [ ] Visit `/dashboard/notifications` and verify:
  - Preference toggles persist.
  - Digest frequency updates save successfully.
  - Delivery table loads without errors.
- [ ] Visit `/office/notifications` as an office admin and confirm:
  - Delivery queue populates (even if empty).
  - Digest backlog table renders.
- [ ] Trigger a synthetic notification via `notify-publish` (use `pnpm supa functions invoke notify-publish --body '{...}'`). Ensure email/SMS/push reach test devices.
- [ ] Confirm device registration by checking `core.notification_devices` for recent `last_seen_at` values.

## 4. Operational Checklist

- Cron jobs registered in migration `025`:
  - `notifications-send-worker` – every minute
  - `notifications-check-receipts` – every 15 minutes
  - `notifications-digest-daily` – 07:00 UTC daily
  - `notifications-digest-weekly` – Monday 08:00 UTC
- Query `select * from cron.job order by jobname;` to verify active schedules.
- Monitor SendGrid activity feed and Twilio delivery logs during rollout.
- Add dashboards/alerts:
  - Queue depth > 1000 (critical)
  - Delivery failure rate > 2%
  - Expo push receipt errors

## 5. Rollback Plan

1. Disable cron jobs if a systemic issue occurs:
   ```sql
   select cron.unschedule('notifications-send-worker');
   select cron.unschedule('notifications-check-receipts');
   ```
2. Revert secrets for providers (e.g., swap API keys) if compromised.
3. Roll back migration `025` if schema change causes regressions (noting data loss implications).

## 6. Hand-off Notes

- `docs/features/req-89-environment.md` contains all secret names and curl examples for provider verification.
- New Deno regression test: `notifications-preferences.test.ts` exercises preference persistence. Include it in pre-release smoke runs.
- A production runbook entry should include instructions for re-registering push tokens if Expo credentials rotate.
