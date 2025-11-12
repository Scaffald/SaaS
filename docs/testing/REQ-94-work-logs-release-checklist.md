## Work Log System QA Checklist (REQ-94)

This document captures the smoke + deep-dive validation plan for the Work Log System rollout. Run these steps after merging the latest `main` to staging (or a fresh preview branch) and before handing off to Release Management.

---

### 1. Automated Regression Pass

Run the full suite locally (or via CI) to ensure we did not introduce regressions:

```bash
pnpm check                    # lint + format + types
pnpm test:all                 # API + unit + E2E test matrix
pnpm test:work-logs -- --watchAll=false   # targeted work log router coverage
```

> ✅ Expectation: zero failing tests. Any failure blocks release until root-caused and re-run.

---

### 2. API Spot Validation (Postman / Thunder Client / curl)

Use an **office admin** token for admin routes and a **regular worker** token for worker routes. Suggested sequence (ordered by dependency):

1. **Create work log**  
   - `POST /trpc/workLogs.create`  
   - Include multiple time entries, two tasks, one skill reference, and `draft` status.  
   - Validate the response includes `status: draft`, `totalHours`, and seeded tasks.

2. **Upload photos**  
   - `POST /trpc/workLogs.uploadWorkLogPhoto` (multipart)  
   - Confirm storage bucket `work-log-photos` now has `{userId}/{workLogId}/original.*`.

3. **Submit + verify workflow**  
   - `POST /trpc/workLogs.submit` → expect `pending_verification`  
   - `POST /trpc/workLogs.verify` → expect `verified`, audit entry.

4. **Profile visibility toggle**  
   - `POST /trpc/workLogs.updateProfileVisibility` with `showOnProfile = true` and `visibility = "public"`.  
   - Fetch `GET /trpc/workLogs.publicProfileFeed` → verify the log appears with signed photo URLs.

5. **Exports**  
   - `POST /trpc/workLogs.exportWorkLog` with formats `pdf` and `csv`.  
   - Ensure `core.work_log_exports` records were created, signed URL works inside 10 min TTL.

6. **Storage analytics**  
   - `GET /trpc/office.storage.analytics` (admin token only).  
   - Validate totals and top users include the work log created above.

---

### 3. Expo / Web Manual Walkthrough

> Use both **iOS Simulator** (Expo Go) and **Web (localhost:3000)** where possible.

#### Worker Experience
- Dashboard → Work Logs list  
  - Offline indicator (disable network) still shows cached drafts.  
  - Filters reset correctly after change.  
  - Export buttons show toast + download prompt.
- Work Log detail  
  - Time entry cards render start/end times.  
  - Photo gallery allows caption edit, visibility toggle, and delete (with undo toast).  
  - Conversation thread persists messages across refresh.  
  - Collaborator invite requires valid UUID; invalid raises alert.
- Profile → Public preview (`/u/{slug}`)  
  - Verified work log displays under “Verified work history” widget.  
  - Toggling `Show date on profile` hides the date row after refetch.

#### Admin Experience
- Office → Storage Analytics  
  - Summary cards match API totals (sanity spot-check).  
  - Search field filters to the user created in API step.  
  - “Refresh table” button refetches without duplicating rows.  
  - Progress bars re-color to red when usage exceeds limit (manually adjust user limit).
- Office → Work Logs (if feature flag enabled)  
  - Pending + verified counts align with worker submission.  
  - Exports appear in audit trail.

---

### 4. Offline + Sync Edge Cases

1. Record a work log while offline (airplane mode).  
   - Add photos (should be cached locally).  
   - Reconnect → `Sync Now` should push the draft, show success toast, and remove from offline queue.
2. Upload 11th photo (should fail with validation error).  
   - Confirm error text explains the per-entry limit.
3. Photo > 2MB  
   - Compression should kick in; if still >2MB request fails with message.

---

### 5. Data Integrity Checks (Supabase Studio)

- `core.work_logs`  
  - `submitted_at`, `verified_at`, `disputed_at` timestamps align with workflow.
  - `show_on_profile` mirrors UI interactions.
- `core.work_log_audit_log`  
  - Contains `submit`, `verify`, `export_generated`, `photo_added`, `photo_removed` entries.
- `core.work_log_exports`  
  - `expires_at` 10 minutes after creation.  
  - `file_path` cleared via storage removal cron / manual cleanup.
- `core.user_storage_usage`  
  - `total_bytes` increments after photo upload, decrements after deletion.

---

### 6. Rollback / Support Playbook

- Keep `pnpm supa migration:down` ready for new migrations (none added in QA phase).  
- If public profiles accidentally expose logs, run `UPDATE core.work_logs SET visibility='private', show_on_profile=false WHERE visibility='public';` and redeploy feed.  
- Storage analytics router is admin-only; on 500 check Supabase logs for row-level security failures.

---

### Sign-off

| Reviewer | Date | Notes |
|----------|------|-------|
|          |      |       |

> **Reminder**: Attach API scripts + Expo recording to release PR for reference.

