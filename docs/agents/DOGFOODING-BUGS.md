# Dogfooding Bugs

> **Migrated to in-product Tasks (Phase 3.1 + 3.2 done).** The entries
> that used to live here are now Tasks under the **Dogfood Bugs (Open)**
> and **Dogfood Bugs (Fixed)** punchlists in the Unicorn org. Both the
> API and the UI are live.
>
> Browse them in the product:
> [employers/org/unicorn/tasks](http://localhost:8081/employers/org/unicorn/tasks).
>
> Or via the API:
> ```bash
> curl -H "Authorization: Bearer <jwt>" \
>   "http://localhost:54321/functions/v1/api/v1/tasks?organizationId=<unicorn-org-id>&search=RLS"
> ```
>
> Migration: [scripts/migrate-dogfood-md-to-tasks.ts](../../scripts/migrate-dogfood-md-to-tasks.ts).
> Schema: [packages/supabase/migrations/325_tasks_and_punchlists.sql](../../packages/supabase/migrations/325_tasks_and_punchlists.sql).
> UI: [apps/scaffald/app/(protected)/employers/org/[slug]/tasks/index.tsx](../../apps/scaffald/app/(protected)/employers/org/%5Bslug%5D/tasks/index.tsx).
>
> File new bugs as Tasks in the product, not here. This file can be
> deleted entirely once we trust the in-product flow.
