# Dogfooding Bugs

> **Migrated to in-product Tasks.** The entries that used to live here
> are now Tasks under the **Dogfood Bugs (Open)** and **Dogfood Bugs
> (Fixed)** punchlists in the Unicorn org. The API is live; the UI for
> browsing tasks ships in Phase 3.2.
>
> Until the UI lands you can query the API directly, e.g.:
> ```bash
> curl -H "Authorization: Bearer <jwt>" \
>   "http://localhost:54321/functions/v1/api/v1/tasks?organizationId=<unicorn-org-id>&search=RLS"
> ```
>
> Migration: [scripts/migrate-dogfood-md-to-tasks.ts](../../scripts/migrate-dogfood-md-to-tasks.ts).
> Schema: [packages/supabase/migrations/325_tasks_and_punchlists.sql](../../packages/supabase/migrations/325_tasks_and_punchlists.sql).
>
> Going forward: file bugs as Tasks via the API. Once Phase 3.2 ships
> a Tasks UI page, this file can be deleted entirely.
