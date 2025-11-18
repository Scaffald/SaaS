# REQ-227 • IPIP Personality System — Current Coverage Gaps

## 1. Coverage Artifacts Snapshot
- Istanbul’s aggregated HTML still lacks the new IPIP modules because the latest run predates these suites. Until CI re-generates coverage, the report under `coverage/` will continue to exclude:
  - `packages/core/features/ipip-assessment/**/*`
  - `packages/core/features/personality-assessment/lib/ipip/*`
  - `packages/supabase/functions/trpc/routers/personality-assessment.router.ts`
  - `tests/e2e/**` cases dedicated to IPIP/Archetype UX
- Interim verification relies on targeted commands:
  - `CI=1 pnpm vitest run --pool forks packages/core/features/ipip-assessment/hooks/__tests__/useIPIPResults.test.tsx …`
  - `pnpm --filter @app/supabase test packages/supabase/tests/routers/personality-assessment.test.ts`
  - `pnpm test:e2e -- --grep "@REQ-227"`

## 2. Existing Automated Tests (Current State)

### Core Utility / Legacy Specs
- `packages/core/features/personality-assessment/lib/ipip/__tests__/score.test.ts` now uses 120-question fixtures, custom handler errors, and facet boundary checks.
- `packages/core/features/ipip-assessment/utils/__tests__/` covers `domainGrouping`, `scoreNormalizer`, `narrativeGenerator`, and `archetypeMapper` edge cases (rounding, tie-breaking, fallback messaging).

### Hooks & Components
- `packages/core/features/ipip-assessment/hooks/__tests__/useIPIPResults.test.tsx` verifies partial data, memoized errors, and archetype formatting.
- Component suites exercise `NarrativeView`, `DomainCard`, `FacetList`, `ChartView`, `ShareResults`, and `IPIPResultsPage` for tabbing/accessibility, partial warnings, share UX, and archetype badges.

### Supabase Router (Deno)
- `packages/supabase/tests/routers/personality-assessment.test.ts` now validates `saveIPIPProgress` auth, partial vs full completions (XP + archetype history), share token lifecycle, and `getSharedResults`.

### End-to-End / Playwright
- `tests/e2e/dashboard/test-req-227-ipip-results.spec.ts` navigates tabs, verifies share privacy toggles, generates a link, and loads the public shared page. (Micro-block completion flows remain future work once fixtures allow.)

## 3. Gap Summary (Mapped to Plan Tasks)
| Area | Current State | High-Priority Additions |
| --- | --- | --- |
| **Unit utilities** | ✅ `domainGrouping`, `scoreNormalizer`, `narrativeGenerator`, `archetypeMapper`, and `lib/ipip/score` now include boundary cases and 120-question fixture coverage | Continue monitoring for new utility helpers (e.g., score normalization tweaks) and add regression tests when requirements evolve |
| **React hooks/components** | ✅ `useIPIPResults`, `NarrativeView`, `DomainCard`, `FacetList`, `ChartView`, `ShareResults`, `IPIPResultsPage` covered (accessibility + partial data) | Add visual regression coverage if design tokens change; expand to any new Experience components (Archetype history widgets, etc.) |
| **Supabase router (tRPC)** | ✅ Deno tests exercise save progress (partial + completion), archetype history insert, share token lifecycle, and XP bonuses | Future endpoints (results view XP, cooldown overrides) should receive similar CRUD + RLS tests |
| **Playwright** | ✅ Dashboard suite now navigates tabs, runs share workflow (privacy toggles + link generation), and loads the public share page | Expand to micro-block completion flow once fixture data allows; add negative-share tests (expired token messaging) |
| **Documentation / tracking** | ✅ This file now documents coverage status and gaps | Keep this doc + testing matrix in sync whenever suites expand; capture WCAG/perf checkpoints per release |

These observations establish the baseline required by Task **“Document current IPIP coverage gaps”** and feed directly into the follow-up todo items (unit expansions, hook/component tests, backend + e2e coverage, and documentation updates).

## 4. Accessibility & WCAG Touchpoints
- **Keyboard navigation**: Tabs (`NarrativeView`/`ChartView`) and share privacy toggles expose ARIA labels; Playwright checks ensure tabs are visible and clickable via `getByRole`.
- **Screen reader text**: `ChartView` renders a `VisuallyHidden` summary capturing radar data; component tests assert fallback messaging.
- **Color contrast**: Domain cards/facets rely on Tamagui semantic tokens (`$color12`, `$green10`, etc.) which map to >=4.5:1 combinations. Manual verification checklist:
  1. Run `pnpm ui:check` to ensure theme tokens remain compliant.
  2. In Expo web, tab through `/dashboard/assessments/ipip/results` and confirm visible focus indicators on tabs, share switches, CTA buttons.
  3. VoiceOver/NVDA smoke test: ensure “Your Personality Results” header announces and `ShareResults` lock state conveys completion requirement.

## 5. Performance Considerations
- Radar/facet charts animate via `react-native-gifted-charts` at 800–1000 ms durations. Keep animations smooth by limiting data arrays (5 domains, 6 facets each) and deferring heavy computations to hooks (`useMemo`).
- Supabase router tests insert/delete fixtures using UUID suffixes to avoid slow global cleanups. If E2E flows start creating large answer sets, consider nightly cron to purge `personality_assessments` test rows.
- Recommended quick perf check before release: open `/dashboard/assessments/ipip/results` in Expo web, record Lighthouse > Performance at least 80+, ensure initial paint <2 s on M2 MBP class hardware.

