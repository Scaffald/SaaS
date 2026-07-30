# GitHub Actions Workflows

## CI (`ci.yml`)

The single workflow that gates pull requests. It replaced `test.yml`
("Test Suite") and `integrity.yaml` ("Monorepo Integrity & Code Quality"), which
between them ran typecheck four times and lint three times per PR.

A cheap `dorny/paths-filter` gate decides which of the real jobs run, so a
docs-only PR costs about a minute instead of about seventy.

| Job | Runs when | What it does |
|---|---|---|
| `gate` | always (~20s) | paths-filter, sets `code` / `deps` outputs |
| `quality` | `code` | `pnpm check` (locales + lint + typecheck, run-many) then `nx run-many -t build` |
| `unit` | `code` | `pnpm affected:test`, uploads coverage |
| `integrity` | `deps` | `pnpm dedupe --check`, `check-deps`, project-graph check |

`unit` covers `apps/scaffald` as well: `apps/scaffald/project.json` declares a
`test` target on the same vitest config, so `affected:test` picks it up whenever
`apps/scaffald` or `packages/scf-core` changes.

### Required status checks

Settings → Branches → branch protection for `main`:

- `Lint, typecheck & build`
- `Unit tests`
- `Monorepo integrity`
- `Contract Tests / contract-tests`

### Local parity

```bash
pnpm check
pnpm exec nx run-many -t build
pnpm affected:test
pnpm dedupe --check
```

## Advisory workflows

These do not gate PRs. They run nightly, on `workflow_dispatch`, and on any PR
labelled **`ci:full`** when you want them before merging.

| Workflow | Schedule | Notes |
|---|---|---|
| `e2e-nightly.yml` | 04:00 UTC | Playwright against a local Supabase stack. Was a per-PR job with `continue-on-error: true`, so it could never fail anything; that flag is gone now |
| `lighthouse-ci.yml` | 05:00 UTC | Was per-PR at ~20 min with no path filter and nothing gating on the result |

Per-push web coverage is the smoke test in `deploy-web.yml`, which exercises
four routes plus an SSR `<title>` assertion on every deploy to `main`.

## REST API Tests (`api-tests.yml`)

Path-filtered to `packages/supabase/functions/api/**`. Several assertion steps
are `continue-on-error` on purpose while the suite is under repair — see #411
(route tests failing on assertion/schema drift), #412 (the old 100% coverage
gate) and #400 (`supabase db seed` is not a valid subcommand in the pinned CLI).
`benchmark` has `needs: test` so the two jobs share one Supabase boot.

## Contract Tests (`contracts.yml`)

Runs only when a PR touches third-party client code (address providers,
Stripe/OpenAI integrations, SendGrid hooks) or `tests/reports/contracts/`. Runs
the MSW-backed suite and uploads `contracts/generated` as an artifact.

```bash
pnpm test:contracts
```

## Dependabot automerge

`dependabot-automerge.yml` enables squash auto-merge on Dependabot PRs. Only
patch and minor updates auto-merge; majors are ignored outright in the config.

- **Requires:** Settings → General → Pull Requests → **Allow auto-merge**.
- **Config:** [`.github/dependabot.yml`](../dependabot.yml). Updates are grouped
  (react-ecosystem / dev-tooling / backend / everything-else) so a weekly wave is
  four PRs rather than up to fifteen. The Expo/React Native family is ignored on
  purpose — it moves as one coordinated bump, see #483.

## Shared setup

`.github/actions/install` is the composite action for pnpm + Node + a
frozen-lockfile install. Pass `build-workspace-packages: 'true'` when the job
needs `@scaffald/sdk` and `@scaffald/ui` built (any typecheck does; a dedupe
check does not). Prefer it over hand-rolling the setup steps, so caching stays
consistent across workflows.
