# Testing Strategy — 2025-11

## Objectives and Scope
- Provide fast feedback for contributors while protecting critical user and revenue flows (discovery, profiles, office/admin, payments, and Supabase-backed APIs).
- Raise confidence to ship by codifying per-stage gates (local, PR, pre-production) and ensuring data/infra parity where feasible.
- Address known blockers in the current pipeline so `pnpm check`/`pnpm test` can become green by default.

## Current State Snapshot
- Vitest coverage sits around **80.6% statements / 71.4% branches** across the monorepo, driven by discovery, office, and UI suites.【F:docs/testing/README.md†L8-L24】
- Full `pnpm check` and `pnpm test` are still red due to legacy Expo/teams type errors, older Supabase test doubles, and untyped background-check utilities; teams currently run filtered Vitest commands to avoid these failures.【F:docs/testing/README.md†L26-L43】
- Targeted docs already outline how to run suites and patterns for mocking Tamagui/React Native bridges, but there is no single stage-by-stage policy covering CI and release readiness.【F:docs/testing/README.md†L45-L73】

## Strategy by Stage
### 1) Local Development (Shift-Left Feedback)
- **Mandatory fast checks**: run `pnpm lint` and focused unit suites on touched areas via `vitest run path/to/module/__tests__/*.test.*` (or `pnpm test:core`/`pnpm test:ui` per workspace). Cache results locally with Vitest's `--watch` during feature work.
- **Type hygiene**: unblock `pnpm check` by fixing Expo teams screen typings and Supabase test doubles; once green, gate commits with `turbo check --filter=<package>` for touched workspaces.
- **Mocks & fixtures**: rely on the documented Tamagui/React Native mocking helpers to keep hooks/components deterministic; require new fixtures to live alongside tests with data builders for reuse.
- **Contract stubs**: add Pact (or msw contract fixtures) for any new external API integration before shipping UI hooks that consume them.

### 2) Pull Requests (Automated Gates)
- **Selective pipelines**: use Turbo pipelines to run `pnpm lint`, `pnpm typecheck`, and Vitest on impacted workspaces (`turbo run lint typecheck test --filter=<scope>`). Block merges on any failure or coverage regression below the current 80% statement baseline.
- **Integration focus**: for PRs touching Supabase RPCs, queues, or payments, require integration suites that spin the lightweight Supabase/local mocks (`pnpm --filter @app/supabase test:endpoints`) and Stripe SDK contract tests with recorded fixtures.
- **UI regressions**: run Playwright smoke suite (`pnpm test:playwright`) targeting discovery, profile editing, and office admin dashboards; capture screenshots/video on failure.
- **Accessibility & security**: include axe-core linting in Playwright flows and dependency audits (`pnpm check-deps`) as part of the PR gate.

### 3) Pre-Production / Release Candidates
- **Full stack rehearsals**: deploy preview/staging with production-like config; run the full Vitest coverage pass (`pnpm vitest run --coverage`) and the complete Playwright suite across web and native webviews.
- **Data seeding**: seed Supabase with anonymized fixtures; ensure unique test accounts per run to keep suites independent and repeatable.
- **Resilience & performance**: add smoke chaos toggles (e.g., induced Supabase latency, Stripe webhook delays) and a lightweight performance check (`cd apps/expo && pnpm web:build`) comparing bundle/TTI against baselines.
- **Release sign-off**: ship only when coverage is stable or rising, no critical axe violations exist, and contract tests for third parties pass.

## Risk-Based Priorities (Next 2 Sprints)
1. **Unblock CI** by fixing the known Expo/teams type errors and Supabase test doubles so `pnpm check` and `pnpm test` become reliable green baselines.【F:docs/testing/README.md†L26-L43】
2. **Contract testing for external APIs** (Stripe, PostHog, background-check vendors) to prevent silent breakage when upstream payloads change.
3. **Data integrity coverage** for Supabase schemas: add migration tests that verify constraints/indices and enforce rollback plans.
4. **Flakiness reduction** in Playwright: enforce deterministic seeds, network request stubbing for non-critical services, and parallel-safe fixtures.
5. **Observability hooks**: capture console/network logs and upload coverage + trace artifacts on every CI run for faster triage.

## Tooling & Conventions
- **Frameworks**: Vitest for unit/integration; Playwright for E2E; msw for API mocking; Pact for consumer contracts; axe-core for accessibility.
- **Organization**: mirror source structure under `__tests__`; mark scope with `@vitest-environment` or `@vitest-mock` headers when needed. Use `data-testid` conventions from `docs/testing/data-testid-conventions.md` for UI selectors.
- **Skip policy**: `it.skip` only allowed with an issue link; nightly job fails if skips exceed threshold.
- **Reporting**: publish coverage HTML, Playwright traces, and lint/typecheck summaries as PR artifacts; maintain the `docs/testing` log files when suites materially change.

## Roadmap & Ownership
- **Milestone 1 (Week 1-2)**: Resolve CI blockers, add minimal contract tests for Stripe/PostHog, and enable `pnpm check` in PR pipelines.
- **Milestone 2 (Week 3-4)**: Expand integration suites for Supabase RPCs and office/discovery flows; raise coverage floor to 85% statements.
- **Milestone 3 (Week 5+)**: Introduce scheduled chaos/performance checks in staging, enforce accessibility gates, and automate test impact analysis via Turbo caching.

**Maintainer:** Testing Architect
**Review Cadence:** Revisit after each release or when new high-risk domains (payments, background checks) are added.
