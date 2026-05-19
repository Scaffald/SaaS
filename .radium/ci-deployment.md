---
pillar: "CI & Deployment"
status: active
last_verified: 2026-05-19
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
  - "@hookform/resolvers is pinned to ~5.2.2 — works with Zod 4 schemas. All useForm call sites need an `as unknown as Resolver<X>` cast on the zodResolver result."
  - "Vitest 4 pool config is top-level (minThreads/maxThreads), NOT nested in poolOptions"
  - "All imports must use exact casing that matches filesystem (macOS hides case errors)"
  - "NX root project needs no-op targets in project.json to prevent infinite recursion"
---

# CI & Deployment — Build, Test, and Version Constraints

## @hookform/resolvers Version Pin

**Current:** `@hookform/resolvers: ~5.2.2` in the pnpm workspace catalog.
See [PR #258](https://github.com/Unicorn/UNI-Construct/pull/258) for the
v3 → v5 migration.

### Why v5 (and why the cast)

Zod 4 (`zod: ~4.1.13`) introduces a new issue shape
(`{origin, code, format, pattern, ...}`) that the v3 resolver can't map
to react-hook-form's `FieldError`. v3.1.0 throws the issue array
uncaught on blur — a P1 user-facing crash. v3.10.0 didn't fix it
either; real Zod 4 support landed in v4.0+ via the Standard-Schema
refactor. v5.2.2 is the current stable.

v5's `Resolver` generic tightened from `Resolver<TFieldValues, TContext>`
to `Resolver<TInput, TContext, TOutput>`. Several form types in this
codebase use the loose input shape on `useForm<X>` but compute against
the schema's stricter output. The pragmatic fix is a cast at each
call site:

```ts
import type { Resolver } from 'react-hook-form'

const form = useForm<MyFormValues>({
  // Cast required for @hookform/resolvers v5 — schema output is the
  // strict shape; MyFormValues is the looser input shape at render time.
  resolver: zodResolver(MySchema) as unknown as Resolver<MyFormValues>,
  // ...
})
```

The cast is safe at runtime (zodResolver still validates correctly) but
silences a cosmetic TS mismatch between input vs. output types. A proper
fix would split each form's input/output types explicitly; that's a
separate stabilization task.

### Post-Squash-Merge Verification

After every squash merge to main, run:
```bash
grep "@hookform/resolvers" pnpm-lock.yaml  # must show 5.2.x
pnpm exec nx run scf-core:typecheck        # must pass
```

### Login form has tightest validation

`packages/scf-core/features/auth/login-screen.tsx` uses `mode: 'onBlur'`
and chains `.trim().min(1).email()` in the schema — so empty submits
report "Email is required" rather than the generic format error. Pattern
worth copying for forms that need similar UX.

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
