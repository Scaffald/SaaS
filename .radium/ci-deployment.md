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
  - "@hookform/resolvers is pinned to ~5.2.2 — works with Zod 4 schemas. Forms whose declared TFieldValues drifts from the schema's `z.input` shape need an `as unknown as Resolver<X>` cast; forms where they align (e.g. PrerequisiteWidget) do NOT need the cast."
  - "Vitest 4 pool config is top-level (minThreads/maxThreads), NOT nested in poolOptions"
  - "All imports must use exact casing that matches filesystem (macOS hides case errors)"
  - "NX root project needs no-op targets in project.json to prevent infinite recursion"
---

# CI & Deployment — Build, Test, and Version Constraints

## @hookform/resolvers Version Pin

**Current:** `@hookform/resolvers: ~5.2.2` in the pnpm workspace catalog.
See [PR #258](https://github.com/Unicorn/UNI-Construct/pull/258) for the
v3 → v5 migration.

### Why v5

Zod 4 (`zod: ~4.1.13`) introduces a new issue shape
(`{origin, code, format, pattern, ...}`) that the v3 resolver can't map
to react-hook-form's `FieldError`. v3.1.0 throws the issue array
uncaught on blur — a P1 user-facing crash. v3.10.0 didn't fix it
either; real Zod 4 support landed in v4.0+ via the Standard-Schema
refactor. v5.2.2 is the current stable.

### When the cast is needed (and when it isn't)

v5's `Resolver` generic tightened from `Resolver<TFieldValues, TContext>`
to `Resolver<TInput, TContext, TOutput>`. Whether you need a cast
depends on whether the form's declared `TFieldValues` matches the
schema's `z.input<typeof Schema>` shape.

**No cast needed** when the form's value type comes directly from the
schema and the schema has no input/output divergence:

```ts
// PrerequisiteWidget — TFieldValues IS z.infer<typeof prerequisitesSchema>,
// and the schema has no transforms that make input ≠ output. Clean.
const form = useForm<PrerequisitesFormData>({
  resolver: zodResolver(prerequisitesSchema),
  defaultValues: prerequisitesDefaults,
})
```

**Cast required** when the form's declared `TFieldValues` is looser
than the schema's input (often by listing fields as optional that the
schema marks required — pre-existing type drift in the codebase that
v3 hid):

```ts
import type { Resolver } from 'react-hook-form'

// useWorkLogForm — TFieldValues has `is_remote?: boolean` (optional)
// but the schema's z.input has `is_remote: boolean` (required).
// Pre-existing form/schema mismatch; cast silences the cosmetic TS error.
const form = useForm<CreateWorkLogInput>({
  resolver:
    zodResolver(createWorkLogSchema) as unknown as Resolver<CreateWorkLogInput>,
  defaultValues,
})
```

The cast is safe at runtime (zodResolver still validates correctly).
A proper long-term fix is to align each affected form's declared values
type with the schema's `z.input` (or split input/output types
explicitly) — separate stabilization task. Don't add the cast where it
isn't needed; cast-by-default would mask real future type regressions.

In PR [#258](https://github.com/Unicorn/UNI-Construct/pull/258) the cast
was applied to ~11 call sites that actually broke under v5; the rest
(PrerequisiteWidget, several others) were left clean.

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
