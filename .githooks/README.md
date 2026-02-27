# Git Hooks

These hooks run automatically when using this repository.

| Hook | Runs | What it does |
|------|------|--------------|
| **pre-commit** | Before each commit | Lint + typecheck (affected packages, single nx invocation) |
| **pre-push** | Before each push | Unit tests (affected packages) |

Hooks are activated via `git config core.hooksPath .githooks`, which is set automatically by `pnpm install` (prepare script).

**Optimizations:**
- Pre-commit uses one `nx affected -t lint,typecheck` instead of separate lint + typecheck (faster, avoids graph lock)
- Timeout: 90s default; set `PRECOMMIT_TIMEOUT=120` to increase
- Uses `timeout` or `gtimeout` when available (macOS: `brew install coreutils` for gtimeout)

**Skip hooks when needed:**
```bash
git commit --no-verify   # Skip pre-commit
git push --no-verify     # Skip pre-push
```
