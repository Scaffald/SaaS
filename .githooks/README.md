# Git Hooks

These hooks run automatically when using this repository.

| Hook | Runs | What it does |
|------|------|--------------|
| **pre-commit** | Before each commit | Lint + typecheck (affected packages, single nx invocation) |
| **pre-push** | Before each push | Build + unit tests (affected packages) |

Hooks are activated via `git config core.hooksPath .githooks`, which is set automatically by `pnpm install` (prepare script).

## Optimizations

- Pre-commit uses one `nx affected -t lint,typecheck` instead of separate lint + typecheck (faster, avoids graph lock)
- Custom lint scripts (`lint:routes`, `lint:sorted-keys`) only check staged files, not the entire repo
- NX parallelism is set to 5 during hooks (`NX_PARALLEL`); override with `NX_PARALLEL=8`
- Timeout: 90s default; set `PRECOMMIT_TIMEOUT=120` to increase
- Uses `timeout` or `gtimeout` when available (macOS: `brew install coreutils` for gtimeout)

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
| `SKIP_HOOKS` | — | Set to `1` to skip all hooks |
| `SKIP_PRECOMMIT` | — | Set to `1` to skip pre-commit only |
| `SKIP_PREPUSH` | — | Set to `1` to skip pre-push only |
| `PRECOMMIT_TIMEOUT` | `90` | Timeout in seconds for pre-commit checks |
| `NX_PARALLEL` | `5` | Number of parallel NX tasks during hooks |
