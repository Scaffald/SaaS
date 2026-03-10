---
pillar: "CI & Deployment"
status: active
last_verified: 2026-03-10
packages:
  - .github/workflows/
  - project.json
  - pnpm-workspace.yaml
  - tsconfig.base.json
key_files:
  - .github/workflows/integrity.yaml
  - project.json
  - pnpm-workspace.yaml
  - vitest.config.ts
critical_constraints:
  - "@hookform/resolvers must be ~3.1.0 — squash merges can silently revert this to 5.x"
  - "Vitest 4 pool config is top-level (minThreads/maxThreads), NOT nested in poolOptions"
  - "All imports must use exact casing that matches filesystem (macOS hides case errors)"
  - "NX root project needs no-op targets in project.json to prevent infinite recursion"
---

# CI & Deployment — Build, Test, and Version Constraints

## @hookform/resolvers Version Pin

**CRITICAL:** The pnpm workspace catalog must have `@hookform/resolvers: ~3.1.0` (NOT `~5.x`).

- v5.x requires `react-hook-form@^8` — we use `react-hook-form@7.x`
- Symptom: `Two different types with this name exist, but they are unrelated` for `Resolver<X>`
- **Cause:** Squash merges from branches that had v5 in their lockfile silently revert the catalog

### Post-Squash-Merge Verification

After every squash merge to main, run:
```bash
grep "@hookform/resolvers" pnpm-lock.yaml  # must show 3.1.x
pnpm exec nx run scf-core:typecheck        # must pass
```

## Stripe Version Pin

Pin `stripe: "20.0.0"` (exact version) as devDep in the supabase package.

- `LatestApiVersion` type changes with each patch, breaking type checks
- Using `declare module 'stripe'` in `.d.ts` files **merges** with npm types — don't do this

## NX Root Project Recursion

The root `package.json` has scripts like `lint: "nx run-many -t lint ..."`. When NX infers these as targets for the root project, running `nx run-many -t lint` enters infinite recursion.

**Fix:** Explicit no-op targets in root `project.json`:
```json
{
  "name": "scaffald",
  "targets": {
    "lint": { "executor": "nx:run-commands", "options": { "command": "echo 'skip'" } },
    "test": { "executor": "nx:run-commands", "options": { "command": "echo 'skip'" } },
    "typecheck": { "executor": "nx:run-commands", "options": { "command": "echo 'skip'" } }
  }
}
```

## Vitest 4 Pool Configuration

In Vitest 4, `poolOptions` was **removed**. Pool settings are now top-level:

```typescript
// ✅ Vitest 4 (correct)
test: {
  pool: 'threads',
  minThreads: 1,
  maxThreads: 2,
}

// ❌ Vitest 3 style (removed in Vitest 4)
test: {
  pool: 'threads',
  poolOptions: { threads: { minThreads: 1, maxThreads: 2 } }
}
```

Without thread limits, tests consume 30GB+ RAM (14 threads × ~2GB each). Always set `minThreads: 1, maxThreads: 2`.

Add to test scripts: `NODE_OPTIONS=--max-old-space-size=4096`

## Import Case Sensitivity

macOS is case-insensitive; Linux CI is not. Wrong-case imports pass locally but fail in CI.

```typescript
import { Foo } from './components/common/Foo'     // ❌ if dir is actually "Common"
import { Foo } from './components/Common/Foo'      // ✅ matches actual filesystem
```

**Always verify actual directory casing on disk** before assuming an import is correct.

## tsup DTS + Incremental

`tsconfig.base.json` has `incremental: true` but tsup DTS build lacks `tsBuildInfoFile`, causing TS5074.

**Fix:** Add `"incremental": false` to packages with `dts: true` in their tsup config. Only affects packages extending `tsconfig.base.json` (SDK and UI have their own tsconfig).

## Zod v3/v4 Path Alias

Local Deno cache may have Zod v3 while root has v4. Fix with path alias in `tsconfig.base.json`:
```json
"zod": ["./node_modules/zod"],
"zod/*": ["./node_modules/zod/*"]
```

Note: Zod v4 uses `message:` not `required_error:` / `invalid_type_error:` in schema options.

## CI Workflow (integrity.yaml)

Execution order:
1. Build SDK/UI first (required for typecheck)
2. `pnpm check` (format + lint + typecheck)
3. `pnpm exec nx run-many -t typecheck` (standalone)
4. `pnpm exec nx run-many -t build --exclude=@scaffald/ui-docs`
5. `pnpm --filter @scaffald/ui-docs build` (separate — pnpm properly sets PATH)

**Note:** Always use `pnpm exec nx run-many` in CI, not just `nx run-many` (nx may not be in PATH).

## Docusaurus Build

`@scaffald/ui-docs` must be excluded from `nx run-many` and built separately with `pnpm --filter`, because pnpm 10 in CI doesn't reliably add workspace root `node_modules/.bin` to PATH.

## gh CLI Limitation

The default `gh` token doesn't include the `workflow` scope. PRs that touch `.github/workflows/*.yml` require:
```bash
gh auth refresh -s workflow  # Interactive, opens browser
```
