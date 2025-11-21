# Testing Strategy Implementation Backlog (2025-11)

This backlog operationalizes the [Testing Strategy — 2025-11](./testing-strategy-2025-11.md) so contributors know what to ship, who owns it, and how to verify success. Items are organized by stage and milestone and should be updated as work lands.

## Stage Gates to Deliver

| Stage | Required commands | Definition of done |
| --- | --- | --- |
| **Local (dev)** | `pnpm lint`, targeted `vitest run <scope>` or `pnpm test:<workspace>`, `turbo check --filter=<pkg>` once type blockers are cleared | All touched packages lint and typecheck locally in under 5 minutes; no new `it.skip` without an issue link |
| **Pull requests** | `turbo run lint typecheck test --filter=<changed>`, `pnpm test:playwright:smoke`, `pnpm check-deps`, `pnpm vitest run --coverage --changed` | CI blocks merges on lint/type errors, statement coverage regression below 80%, or Playwright smoke failures; artifacts (coverage HTML, traces) uploaded |
| **Pre-production** | `pnpm vitest run --coverage`, full `pnpm test:playwright`, staging deploy with seeded Supabase data, `cd apps/expo && pnpm web:build` | Release candidates only after full suite green, axe violations resolved, and staging seeds verified |

## Milestone 1 (Weeks 1–2): Unblock CI

- **Fix Expo teams typing errors** (apps/office/teams/*) so `pnpm check` passes.
- **Refresh Supabase/background-check test doubles** to remove Deno import errors in `pnpm test`.
- **Stabilize mock helpers** in `packages/core/features/office/applications/hooks/__tests__/useApplications.test.ts`.
- **Add regression tests** where fixes land to prevent reintroductions.

_Exit criteria: `pnpm check` and `pnpm test` succeed on main; local `turbo check --filter` usable for contributors._

## Milestone 2 (Weeks 3–4): Strengthen PR Gates

- **Selective Turbo pipelines**: configure `turbo run lint typecheck test --filter=<scope>` for PRs; document defaults in contributor guide.
- **Coverage floor enforcement**: fail PRs when statement coverage drops below 80%; publish HTML reports as artifacts.
- **Contract tests**: add Pact/msw fixtures for Stripe, PostHog, and background-check vendors; gate merges on contract suite pass.
- **Playwright smoke + axe**: ensure discovery/profile/office flows run per PR with deterministic seeds and network stubs.

_Exit criteria: PR CI enforces lint/type/test/coverage/contract/axe gates with uploaded artifacts and deterministic Playwright runs._

## Milestone 3 (Week 5+): Release-Candidate Readiness

- **Full-stack rehearsals**: automated staging deploys with anonymized Supabase seeds and unique test accounts per run.
- **Complete Playwright suite**: run full suite (not just smoke) against staging before sign-off; retry policy limited to flake budget.
- **Chaos/performance checks**: add lightweight latency toggles for Supabase/Stripe plus `apps/expo` web build metrics in CI.
- **Skip hygiene**: enforce issue links for `it.skip`; nightly job fails when skip count exceeds agreed threshold.

_Exit criteria: staging rehearsals green, performance/chaos checks stable, skip policy enforced, and coverage trending toward 85%._

## Ownership & Reporting

- **Maintainer:** Testing Architect (or delegate) tracks progress weekly.
- **Updates:** log status changes in PR descriptions and append notable decisions to `docs/testing/README.md`.
- **Artifacts:** always upload coverage HTML, Playwright traces, and lint/type summaries to CI for debugging.

## How to Propose Adjustments

1. Open a PR updating this backlog and the strategy document in tandem.
2. Note changes in `docs/testing/README.md` under a short "Changelog" bullet list.
3. Align new tasks with risk priorities (payments, Supabase data integrity, Playwright flakiness) before adding lower-risk work.
