# REQ-227 • IPIP Personality System — Current Coverage Gaps

## 1. Coverage Artifacts Snapshot
- The generated Istanbul report under `coverage/` contains folders for `core/discover`, `core/office`, and `core/profile`, but **no entries for any `ipip-*` modules**. Running `rg -l "ipip" coverage` returns no matches, which confirms the new IPIP feature set is presently **missing from collected coverage metrics**.
- Because these modules are absent from the latest coverage output, current line/branch/file percentages are effectively 0% for:
  - `packages/core/features/ipip-assessment/**/*`
  - `packages/core/features/personality-assessment/lib/ipip/*` (newer helper files are not exercised beyond legacy unit specs)
  - `packages/core/features/ipip-assessment/components/*`
  - `packages/supabase/functions/trpc/routers/personality-assessment.router.ts`
  - `tests/e2e/**` flows dedicated to IPIP/Archetype UX

## 2. Existing Automated Tests

### Core Utility / Legacy Specs
- `packages/core/features/personality-assessment/lib/ipip/__tests__/score.test.ts` covers the legacy `getScore` helper’s aggregation logic but **does not exercise**:
  - 120-question fixtures / deterministic final outputs
  - error surfacing when custom `calcHandler` throws
  - facet/domain boundary handling used by the new micro-block flow
- `packages/core/features/ipip-assessment/utils/__tests__/` currently only tests:
  - `archetypeMapper` happy-path confidence calculations
  - `scoreNormalizer` basic percentage math
  - `narrativeGenerator` simple summary creation
  - `domainGrouping` existence (but lacks edge-index assertions)

### Hooks & Components
- `packages/core/features/ipip-assessment/__tests__/IPIPAssessmentWizard.test.tsx` exercises the wizard shell only (domain completion toast & save payload). No tests exist for:
  - `useIPIPResults`
  - `IPIPResultsPage`, `NarrativeView`, `ChartView`, `DomainCard`, `FacetList`, or `ShareResults`
  - Partial-results banners, warning states, or cooldown UX

### Supabase Router (Deno)
- `packages/supabase/tests/routers/personality-assessment.test.ts` contains **two** baseline tests that only verify `getAssessmentStatus` auth + record creation. None of the REQ-227 endpoints (`saveIPIPProgress`, `getArchetype*`, share token mutations, XP awards, cooldown enforcement) are covered.

### End-to-End / Playwright
- `tests/e2e/dashboard/test-req-227-ipip-results.spec.ts` validates that the results page loads tabs and (optionally) renders the share card. It does **not**:
  - Drive the micro-block completion flow
  - Assert archetype badge content
  - Hit share token flows, cooldown UI, or error fallbacks

## 3. Gap Summary (Mapped to Plan Tasks)
| Area | Current State | High-Priority Additions |
| --- | --- | --- |
| **Unit utilities** | ✅ `domainGrouping`, `scoreNormalizer`, `narrativeGenerator`, `archetypeMapper`, and `lib/ipip/score` now include boundary cases and 120-question fixture coverage | Continue monitoring for new utility helpers (e.g., score normalization tweaks) and add regression tests when requirements evolve |
| **React hooks/components** | ✅ `useIPIPResults`, `NarrativeView`, `DomainCard`, `FacetList`, `ChartView`, `ShareResults`, `IPIPResultsPage` covered (accessibility + partial data) | Add visual regression coverage if design tokens change; expand to any new Experience components (Archetype history widgets, etc.) |
| **Supabase router (tRPC)** | ✅ Deno tests exercise save progress (partial + completion), archetype history insert, share token lifecycle, and XP bonuses | Future endpoints (results view XP, cooldown overrides) should receive similar CRUD + RLS tests |
| **Playwright** | ✅ Dashboard suite now navigates tabs, runs share workflow (privacy toggles + link generation), and loads the public share page | Expand to micro-block completion flow once fixture data allows; add negative-share tests (expired token messaging) |
| **Documentation / tracking** | ✅ This file now documents coverage status and gaps | Keep this doc + testing matrix in sync whenever suites expand; capture WCAG/perf checkpoints per release |

These observations establish the baseline required by Task **“Document current IPIP coverage gaps”** and feed directly into the follow-up todo items (unit expansions, hook/component tests, backend + e2e coverage, and documentation updates).

