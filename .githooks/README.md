# Git Hooks

These hooks run automatically when using this repository.

| Hook | Runs | What it does |
|------|------|--------------|
| **pre-commit** | Before each commit | Lint + typecheck (affected packages, single nx invocation) |
| **pre-push** | Before each push | Protected-branch guard, then stamp-only verification (instant pass/fail) |

Hooks are activated via `git config core.hooksPath .githooks`, which is set automatically by `pnpm install` (prepare script).

## Protected branches

The pre-push hook refuses to push to — or delete — `main`, `preview` and `prod`.

- **`main`** advances through a merged pull request, never a direct push.
- **`preview` / `prod`** are deploy branches: pushing them triggers
  [deploy-web.yml](../.github/workflows/deploy-web.yml) against
  `preview.scaffald.com` / `scaffald.com`, and `prod` also kicks off a
  production iOS build. Fast-forward them deliberately, and watch the run.

The guard inspects the refs git hands the hook on stdin, not the current
branch — so `git push origin HEAD:main` from a feature branch is caught too.

```bash
# Intentional deploy-branch fast-forward
ALLOW_PUSH_TO_MAIN=1 git push origin origin/main:preview
gh run watch --repo Scaffald/SaaS
```

`SKIP_HOOKS` / `SKIP_PREPUSH` do **not** disable this guard. They are routine
for skipping lint and tests, and a rail that a routine flag switches off is not
a rail — only `ALLOW_PUSH_TO_MAIN=1` bypasses it.

**This is a deterrent, not enforcement.** `git push --no-verify` skips every
hook, and none of this exists in a clone that never ran `pnpm install`. Real
server-side protection lives in
[.github/rulesets/main.json](../.github/rulesets/main.json) and is waiting on a
GitHub plan that supports rulesets for private repos — see that file's header.
[main-guard.yml](../.github/workflows/main-guard.yml) is the backstop that
catches whatever slips through.

## Push workflow

The pre-push hook does **not** run checks itself — it only verifies a stamp file. This keeps pushes instant and avoids SSH timeouts.

```bash
# 1. Commit (pre-commit runs lint + typecheck)
git commit -m "feat: my changes"

# 2. Validate build + tests (writes stamp on success)
pnpm prepush

# 3. Push (instant — hook checks stamp)
git push
```

If you forget step 2, the hook fails with a reminder to run `pnpm prepush`.

## Optimizations

- Pre-commit uses one `nx affected -t lint,typecheck` instead of separate lint + typecheck (faster, avoids graph lock)
- Custom lint scripts (`lint:routes`, `lint:sorted-keys`) only check staged files, not the entire repo
- `pnpm prepush` runs build + test in parallel with `NX_PARALLEL=5`
- NX caching means repeated runs are near-instant when nothing changed
- Pre-push hook is stamp-only — no SSH timeout risk

## Skip hooks when needed

```bash
# Option 1: env vars (recommended — more granular, doesn't skip commit-msg hooks)
SKIP_PRECOMMIT=1 git commit -m "wip"
SKIP_PREPUSH=1 git push
SKIP_HOOKS=1 git commit -m "wip"   # Skips both pre-commit and pre-push

# Option 2: git native flag (skips ALL hooks including commit-msg)
git commit --no-verify
git push --no-verify

# Option 3: pnpm shortcut
pnpm precommit:skip -m "wip"
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SKIP_HOOKS` | — | Set to `1` to skip all hooks (not the protected-branch guard) |
| `SKIP_PRECOMMIT` | — | Set to `1` to skip pre-commit only |
| `SKIP_PREPUSH` | — | Set to `1` to skip the pre-push stamp check (not the protected-branch guard) |
| `ALLOW_PUSH_TO_MAIN` | — | Set to `1` to allow a deliberate push to `main`/`preview`/`prod` |
| `PRECOMMIT_TIMEOUT` | `90` | Timeout in seconds for pre-commit checks |
| `NX_PARALLEL` | `5` | Number of parallel NX tasks during hooks |
