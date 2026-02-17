# Renewal Tracking & Reminders Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build automated policy renewal reminders (90/60/30 days) with escalating severity, configurable org settings, and user notification preferences.

**Architecture:** pg_cron daily scan function queries active policies approaching expiration, creates notifications for broker and client users, tracks sent reminders for dedup/dismiss. A DB trigger on policy updates auto-dismisses stale reminders.

**Tech Stack:** PostgreSQL (pg_cron, plpgsql), Supabase, tRPC, React, SendGrid, Zod

**Design doc:** `docs/plans/2026-02-16-renewal-reminders-design.md`

---

### Task 1: Migration — Schema, Function, Trigger, Cron

**Files:**
- Create: `packages/supabase/migrations/313_renewal_reminders.sql`

**Reference files (read before starting):**
- `packages/supabase/migrations/131_req_221_inquiry_reminders.sql` — the pattern to follow for cron function structure
- `packages/supabase/migrations/209_forsured_create_insurance_policy_parent_child.sql` — insurance_policies table schema
- `packages/supabase/migrations/260_forsured_create_broker_clients.sql` — broker_clients table and RLS pattern
- `packages/supabase/migrations/025_req_89_notifications_expansion.sql` — notification system schema and enum pattern

**Step 1: Write the migration file**

The migration must contain all of the following sections in one file, wrapped in `BEGIN; ... COMMIT;`:

**Section A — Add notification type enum value:**
```sql
DO $$
DECLARE
  value TEXT;
  values_to_add TEXT[] := ARRAY['policy.renewal'];
BEGIN
  FOREACH value IN ARRAY values_to_add LOOP
    BEGIN
      EXECUTE format('ALTER TYPE core.notification_type ADD VALUE IF NOT EXISTS %L', value);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END;
$$;
```

**Section B — Add org settings columns to `core.organizations`:**
```sql
ALTER TABLE core.organizations
  ADD COLUMN IF NOT EXISTS renewal_reminder_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS renewal_reminder_intervals INTEGER[] DEFAULT '{30,60,90}';

COMMENT ON COLUMN core.organizations.renewal_reminder_enabled IS
  'Whether to send automatic renewal reminders for expiring insurance policies';
COMMENT ON COLUMN core.organizations.renewal_reminder_intervals IS
  'Array of day thresholds before expiration to send reminders (e.g. {30,60,90})';

-- Constraint: each interval must be 1-365
ALTER TABLE core.organizations
  DROP CONSTRAINT IF EXISTS organizations_renewal_reminder_intervals_check;
ALTER TABLE core.organizations
  ADD CONSTRAINT organizations_renewal_reminder_intervals_check
  CHECK (
    renewal_reminder_intervals IS NULL
    OR (
      array_length(renewal_reminder_intervals, 1) > 0
      AND renewal_reminder_intervals <@ (SELECT array_agg(i) FROM generate_series(1, 365) AS i)
    )
  );
```

**Section C — Create `forsured.renewal_reminders` table:**

Columns per design doc section 1.2. Include:
- All columns from the design (id, policy_id, organization_id, user_id, interval_days, notification_id, sent_at, dismissed_at, created_at)
- Foreign keys: policy_id → forsured.insurance_policies ON DELETE CASCADE, organization_id → core.organizations ON DELETE CASCADE, user_id → core.users ON DELETE CASCADE, notification_id → core.notifications ON DELETE SET NULL
- Partial unique index: `(policy_id, interval_days, user_id) WHERE dismissed_at IS NULL`
- Index on `(policy_id)` for bulk dismiss
- Index on `(organization_id)` for org-scoped queries

RLS policies — follow the `broker_clients` pattern (migration 260):
- Authenticated users can SELECT where `organization_id` is in their `role_assignments.scope_org_id`
- Service role gets full access
- GRANT SELECT to authenticated, ALL to service_role

**Section D — Create `forsured.send_renewal_reminders()` function:**

Follow the exact structure of `core.send_inquiry_reminders()` from migration 131. Key differences:

- `SECURITY DEFINER`, `SET search_path = forsured, core, public`
- Outer query: join `forsured.insurance_policies ip` with `core.organizations o` on `ip.organization_id = o.id`
  - WHERE `ip.status = 'active'` AND `o.renewal_reminder_enabled = true` AND `ip.expiration_date IS NOT NULL`
- For each org's configured intervals, check if `ip.expiration_date - CURRENT_DATE` equals any value in `o.renewal_reminder_intervals`
  - Use `UNNEST(o.renewal_reminder_intervals)` to get each interval value
  - Match where `ip.expiration_date = CURRENT_DATE + interval_value`
- For each matching (policy, interval) pair, find recipients:
  - Client users: `SELECT DISTINCT ra.user_id FROM core.role_assignments ra WHERE ra.scope_org_id = ip.organization_id`
  - Broker users: `SELECT DISTINCT ra.user_id FROM core.role_assignments ra JOIN forsured.broker_clients bc ON ra.scope_org_id = bc.broker_org_id WHERE bc.client_org_id = ip.organization_id AND bc.status = 'active' AND bc.deleted_at IS NULL`
- For each recipient:
  - Check dedup: skip if `forsured.renewal_reminders` has a row for `(policy_id, interval_days, user_id)` WHERE `dismissed_at IS NULL`
  - Check user preferences: skip if `core.notification_preferences` has `global_enabled = false` or `type_overrides->>'policy.renewal'` is explicitly disabled
  - Determine severity: use a CASE on interval_days — values <= 30 → `'critical'::core.notification_severity`, <= 60 → `'important'`, else → `'info'`
  - Determine recipient_role: `'broker'` if user came from broker query, `'client'` if from client query
  - Get org name: `SELECT name FROM core.organizations WHERE id = ip.organization_id`
  - INSERT into `core.notifications` with:
    - `user_id`: recipient
    - `type`: `'policy.renewal'`
    - `severity`: computed above
    - `title`: varies by severity (see design doc section 5)
    - `message`: varies by recipient_role (broker vs client perspective, see design doc)
    - `preview`: same as message
    - `cta_label`: `'View Policy'`
    - `cta_url`: `'/policies/' || ip.id`
    - `body`: `jsonb_build_object('policy_id', ip.id, 'policy_number', ip.policy_number, 'policy_type', ip.policy_type, 'carrier_name', ip.carrier_name, 'expiration_date', ip.expiration_date, 'company_name', org_name)`
    - `metadata`: `jsonb_build_object('policy_id', ip.id, 'organization_id', ip.organization_id, 'interval_days', interval_value, 'recipient_role', recipient_role)`
    - `dedupe_key`: `'renewal:' || ip.id || ':' || interval_value || ':' || recipient_user_id`
    - `routed_channels`: `ARRAY['in_app', 'email']::core.notification_channel[]`
  - INSERT tracking row into `forsured.renewal_reminders` with the notification_id from RETURNING
- Error handling: per-row try/catch like inquiry reminders, overall exception logs to `core.cron_execution_log` with job_name `'send-renewal-reminders'`
- Return JSONB: `{success, processed, errors, error_details, executed_at}`

**Section E — Create trigger function `forsured.handle_policy_renewal_update()`:**

```sql
CREATE OR REPLACE FUNCTION forsured.handle_policy_renewal_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = forsured, core, public
AS $$
BEGIN
  -- Only act if expiration_date changed or status changed to cancelled/expired
  IF (OLD.expiration_date IS DISTINCT FROM NEW.expiration_date)
     OR (OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('cancelled', 'expired'))
  THEN
    -- Dismiss all pending renewal reminders for this policy
    UPDATE forsured.renewal_reminders
    SET dismissed_at = NOW()
    WHERE policy_id = OLD.id
      AND dismissed_at IS NULL;

    -- Archive the linked notifications
    UPDATE core.notifications
    SET archived_at = NOW()
    WHERE id IN (
      SELECT notification_id
      FROM forsured.renewal_reminders
      WHERE policy_id = OLD.id
        AND notification_id IS NOT NULL
        AND dismissed_at IS NOT NULL
        AND dismissed_at >= NOW() - INTERVAL '1 second'
    )
    AND archived_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$;
```

Create the trigger:
```sql
DROP TRIGGER IF EXISTS trg_policy_renewal_reminder_update ON forsured.insurance_policies;
CREATE TRIGGER trg_policy_renewal_reminder_update
  AFTER UPDATE ON forsured.insurance_policies
  FOR EACH ROW
  EXECUTE FUNCTION forsured.handle_policy_renewal_update();
```

**Section F — Schedule cron job:**

Follow the pattern from migration 131:
```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron'
  ) THEN
    RAISE NOTICE 'pg_cron extension not available; skipping schedule.';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-renewal-reminders') THEN
    PERFORM cron.unschedule('send-renewal-reminders');
  END IF;

  PERFORM cron.schedule(
    'send-renewal-reminders',
    '0 9 * * *',
    'SELECT forsured.send_renewal_reminders();'
  );
END;
$$;
```

**Step 2: Review the migration**

Read the file back. Verify:
- All FKs reference correct tables
- RLS policies match broker_clients pattern
- Function handles both broker and client recipients
- Trigger fires only on expiration_date or status changes
- Cron uses forsured schema, not core

**Step 3: Commit**

```bash
git add packages/supabase/migrations/313_renewal_reminders.sql
git commit -m "feat: add renewal reminders migration (schema, function, trigger, cron)"
```

---

### Task 2: tRPC — Org Renewal Settings Mutation

**Files:**
- Modify: `apps/forsured-web/src/server/api/routers/organization.ts`
- Create: `packages/supabase/tests/routers/organization-renewal-settings.test.ts`

**Reference files (read before starting):**
- `apps/forsured-web/src/server/api/routers/organization.ts` — existing router to extend
- `apps/forsured-web/src/server/api/routers/notification.ts` — mutation pattern reference
- `packages/supabase/tests/routers/notifications.test.ts` — test pattern reference

**Step 1: Write the failing test**

Create `packages/supabase/tests/routers/organization-renewal-settings.test.ts`:

Test cases:
1. `getRenewalSettings` returns current org renewal settings (enabled flag + intervals)
2. `updateRenewalSettings` updates enabled flag
3. `updateRenewalSettings` updates intervals array
4. `updateRenewalSettings` rejects intervals outside 1-365 range
5. `updateRenewalSettings` rejects empty intervals array
6. `updateRenewalSettings` requires org membership (FORBIDDEN for wrong org)

Follow the Deno test pattern from `notifications.test.ts`:
- Use `callTRPCEndpoint()` helper
- Use `requireAuthSetup()` and `loadCachedTokens()`
- Test with `sanitizeResources: false, sanitizeOps: false`

**Step 2: Run tests to verify they fail**

```bash
cd packages/supabase && deno test tests/routers/organization-renewal-settings.test.ts --allow-all
```

Expected: FAIL — procedures don't exist yet.

**Step 3: Implement the mutations**

Add to `organizationRouter` in `apps/forsured-web/src/server/api/routers/organization.ts`:

```typescript
getRenewalSettings: protectedProcedure
  .input(z.object({
    organizationId: z.string().uuid(),
  }))
  .query(async ({ ctx, input }) => {
    verifyOrganizationAccess(ctx.organizationId, input.organizationId);

    const { data, error } = await forsured('organizations')
      .select('renewal_reminder_enabled, renewal_reminder_intervals')
      .eq('id', input.organizationId)
      .single();

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch renewal settings',
        cause: error,
      });
    }

    return {
      enabled: data.renewal_reminder_enabled ?? true,
      intervals: data.renewal_reminder_intervals ?? [30, 60, 90],
    };
  }),

updateRenewalSettings: protectedProcedure
  .input(z.object({
    organizationId: z.string().uuid(),
    enabled: z.boolean().optional(),
    intervals: z.array(z.number().int().min(1).max(365)).min(1).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    verifyOrganizationAccess(ctx.organizationId, input.organizationId);

    const updates: Record<string, unknown> = {};
    if (input.enabled !== undefined) updates.renewal_reminder_enabled = input.enabled;
    if (input.intervals !== undefined) updates.renewal_reminder_intervals = input.intervals;

    if (Object.keys(updates).length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'At least one setting must be provided',
      });
    }

    const { data, error } = await forsured('organizations')
      .update(updates)
      .eq('id', input.organizationId)
      .select('renewal_reminder_enabled, renewal_reminder_intervals')
      .single();

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update renewal settings',
        cause: error,
      });
    }

    return {
      enabled: data.renewal_reminder_enabled,
      intervals: data.renewal_reminder_intervals,
    };
  }),
```

**Step 4: Run tests to verify they pass**

```bash
cd packages/supabase && deno test tests/routers/organization-renewal-settings.test.ts --allow-all
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/forsured-web/src/server/api/routers/organization.ts packages/supabase/tests/routers/organization-renewal-settings.test.ts
git commit -m "feat: add tRPC mutations for org renewal reminder settings"
```

---

### Task 3: UI — Org Renewal Settings Section

**Files:**
- Modify: `packages/scf-core/features/organizations/components/OrganizationSettingsPanel.tsx`
- Modify: `packages/scf-core/features/organizations/api.ts` (add hook for new endpoints)

**Reference files (read before starting):**
- `packages/scf-core/features/organizations/components/OrganizationSettingsPanel.tsx` — where to add the section
- `packages/scf-core/features/organizations/api.ts` — existing API hooks pattern
- `apps/forsured-web/src/pages/gc/settings/NotificationSettings.tsx` — toggle + form pattern

**Step 1: Add API hooks**

In `packages/scf-core/features/organizations/api.ts`, add:

```typescript
export const useRenewalSettings = (organizationId: string) =>
  api.organization.getRenewalSettings.useQuery(
    { organizationId },
    { enabled: Boolean(organizationId) }
  );

export const useUpdateRenewalSettings = () =>
  api.organization.updateRenewalSettings.useMutation();
```

**Step 2: Add renewal settings section to OrganizationSettingsPanel**

Add a "Renewal Reminders" section with:
- A toggle switch for `renewal_reminder_enabled`
- A chip/tag input for intervals — display current values as removable chips, input to add new values (1-365)
- Save button that calls `useUpdateRenewalSettings`
- Loading state while fetching
- Toast on success/error (follow existing toast pattern)

Use existing UI components from `@unicornlove/beyond-ui` — `Stack`, `Button`, `Switch`/toggle, etc.

**Step 3: Verify manually**

Start the dev server and navigate to org settings. Verify the renewal reminders section appears with toggle and interval inputs.

**Step 4: Commit**

```bash
git add packages/scf-core/features/organizations/components/OrganizationSettingsPanel.tsx packages/scf-core/features/organizations/api.ts
git commit -m "feat: add renewal reminder settings to org settings panel"
```

---

### Task 4: UI — User Notification Preferences for Policy Renewal

**Files:**
- Modify: `apps/forsured-web/src/pages/gc/settings/NotificationSettings.tsx`

**Reference files (read before starting):**
- `apps/forsured-web/src/pages/gc/settings/NotificationSettings.tsx` — the file to modify

**Step 1: Add the Policy Renewal preference row**

Add a new entry to `defaultPreferences`:

```typescript
{ id: '18', name: 'Policy Renewal Reminders', category: 'Insurance', email: true, mobile: false, inbox: true, browser: false },
```

This adds a "Policy Renewal Reminders" row under a new "Insurance" category in the notification preferences table. The `SettingsNotificationTable` component groups by category automatically.

**Step 2: Verify the preference maps to `type_overrides`**

Check how `handleSubmit` converts preferences to the stored format. The `type_overrides` JSONB key should be `policy.renewal`. If the current `updateUserSettings` call doesn't map preference IDs to notification type keys, add that mapping:

```typescript
const preferenceTypeMap: Record<string, string> = {
  '18': 'policy.renewal',
  // ... other mappings as needed
};
```

Ensure that when saving, the `type_overrides` JSONB in `core.notification_preferences` gets updated with the correct channels for `policy.renewal`.

**Step 3: Verify manually**

Navigate to user notification settings. Verify "Insurance" category appears with "Policy Renewal Reminders" row and email/inbox toggles.

**Step 4: Commit**

```bash
git add apps/forsured-web/src/pages/gc/settings/NotificationSettings.tsx
git commit -m "feat: add policy renewal preference to user notification settings"
```

---

### Task 5: Integration Test — Renewal Reminder Cron Function

**Files:**
- Create: `packages/supabase/tests/functions/renewal-reminders.test.ts`

**Reference files (read before starting):**
- `packages/supabase/tests/routers/notifications.test.ts` — test helper patterns
- `packages/supabase/migrations/313_renewal_reminders.sql` — the function being tested

**Step 1: Write integration tests**

Test cases for `forsured.send_renewal_reminders()`:

1. **Creates notification at 90-day threshold** — insert a policy with `expiration_date = CURRENT_DATE + 90`, call the function, verify notification created with severity `info`
2. **Creates notification at 60-day threshold** — severity `important`
3. **Creates notification at 30-day threshold** — severity `critical`
4. **Skips policies not at threshold** — policy expiring in 45 days gets no notification
5. **Skips disabled orgs** — org with `renewal_reminder_enabled = false` gets no notification
6. **Skips already-sent reminders (dedup)** — insert a `renewal_reminders` row first, verify no duplicate
7. **Notifies both broker and client users** — set up broker_clients relationship, verify both get notifications
8. **Respects custom intervals** — org with `renewal_reminder_intervals = {14,45}`, policy at 45 days gets notification
9. **Respects user notification preferences** — user with `policy.renewal` disabled in `type_overrides` gets skipped
10. **Returns correct JSONB summary** — verify processed count and success flag

Each test should:
- Set up test data (org, users, role_assignments, policies, broker_clients) using direct SQL via the Supabase client
- Call `SELECT forsured.send_renewal_reminders()` via RPC
- Query `core.notifications` and `forsured.renewal_reminders` to verify results
- Clean up test data after each test

**Step 2: Run tests to verify they fail**

```bash
cd packages/supabase && deno test tests/functions/renewal-reminders.test.ts --allow-all
```

Expected: FAIL if migration hasn't been applied, or tests should exercise the function.

**Step 3: Fix any issues found**

If tests reveal bugs in the migration SQL, fix the migration and re-run.

**Step 4: Commit**

```bash
git add packages/supabase/tests/functions/renewal-reminders.test.ts
git commit -m "test: add integration tests for renewal reminder cron function"
```

---

### Task 6: Integration Test — Policy Update Trigger

**Files:**
- Create: `packages/supabase/tests/functions/renewal-trigger.test.ts`

**Step 1: Write integration tests**

Test cases for `forsured.handle_policy_renewal_update()`:

1. **Dismisses reminders when expiration_date changes** — create policy, create renewal_reminders rows, update expiration_date, verify `dismissed_at` is set
2. **Archives linked notifications** — verify `core.notifications.archived_at` is set for dismissed reminders
3. **Dismisses reminders when status changes to cancelled** — same dismiss behavior
4. **Dismisses reminders when status changes to expired** — same dismiss behavior
5. **Does NOT dismiss when other columns change** — update `carrier_name`, verify reminders untouched
6. **Handles policy with no pending reminders** — update expiration_date on policy with no reminders, no error

**Step 2: Run and verify**

```bash
cd packages/supabase && deno test tests/functions/renewal-trigger.test.ts --allow-all
```

**Step 3: Commit**

```bash
git add packages/supabase/tests/functions/renewal-trigger.test.ts
git commit -m "test: add integration tests for policy renewal update trigger"
```

---

### Task 7: Email Template Content

**Files:**
- Modify: `packages/supabase/functions/_shared/notifications/adapters/email.ts`

**Reference files (read before starting):**
- `packages/supabase/functions/_shared/notifications/adapters/email.ts` — existing email adapter
- `packages/supabase/functions/_shared/notifications/types.ts` — notification types

**Step 1: Add renewal-specific email content**

In the email adapter, add handling for `policy.renewal` notification type. When the notification type is `policy.renewal`, construct the email with:

- Subject line: varies by severity (see design doc section 5 table)
- Body: uses `metadata.recipient_role` to determine broker vs client perspective
- CTA button text: "View Policy"
- Dynamic template data should include: `policy_number`, `policy_type`, `carrier_name`, `expiration_date`, `company_name`, `days_until_expiration` (from `interval_days`)

If the email adapter uses a generic template, ensure the `dynamic_template_data` includes all necessary fields. If it uses SendGrid dynamic templates, document which template ID is needed (to be created in SendGrid dashboard separately).

**Step 2: Commit**

```bash
git add packages/supabase/functions/_shared/notifications/adapters/email.ts
git commit -m "feat: add renewal reminder email content to notification adapter"
```

---

### Task 8: Final Verification

**Step 1: Run all tests**

```bash
cd packages/supabase && deno test tests/ --allow-all
```

Verify all existing tests still pass plus the new renewal tests.

**Step 2: Review all changes**

```bash
git diff main --stat
git log main..HEAD --oneline
```

Verify:
- Migration file is complete and well-structured
- tRPC mutations have proper auth checks
- UI changes slot into existing patterns
- Tests cover happy path and edge cases
- No TODO/placeholder code left behind

**Step 3: Final commit if any cleanup needed**

```bash
git add -A && git commit -m "chore: final cleanup for renewal reminders feature"
```
