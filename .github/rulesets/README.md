# Rulesets

`main.json` is the server-side protection for `main`. **It is not applied yet.**

## Why it isn't applied

The `Scaffald` org is on the GitHub **Free** plan and `SaaS` is **private**, so
both the rulesets API and classic branch protection refuse the request:

```
403 — Upgrade to GitHub Pro or make this repository public
```

Until the org is on a plan that supports rulesets for private repos, `main` is
guarded by two stopgaps, both of which are deterrents rather than enforcement:

- [`.githooks/pre-push`](../../.githooks/pre-push) — refuses local pushes to
  `main`, `preview`, `prod`. Bypassed by `--no-verify`; absent in a clone that
  never ran `pnpm install`.
- [`main-guard.yml`](../workflows/main-guard.yml) — opens an issue when a commit
  lands on `main` without a merged PR. Detective: the commit is already in.

## Applying it

```bash
gh api -X POST repos/Scaffald/SaaS/rulesets --input .github/rulesets/main.json
```

Verify — this currently 403s, and should return the ruleset once it works:

```bash
gh api repos/Scaffald/SaaS/rulesets
```

Then delete `main-guard.yml`, which exists only to cover this gap.

## Two things to sort out when you apply it

### 1. semantic-release pushes directly to `main`

`.releaserc` uses `@semantic-release/git` to commit
`chore(release): x.y.z [skip ci]` (CHANGELOG + version bump) **straight to
`main`**. The `pull_request` rule will block that, and
[release.yml](../workflows/release.yml) will start failing.

It authenticates as `github-actions[bot]` via `GITHUB_TOKEN`, so it needs a
bypass entry. Look up the app id and add it to `bypass_actors`:

```bash
gh api /repos/Scaffald/SaaS/installation -q '{app_id: .app_id, app_slug: .app_slug}'
```

```json
{ "actor_id": <app_id>, "actor_type": "Integration", "bypass_mode": "always" }
```

Alternatively, drop `@semantic-release/git` and let releases be tag-only — the
tidier fix, but a separate decision.

### 2. Required status checks are deliberately omitted

`main.json` has no `required_status_checks` rule, on purpose. Two reasons:

**Nothing currently runs.** Every push-triggered workflow on `main` — CI,
Release, Deploy Web — has been failing at *job startup* (3–10s, zero steps
executed). A required check that can never report leaves `main` permanently
unmergeable. Fix that first.

**Skipped jobs are a footgun.** [ci.yml](../workflows/ci.yml) puts `quality`,
`unit` and `integrity` behind a `paths-filter` gate, so a docs-only PR skips
them. Requiring a job that skips can block the very PRs the gate was meant to
make cheap.

The robust pattern is an aggregator job that always runs and reports one check:

```yaml
  ci-complete:
    name: CI complete
    if: always()
    needs: [gate, quality, unit, integrity]
    runs-on: ubuntu-latest
    steps:
      - run: |
          echo '${{ toJSON(needs) }}'
          [ -z "$(echo '${{ toJSON(needs) }}' | jq -r 'to_entries[] | select(.value.result == "failure") | .key')" ]
```

Then require exactly one check, `CI complete`, instead of four:

```json
{
  "type": "required_status_checks",
  "parameters": {
    "strict_required_status_checks_policy": true,
    "required_status_checks": [{ "context": "CI complete" }]
  }
}
```

For reference, the current job names are `Detect changes`,
`Lint, typecheck & build`, `Unit tests`, `Monorepo integrity`.

## Also worth doing on the paid plan

- **`Production` environment has `protection_rules: []`.** Despite the comment in
  [deploy-web.yml](../workflows/deploy-web.yml) saying production requires manual
  approval, there is no gate — a push to `prod` deploys to scaffald.com
  unattended. Add required reviewers.
- **Auto-merge could not be enabled.** `allow_auto_merge` silently stays `false`
  on this plan; it depends on protected branches. Re-run:
  ```bash
  gh api -X PATCH repos/Scaffald/SaaS -F allow_auto_merge=true
  ```
