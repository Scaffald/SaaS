# ATS Schema Design Document

## Overview
This document describes the schema extensions required to deliver Scaffald's Applicant Tracking System (ATS). It builds on the existing `jobs`, `applications`, and organization management tables to support configurable hiring pipelines, richer candidate-job relationships, and stage analytics while remaining compatible with Supabase/Postgres.

## Goals
- Support multiple hiring pipelines per employer/organization.
- Track applications as they progress through ordered pipeline stages with full history.
- Represent non-application candidate/job relationships (e.g., sourced, referral).
- Provide a seed dataset for local development.
- Maintain Supabase compatibility, scalability, and strong RLS guarantees.

## New Tables & Columns

### `public.pipelines`
Stores named hiring pipelines owned by an organization.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key (`gen_random_uuid()`). |
| `organization_id` | `uuid` | FK to `public.organizations(id)` (cascade on delete). |
| `name` | `text` | Pipeline display name. |
| `description` | `text` | Optional summary. |
| `is_default` | `boolean` | Per-organization default flag. |
| `created_at`/`updated_at` | `timestamptz` | Audit timestamps. |

**Indexes**
- `pipelines_org_default_idx` on `(organization_id, is_default)` for default lookups.
- `pipelines_org_name_key` unique on `(organization_id, name)` for UX consistency.

**RLS**
- Enabled with policies mirroring organization-role checks used by `jobs`. Organization admins/managers can manage pipelines; members with access to related jobs can read them.

### `public.pipeline_stages`
Ordered stages belonging to a pipeline.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `pipeline_id` | `uuid` | FK to `public.pipelines(id)` (cascade). |
| `name` | `text` | Stage label (e.g., `Interview`). |
| `description` | `text` | Optional. |
| `stage_order` | `integer` | 1-based position within pipeline. |
| `color` | `text` | Hex color for UI. |
| `sla_days` | `integer` | Optional SLA for analytics. |
| `created_at`/`updated_at` | `timestamptz` | Audit fields. |

**Constraints & Indexes**
- `unique (pipeline_id, stage_order)` enforces deterministic ordering.
- `unique (pipeline_id, lower(name))` prevents duplicates ignoring case.
- `pipeline_stages_pipeline_order_idx` on `(pipeline_id, stage_order)` accelerates pipeline loads.

**RLS**
- Shares pipeline policies; any user allowed to read the pipeline can read stages. Only organization admins/managers edit.

### `public.job_pipelines`
Maps jobs to pipelines.

| Column | Type | Notes |
| --- | --- | --- |
| `job_id` | `uuid` | FK to `public.jobs(id)` (cascade). |
| `pipeline_id` | `uuid` | FK to `public.pipelines(id)` (cascade). |
| `assigned_by` | `uuid` | FK to `public.users(id)` (set null on delete). |
| `created_at` | `timestamptz` | Assignment timestamp. |

**Constraints & Indexes**
- Primary key on `(job_id, pipeline_id)` so jobs may reference multiple pipelines if needed.
- Partial index `job_pipelines_primary_idx` supporting job-specific fetches.

**RLS**
- Align with `jobs`: organization admins/managers can modify; job viewers can read.

### `public.candidate_job_links`
Stores non-application relationships between a user and a job.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `job_id` | `uuid` | FK to `public.jobs(id)` (cascade). |
| `user_id` | `uuid` | FK to `public.users(id)` (cascade). |
| `relationship_type` | `text` | Enum-like text (`'sourced'`, `'referral'`, `'talent_pool'`, `'reengage'`). |
| `source` | `text` | Optional origin descriptor. |
| `notes` | `text` | Internal note. |
| `created_by` | `uuid` | FK to `public.users(id)` (set null on delete). |
| `created_at`/`updated_at` | `timestamptz` | Audit timestamps. |

**Constraints & Indexes**
- `unique (job_id, user_id, relationship_type)` to prevent duplicates.
- Indexes on `(job_id, relationship_type)` and `(user_id, relationship_type)` for filtering.

**RLS**
- Use same policy as `applications` allowing organization admins/managers access; individual users can see their own relationships where relevant.

### Application Extensions

Add the following columns to `public.applications`:
- `pipeline_id uuid` referencing `public.pipelines(id)` (set null on delete).
- `pipeline_stage_id uuid` referencing `public.pipeline_stages(id)` (set null on delete).
- `stage_entered_at timestamptz` default `now()`.

Add new history table:

#### `public.application_stage_history`
| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `application_id` | `uuid` | FK to `public.applications(id)` (cascade). |
| `from_stage_id` | `uuid` | Nullable FK to `public.pipeline_stages(id)` (set null). |
| `to_stage_id` | `uuid` | FK to `public.pipeline_stages(id)` (set null). |
| `changed_by` | `uuid` | FK to `public.users(id)` (set null). |
| `reason` | `text` | Optional transition reason. |
| `notes` | `text` | Optional timeline note. |
| `created_at` | `timestamptz` | Transition timestamp (`default now()`). |

**Indexes**
- `application_stage_history_app_idx` on `(application_id, created_at desc)`.

**Compatibility Strategy**
- Existing `status` column remains. Triggers (to be implemented in application code) will keep `status` synchronized with stage assignments during migration.

## Seed Plan
Seed data lives in `packages/supabase/seed.sql` within the existing transaction. The plan seeds:
1. Two pipelines per sample organization (`Default Hiring`, `Skilled Trades`).
2. Stage sets for each pipeline (`Applied`, `Screen`, `Interview`, `Offer`, `Hired`, `Rejected`).
3. Job assignments mapping existing seeded jobs to pipelines (default for most jobs, alternate for at least one per org).
4. Candidate-job links representing sourced, referral, and talent-pool relationships.
5. Applications updated to reference the new pipeline/stage columns.
6. Stage history events for each application to power UI timelines.

Seed inserts use deterministic UUIDs for idempotency and `on conflict do nothing` where appropriate.

## Migration Order
1. **Create Pipelines & Stages** – tables plus RLS/indexes.
2. **Create Candidate Job Links** – relationship table and policies.
3. **Extend Applications** – add pipeline columns and history table, indexes, RLS adjustments.
4. **Backfill** – application status backfill scripts (outside this doc) align legacy data.

Each migration wraps statements in `begin; … commit;` to remain transactional under Supabase migrations.

## Indexing Strategy Summary
- Pipelines: `(organization_id, is_default)`.
- Pipeline Stages: `(pipeline_id, stage_order)` and uniqueness on `(pipeline_id, lower(name))`.
- Job Pipelines: `(job_id, pipeline_id)` primary key.
- Candidate Job Links: `(job_id, relationship_type)` and `(user_id, relationship_type)`.
- Applications: indexes on new `pipeline_stage_id` plus existing `organization_id/status` composite.
- Application Stage History: `(application_id, created_at desc)`.

## RLS Patterns
- Pipelines, stages, job pipelines, candidate job links, and application history all enable RLS.
- Policies grant `authenticated` users access when they own the organization, hold manager/admin roles via `public.role_assignments`, or are the applicant themselves (where relevant).
- Mutations restricted to organization admins/managers; candidates retain read-only access to their own records.

## Supabase Compatibility Notes
- Only use extensions already enabled (`pgcrypto`, `citext`, `postgis`, `pg_trgm`).
- All UUIDs generated with `gen_random_uuid()` to avoid reliance on sequential IDs.
- Avoid triggers relying on untrusted languages; leverage SQL/PLPGSQL only.
- Maintain `search_path = public` within RLS policies.

## Rollout Checklist
1. Merge migrations and seed updates.
2. Run `pnpm supa:migration:up` locally to verify.
3. Execute `pnpm supa:reset` to ensure seeds succeed.
4. Regenerate TypeScript types (`pnpm supa:generate`).
5. Deploy migrations to staging (`pnpm deploy`) and backfill data.
6. Gradually switch application logic to rely on pipeline stages; remove legacy status once stable.

