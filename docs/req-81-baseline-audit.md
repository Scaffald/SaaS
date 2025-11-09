<!-- Baseline audit for BrainGrid REQ-81 -->

# REQ-81 Baseline Audit (2025-11-09)

This document captures the current state of the eight issues described in REQ-81. Each section summarizes observed behaviour, linked source locations, and any notable gaps.

## 1. Magic Link Email Subject

- Supabase configuration (`packages/supabase/config.toml`) still relies on default email templates; there is no repository automation that adjusts subject lines for login vs signup.
- Searches across the codebase found no logic that customizes magic-link subjects or bodies (`grep -R "magic link"`).
- Conclusion: subject differentiation remains unimplemented; Supabase defaults continue to send `"Confirm signup"` for all flows.

## 2. Skills Showing `"Unnamed skill"`

- `packages/supabase/functions/trpc/routers/user-profile.router.ts` and `.../profile/widgets.router.ts` fetch `user_skills` without joining CSI or O\*NET taxonomy tables.
- UI widgets (`packages/core/features/profile/widgets/ProfileSnapshotWidget.tsx`) call `getSkillName`, which returns `"Skill"` when metadata is absent.
- No enrichment logic exists in API responses; taxonomy tables are never queried.
- Conclusion: skills lack taxonomy metadata, leading to fallback labels in profile and dashboard views.

## 3. Years of Experience Not Computed

- Profile stats read `generalInfo.years_of_experience` directly from the profile view without calculating from `core.user_experience`.
- There is no SQL function or trigger pertaining to years-of-experience calculation (`grep -R "years_of_experience"` in migrations shows only column usage).
- Conclusion: automatic aggregation is absent; users must manually populate the field which remains `0` or empty.

## 4. News Articles Open External Browser

- `packages/core/features/news/NewsWidget.tsx` invokes `redirect(article.link)` which routes to an external browser on native platforms.
- No platform-specific handling for in-app browsers (`expo-web-browser`) is present.
- Conclusion: native users are pushed out of the app when opening news links.

## 5. Dashboard “Top Skills” Placeholder Labels

- `ProfileSnapshotWidget` slices `user_skills` and applies the same fallback described in Issue 2.
- Skill chips render the literal string `"Skill"` unless metadata exists, which it does not.
- Conclusion: Dashboard top skills remain placeholders pending taxonomy enrichment.

## 6. News Widget Layout & Filtering

- Current widget renders large `NewsCard` components (`minH={200}`) with heavy visuals.
- Feed selector exposes the full set of feeds (national, regional, topical) with no personalization.
- Aggregation hook (`packages/core/features/news/hooks/useNewsFeed.tsx`) simply merges feeds by recency; no relevance scoring or caching by user profile exists.
- Conclusion: widget remains the original, space-heavy layout with no intelligent filtering.

## 7. Occupation Search Returns No Results

- tRPC endpoint (`packages/supabase/functions/trpc/routers/onet.router.ts`) calls `supabase.rpc("search_occupations", ...)`.
- Active migrations in `packages/supabase/migrations/` do **not** define `search_occupations`; function definitions exist only in `migrations-old/`.
- Without the RPC, Supabase returns `42883 function does not exist`, explaining empty results.
- Conclusion: production migrations lack the RPC, so the search endpoint fails.

## 8. Dashboard Layout Imbalance

- `packages/ui/src/components/layouts/DashboardLayout.tsx` hardcodes a 60/40 split for large screens.
- The right column wraps the entire `NewsWidget`, which expands vertically if left column content collapses (e.g., after assessments complete).
- `DashboardIndexRight` still renders the legacy `NewsWidget` configuration (`maxItems={3}`) without height constraints.
- Conclusion: layout cannot maintain the desired 70/30 ratio or height limits; news expands disproportionately.

## Additional Notes

- Worktree already contains unrelated pending changes (`git status -sb` shows modifications to `.braingrid/project.json`, `.cursor/rules/project-guardrails.mdc`, `apps/expo/tamagui-web.css`, `packages/core/features/profile/profile-skills-left.tsx`, `pnpm-lock.yaml`).
- No existing migrations or UI components appear to address any of the listed issues.


