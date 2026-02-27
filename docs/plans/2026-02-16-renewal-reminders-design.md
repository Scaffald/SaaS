# Renewal Tracking & Reminders — Design

**Date:** 2026-02-16
**Status:** Approved
**Approach:** pg_cron daily scan (Approach A) following the inquiry reminder pattern

## Problem

Brokers have no automated system to track upcoming policy renewals. They must manually monitor expiration dates across all clients, risking missed renewals.

## Requirements

- Automated reminders at configurable intervals (default 30/60/90 days before expiration)
- Both brokers and clients receive reminders, each controlling their own notification preferences
- In-app + email delivery channels
- Escalating severity: 90d = info, 60d = important, 30d = critical
- Auto-dismiss reminders when a policy record is updated (new expiration date or status change)
- Org admins configure intervals and enable/disable; users control their own channel preferences
- When `expiration_date` changes on a policy, recalculate renewal reminders

## Out of Scope

- AI document matching that triggers policy record updates (separate feature)
- The policy detail page itself
- SMS/push notification channels (future enhancement)

---

## 1. Database Schema

### 1.1 New notification type

Add `policy.renewal` to the `core.notification_type` enum.

### 1.2 New table: `forsured.renewal_reminders`

Tracks which reminders have been sent to prevent duplicates and support auto-dismiss.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | `gen_random_uuid()` |
| `policy_id` | UUID FK | → `forsured.insurance_policies(id)` ON DELETE CASCADE |
| `organization_id` | UUID FK | → `core.organizations(id)` ON DELETE CASCADE |
| `user_id` | UUID FK | → `core.users(id)` ON DELETE CASCADE |
| `interval_days` | INTEGER | Which threshold triggered this (e.g. 90, 60, 30) |
| `notification_id` | UUID FK | → `core.notifications(id)` ON DELETE SET NULL |
| `sent_at` | TIMESTAMPTZ | When the reminder was sent |
| `dismissed_at` | TIMESTAMPTZ | NULL until auto-dismissed on renewal |
| `created_at` | TIMESTAMPTZ | Default `NOW()` |

**Indexes:**
- `(policy_id, interval_days, user_id)` UNIQUE WHERE `dismissed_at IS NULL` — dedup check
- `(policy_id)` — bulk dismiss on renewal

**RLS:** Same pattern as `broker_clients` — users see reminders for policies in their org; service_role has full access.

### 1.3 Org-level settings

Add columns to `core.organizations`:

| Column | Type | Default | Constraint |
|--------|------|---------|------------|
| `renewal_reminder_enabled` | BOOLEAN | `true` | |
| `renewal_reminder_intervals` | INTEGER[] | `{30,60,90}` | Each value 1-365 |

### 1.4 User-level preferences

No schema change. Use existing `core.notification_preferences.type_overrides` JSONB with key `policy.renewal` for per-user channel control.

---

## 2. pg_cron Function: `forsured.send_renewal_reminders()`

Follows the exact pattern from `core.send_inquiry_reminders()` (migration 131).

### Execution

- Scheduled daily at 9 AM via pg_cron
- `SECURITY DEFINER`, `search_path = forsured, core, public`
- Returns JSONB summary: `{success, processed, errors, error_details, executed_at}`

### Logic

1. Query `forsured.insurance_policies` where:
   - `status = 'active'`
   - `expiration_date` falls within any of the org's configured intervals
   - Org has `renewal_reminder_enabled = true`

2. For each matching (policy, interval) pair:
   - Skip if `forsured.renewal_reminders` already has a non-dismissed row for `(policy_id, interval_days, user_id)`
   - Determine severity: 90d = `info`, 60d = `important`, 30d = `critical`
   - Determine recipients:
     - **Broker users:** users with `role_assignments` in broker orgs linked via `forsured.broker_clients` (where `client_org_id = policy.organization_id`)
     - **Client users:** users with `role_assignments` in `policy.organization_id`
   - For each recipient, check `core.notification_preferences` — skip if `policy.renewal` is disabled
   - Insert `core.notifications` with:
     - `type`: `policy.renewal`
     - `severity`: based on interval
     - `dedupe_key`: `renewal:{policy_id}:{interval_days}:{user_id}`
     - `metadata`: `{policy_id, organization_id, interval_days, recipient_role: "broker"|"client"}`
     - `body`: `{policy_number, policy_type, carrier_name, expiration_date, company_name}`
     - `cta_label`: `"View Policy"`
     - `cta_url`: `/policies/{policy_id}`
   - Insert tracking row into `forsured.renewal_reminders`

3. Log errors per-row, return summary. On overall failure, log to `core.cron_execution_log`.

---

## 3. Policy Update Trigger

### Trigger: `forsured.trg_policy_renewal_reminder_update`

AFTER UPDATE on `forsured.insurance_policies`, fires when `expiration_date` or `status` changes.

### When `expiration_date` changes:

1. `UPDATE forsured.renewal_reminders SET dismissed_at = NOW() WHERE policy_id = OLD.id AND dismissed_at IS NULL`
2. `UPDATE core.notifications SET archived_at = NOW() WHERE id IN (SELECT notification_id FROM forsured.renewal_reminders WHERE policy_id = OLD.id AND dismissed_at = NOW())`
3. New reminders for updated expiration date are discovered by next daily cron run

### When `status` changes to `cancelled` or `expired`:

1. Same dismiss logic — archive all pending reminders

### Not triggered on:

- INSERT (cron discovers new policies naturally)
- Other column updates (only `expiration_date` and `status` matter)

---

## 4. Settings UI

### 4.1 Org-level settings (admin only)

Added to existing organization settings page:

- **"Renewal Reminders" toggle** — maps to `renewal_reminder_enabled`
- **"Reminder intervals" input** — chip/tag input for day thresholds, default {30, 60, 90}, allowed range 1-365
- Uses existing org settings tRPC router — add update mutation for new columns

### 4.2 User-level preferences

Added to existing notification preferences in user profile:

- **"Policy Renewal" row** in notification type list with in-app and email channel toggles
- Maps to `core.notification_preferences.type_overrides` key `policy.renewal`
- No new tRPC endpoints — existing `notification_preferences` update mutation handles it

---

## 5. Email Content

Uses existing SendGrid integration (`sendTemplatedEmail()`).

### Templates by interval

| Interval | Severity | Subject Line | Tone |
|----------|----------|-------------|------|
| 90 days | info | "Policy renewal upcoming: {policy_number}" | Informational |
| 60 days | important | "Policy renewal in 60 days: {policy_number}" | Action-oriented |
| 30 days | critical | "Urgent: Policy {policy_number} expires in 30 days" | Urgent |

### Email body

- Client/organization name
- Policy number, type, carrier
- Expiration date
- CTA button: "View Policy" → policy detail page

### Perspective

- **Broker email:** "Your client {company_name}'s {policy_type} policy with {carrier_name}..."
- **Client email:** "Your {policy_type} policy with {carrier_name}..."
- Determined by `recipient_role` field in notification metadata

---

## 6. Key Patterns Followed

| Pattern | Source | How we follow it |
|---------|--------|-----------------|
| Cron reminder function | Migration 131 (`send_inquiry_reminders`) | Same structure, JSONB return, error handling |
| Org settings columns | `inquiry_reminder_enabled/days` | Same column pattern on `core.organizations` |
| Notification creation | Migration 025 notification system | Same table, types, severity, dedupe_key |
| RLS policies | Migration 260 (`broker_clients`) | Same org-scoped access pattern |
| Trigger pattern | Migration 209 (`update_updated_at`) | Same AFTER UPDATE trigger style |
