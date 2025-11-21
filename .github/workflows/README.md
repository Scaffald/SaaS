# GitHub Actions Workflows

## Monorepo Integrity & Code Quality

This workflow runs on every pull request and push to main branch to ensure code quality and monorepo integrity.

### Jobs

#### 1. Code Quality Checks
- **Format, Lint & Type Check**: Runs `pnpm check` which includes:
  - `pnpm format:fix` - Biome code formatting
  - `pnpm lint:fix` - Biome linting
  - `pnpm typecheck` - TypeScript type checking via Turbo
- **Build Verification**: Runs `pnpm build` to ensure all packages build successfully

#### 2. Monorepo Integrity Checks
- **Dependency Deduplication**: Checks for duplicate dependencies in pnpm.lock
- **pnpm Constraints**: Validates pnpm workspace constraints
- **Dependency Version Consistency**: Ensures consistent dependency versions across workspaces
- **Circular Dependencies**: Checks for circular imports across the monorepo
- **Sherif Linting**: Advanced monorepo linting using sherif

### Required Status Checks

To configure these as required status checks in GitHub:

1. Go to your repository Settings → Branches
2. Add a branch protection rule for `main`
3. Enable "Require status checks to pass before merging"
4. Add these required status checks:
   - `Code Quality Checks`
   - `Monorepo Integrity Checks`

### Local Development

Before pushing changes, run these commands locally to catch issues early:

```bash
# Run all quality checks (same as CI)
pnpm check

# Build all packages
pnpm build

# Check monorepo integrity
pnpm check-deps
pnpm lint-sherif
pnpm check-circular-deps
```

### Troubleshooting

If checks fail:

- **Format/Lint errors**: Run `pnpm check` locally to auto-fix
- **Type errors**: Fix TypeScript issues in your code
- **Build errors**: Ensure all packages build with `pnpm build`
- **Dependency issues**: Run `pnpm dedupe` and `pnpm check-deps`
- **Circular dependencies**: Review import structure

## Test Suite

The `Test Suite` workflow verifies the Vitest suites and the Supabase Deno integration tests on every push and pull request targeting `main`.

### Jobs

1. **Setup**
   - Checkout repository
   - Install pnpm 10.20.0 and Node.js 22 with pnpm caching
   - Install dependencies via `pnpm install --frozen-lockfile`
2. **Supabase**
   - Launches the local Supabase stack with `pnpm supa start`
   - Waits for the health check to report ready through `pnpm supa status`
3. **Tests**
   - Executes `pnpm test` which runs the lint/typecheck pipeline, Vitest suites, and Deno endpoint tests
   - Uploads `coverage/` artifacts for later inspection
4. **Teardown**
   - Streams Supabase logs when the job fails
   - Stops the Supabase containers to free runner resources

### Local Parity

Run the same commands locally before pushing:

```bash
pnpm supa start
pnpm test
pnpm supa stop
```

When Supabase is already running on your machine the `pnpm test` command will reuse the existing instance, matching the behaviour in CI.

## Contract Tests

This workflow runs only when pull requests touch third-party client code (address providers, Stripe/OpenAI integrations, or SendGrid email hooks) or the `contracts/` directory. It executes the MSW-backed contract suite and uploads the generated `contracts/generated` payloads as artifacts.

### Required Status Checks

Add `Contract Tests / contract-tests` to the branch protection rules for `main` so merges are gated on the contract suite.

### Local Development

Run the contract suite locally before opening a PR that updates any third-party integration:

```
pnpm test:contracts
```
