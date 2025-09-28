# GitHub Actions Workflows

## Monorepo Integrity & Code Quality

This workflow runs on every pull request and push to main branch to ensure code quality and monorepo integrity.

### Jobs

#### 1. Code Quality Checks
- **Format, Lint & Type Check**: Runs `yarn check` which includes:
  - `yarn format:fix` - Biome code formatting
  - `yarn lint:fix` - Biome linting
  - `yarn typecheck` - TypeScript type checking via Turbo
- **Build Verification**: Runs `yarn build` to ensure all packages build successfully

#### 2. Monorepo Integrity Checks
- **Dependency Deduplication**: Checks for duplicate dependencies in yarn.lock
- **Yarn Constraints**: Validates yarn workspace constraints
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
yarn check

# Build all packages
yarn build

# Check monorepo integrity
yarn check-deps
yarn lint-sherif
yarn check-circular-deps
```

### Troubleshooting

If checks fail:

- **Format/Lint errors**: Run `yarn check` locally to auto-fix
- **Type errors**: Fix TypeScript issues in your code
- **Build errors**: Ensure all packages build with `yarn build`
- **Dependency issues**: Run `yarn dedupe` and `yarn check-deps`
- **Circular dependencies**: Review import structure
