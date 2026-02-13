# Git Hooks

These hooks run automatically when using this repository.

| Hook | Runs | What it does |
|------|------|--------------|
| **pre-commit** | Before each commit | Lint + typecheck (affected packages) |
| **pre-push** | Before each push | Unit tests (affected packages) |

Hooks are activated via `git config core.hooksPath .githooks`, which is set automatically by `pnpm install` (prepare script).

**Skip hooks when needed:**
```bash
git commit --no-verify   # Skip pre-commit
git push --no-verify     # Skip pre-push
```
