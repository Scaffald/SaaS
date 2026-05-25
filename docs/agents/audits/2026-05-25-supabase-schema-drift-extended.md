# Supabase schema-drift audit (extended) — 2026-05-25

> Supersedes [2026-05-24-supabase-schema-drift-v1.5.0.md](./2026-05-24-supabase-schema-drift-v1.5.0.md), which only scanned `public` + `core`. This pass covers all 9 application schemas across all three envs and reveals lying-history that's an order of magnitude larger than what either prior audit caught.

## TL;DR

**Eight new lying-history migrations beyond what the 2026-05-22 audit found**, plus 308 from the 2026-05-24 audit, plus 227. Total now: **22 migrations recorded as applied but not actually run** somewhere.

| Migration | Recorded applied on | Actually missing on | Severity |
|---|---|---|---|
| 140, 200, 221, 222, 223, 225, 300, 301, 304, 305, 307, 312 | all 3 | dev + prod | known from 2026-05-22 audit |
| 227 (drop `cms.welcome_slides`) | all 3 | dev + prod still have the table | low |
| 308 (search_path hardening) | all 3 | dev + prod missing on 96 functions; 23 are SECURITY DEFINER | **HIGH — already SC-69** |
| 313, 314, 315, 316, 317, 318, 319, 323 (community schema, tables, taxonomy, RLS, seed, notifications, karma) | all 3 | **prod has no `community` schema at all** | **MAJOR — 11 tables, 9 functions, 37 policies, 20 indexes, 9 triggers, 4 types** |
| 320, 321 (engagement rollup tables + function) | all 3 | prod missing 3 tables + 1 function | medium |

**Pending (unapplied anywhere):** 328 (SC-68), 329 (SC-30), 330 (SC-42 — blocked on community schema restoration for prod).

## Per-schema existence matrix

| Schema | preview | dev | prod |
|---|---|---|---|
| `public` | ✓ | ✓ | ✓ |
| `core` | ✓ | ✓ | ✓ |
| `cms` | **MISSING** (correctly — 227 dropped welcome_slides) | ✓ (welcome_slides still there — lying-history) | ✓ (welcome_slides still there — lying-history) |
| `community` | ✓ | ✓ | **MISSING** (8 migrations lied) |
| `data` | ✓ | ✓ | ✓ |
| `engagement` | ✓ | ✓ | partial (3/6 tables, 2/2 lying migrations missed) |
| `logs` | ✓ (1 fewer index — `idx_logs_user_feedback_sync_status` was column-dropped by 302) | ✓ | ✓ |
| `onet` | ✓ | ✓ | ✓ |
| `stripe` | ✓ (empty) | ✓ (empty) | ✓ (empty — never populated by any migration) |

## Detailed drift

### A. Cron functions in wrong schema — preview vs dev/prod (already SC-68)

13 functions in `core.*` on preview, `public.*` on dev/prod. Migration 328 not applied on any env. See [2026-05-24-supabase-schema-drift-v1.5.0.md](./2026-05-24-supabase-schema-drift-v1.5.0.md) §1 and [SC-68](https://linear.app/scaffald/issue/SC-68/move-cron-refactor-functions-from-public-to-core-schema-on-dev-prod).

### B. Search-path hardening missing on dev+prod (already SC-69)

96 functions on dev/prod missing `SET "search_path"`; 23 are `SECURITY DEFINER` → search-path injection vulnerability. See [SC-69](https://linear.app/scaffald/issue/SC-69/re-apply-migration-308-search-path-hardening-on-dev-prod-lying-history).

### C. Prod missing entire `community` schema

**11 tables, 9 functions, 37 policies, 20 indexes, 9 triggers, 4 types** from migrations 313–319 + 323, all of which are recorded as applied on prod.

Tables: `bookmarks`, `comments`, `communities`, `karma_gifts`, `memberships`, `post_ratings`, `posts`, `reputation_events`, `scaffold_scores`, `skill_taxonomy`, `upvotes`.

Functions: `get_skill_ancestors`, `gift_karma`, `search_skill_taxonomy`, `set_updated_at`, `update_community_member_count`, `update_post_comment_count`, `update_post_rating_stats`, `update_scaffold_score`, `update_upvote_count`.

Types: `moderation_result`, `post_status`, `post_type`, `reputation_action`.

**Impact:** any prod code path that hits `community.*` fails. The Community feature is effectively non-functional on prod.

**Fix:** mark 313–319 + 323 as reverted on prod via `supabase migration repair --status reverted ... --linked`, then `db push` to re-run. Each migration may need idempotency hardening (see prior audit lines 113–125 for the patterns).

### D. Prod missing engagement analytics tables

Migrations 320, 321 recorded applied but didn't actually run on prod.

Missing on prod:
- Tables: `daily_engagement_rollups`, `daily_visibility_rollups`, `search_impressions`
- Function: `rollup_daily_analytics`
- 7 policies, 7 indexes, 2 triggers

**Impact:** any prod code that writes/reads engagement rollups fails.

**Fix:** same pattern as C — repair --reverted + db push.

### E. Dev/prod still have `cms.welcome_slides` despite 227 dropping it

Migration 227 (`drop_cms_welcome_slides.sql`) recorded applied on all envs but the table only got dropped on preview.

**Impact:** dead table on dev/prod, no functional risk; the app no longer reads from it.

**Fix:** manually `DROP TABLE cms.welcome_slides CASCADE` on dev + prod, or revert+rerun migration 227.

### F. Preview missing 1 logs index

`idx_logs_user_feedback_sync_status` exists on dev/prod but not preview. Likely column-dropped by migration 302 cascading the index on preview, while 302 was lying-history on dev/prod (leaving the column AND its index in place).

**Impact:** none — the orphaned column on dev/prod isn't read by current code.

**Fix:** part of the broader 302-style lying-history sweep, low priority.

## What this means for the v1.5.0 deploy plan

The original plan was to bundle 328 + 329 + 330. With this audit's findings:

- **328 (cron functions to core)**: safe to deploy on all 3. Idempotent.
- **329 (review_pins)**: safe to deploy on all 3 (only depends on `core` schema and `core.reviews` / `core.users` tables, all present).
- **330 (community membership read)**: **cannot deploy on prod** — `community.memberships` doesn't exist. Either:
  - Defer 330 entirely until C above is fixed, OR
  - Apply 330 to preview + dev only (creates further dev↔prod drift — not recommended).

**Recommendation:** push **328 + 329 to all envs now**; defer 330 until prod's community schema is restored (block on a new "fix prod community drift" ticket).

## Tickets to file / update

1. **SC-69**: extend scope or attach this audit doc; the search_path issue is one of many lying-history items.
2. **NEW (Urgent)**: "Restore `community` schema on prod" — 8 lying migrations, 11 tables. Needs PITR snapshot first.
3. **NEW (High)**: "Restore engagement analytics tables on prod" — 2 lying migrations, 3 tables.
4. **NEW (Low)**: "Clean up `cms.welcome_slides` orphan on dev+prod and 302-cascade leftovers" — 2 envs, trivial DROP.
5. **SC-42 comment**: 330 blocked on #2 above; comment with current state.

## Methodology

- Dumped all 9 application schemas (public, core, cms, community, data, engagement, logs, onet, stripe) from preview/dev/prod via `supabase db dump --linked --schema X --schema Y ...` after re-linking the CLI to each project.
- Parsed CREATE statements per schema for tables, functions, indexes, policies, triggers, types.
- Cross-referenced object existence with `supabase migration list --linked` to identify lying-history.

Artifacts in `/tmp/scaffald-audit-v1.5.0-extended/`:
- `{preview,dev,prod}-allschemas.sql` (25k, 25k, 23k lines respectively)
