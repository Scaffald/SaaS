# Deployment Scripts

This directory contains deployment scripts for the SCF-Scaffald project.

## Helper Scripts

### `scripts/add-github-secrets.sh`

Sync GitHub Actions secrets from your local environment files.

**Usage:**
```bash
# Production (default)
./scripts/add-github-secrets.sh

# Preview
./scripts/add-github-secrets.sh preview
```

**Details:**
- Reads from `.env.production` or `.env.preview`
- Automatically applies the `PREVIEW_` prefix for preview secrets (e.g., `PREVIEW_EXPO_PUBLIC_URL`)
- Also sets optional Supabase secrets when present
- Requires GitHub CLI authentication (`gh auth login`)

## Interactive Deployment (Recommended)

### `pnpm prod`

**Interactive production deployment** - Prompts you to select which components to deploy with guards and dry runs.

**What it does:**
- Interactive menu to select deployment components:
  - Migrations (with `db diff` guard)
  - Functions (selective deployment)
  - Seed (production warning)
  - Database Reset (DESTRUCTIVE - with strong warnings)
- Pre-flight checks (uncommitted changes, Supabase link, .env.production)
- Guards and dry runs before each deployment step
- Non-blocking error handling (continues with other deployments if one fails)

**Usage:**
```bash
pnpm prod
```

### `pnpm preview`

**Interactive preview deployment** - Deploys to preview environment (Supabase fork) to avoid cross-contamination with production.

**What it does:**
- Uses `.env.preview` instead of `.env.production`
- Deploys to preview Supabase project (database fork)
- Same interactive menu as `pnpm prod` but with preview context
- Pre-flight checks verify you're deploying to preview, not production
- Interactive menu to select deployment components:
  - Migrations (with `db diff` guard)
  - Functions (selective deployment)
  - Seed (preview warning)
  - Database Reset (DESTRUCTIVE - resets preview database)

**Usage:**
```bash
pnpm preview
```

**Prerequisites:**
- Create `.env.preview` with preview Supabase credentials
- Link to preview Supabase project: `pnpm supa link --project-ref YOUR-PREVIEW-PROJECT-REF`
- Ensure you're on the preview branch (or confirm if on different branch)

**Example Workflow:**
1. Run `pnpm preview`
2. Select options (e.g., `1,2,3` for migrations, functions, and seed)
3. Review migration diff (if migrations selected)
4. Confirm each step as prompted
5. Review deployment summary

**Note:** The script will warn you if you're not on the preview branch and verify the linked Supabase project is the preview fork, not production.

**Aliases:**
- `pnpm deploy` → `pnpm prod`

**Example Workflow:**
1. Run `pnpm prod`
2. Select options (e.g., `1,2,3` for migrations, functions, and seed)
3. Review migration diff (if migrations selected)
4. Confirm each step as prompted
5. Review deployment summary

**Guards and Safety Features:**
- **Migrations**: Shows `pnpm supa db diff --linked` before applying changes
- **Functions**: Lists available functions and allows selective deployment
- **Seed**: Shows production warning before seeding
- **Reset**: Requires typing "RESET" to confirm destructive operation

## Legacy Scripts (Backward Compatibility)

### `pnpm deploy:reset`

**Destructive production deployment** - Resets database to match local state, then deploys everything.

**What it does:**
- **DROPS and recreates the entire database** ⚠️
- Applies all migrations
- Seeds production data
- Deploys Edge Functions
- Triggers web app deployment

**Usage:**
```bash
pnpm deploy:reset
```

**Warning:** This command requires typing `RESET` to confirm, as it's destructive.

**Note:** This functionality is also available in the interactive `pnpm prod` script (option 5).

### `pnpm deploy:aws` / `pnpm deploy:aws:prod`

**Local AWS deployment** - Build and deploy web app directly to AWS S3 + CloudFront from local machine.

**Usage:**
```bash
# Preview deployment
pnpm deploy:aws:preview

# Production deployment
pnpm deploy:aws:prod
```

### `pnpm deploy:verify`

**Production deployment verification** - Runs health checks on production deployment.

**Usage:**
```bash
pnpm deploy:verify
```

**What it checks:**
- Environment variables
- Database connection
- Migration status
- Edge Functions availability
- API endpoint health

## Database Migration Scripts

### `pnpm supa:db:push`

Push database migrations to linked remote project (uses local environment).

**Usage:**
```bash
pnpm supa:db:push
```

### `pnpm supa:db:push:prod`

Push database migrations to linked remote project (uses production environment).

**Usage:**
```bash
pnpm supa:db:push:prod
```

### `pnpm supa:db:push:preview`

Push database migrations to linked preview project (uses preview environment).

**Usage:**
```bash
pnpm supa:db:push:preview
```

### `pnpm supa:seed:preview`

Seed preview database (uses preview environment).

**Usage:**
```bash
pnpm supa:seed:preview
```

**Note:** These scripts are also integrated into the interactive `pnpm prod` and `pnpm preview` scripts.

## Prerequisites

### Required Environment Files

**`.env.production`** - For production deployments (`pnpm prod`):
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# ... other production configs
```

**`.env.preview`** - For preview deployments (`pnpm preview`):
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-preview-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-preview-service-role-key
# ... other preview configs (should point to preview Supabase fork)
```

### Required Setup

1. **Supabase Project Link:**
   ```bash
   pnpm supa link --project-ref YOUR-PROJECT-REF
   ```

2. **GitHub CLI (optional but recommended for GitHub Actions triggers):**
   ```bash
   brew install gh
   gh auth login
   ```

3. **AWS CLI (optional, for direct AWS deployments):**
   ```bash
   # macOS
   brew install awscli
   
   # Or via pip
   pip install awscli
   
   # Configure credentials
   aws configure
   ```

## Deployment Workflow

### Standard Interactive Deployment

```bash
# 1. Make your changes
git add .
git commit -m "feat: add new feature"

# 2. Run code quality checks (optional, script will warn if skipped)
pnpm check

# 3. Deploy interactively
pnpm prod
# Select options: 1,2,3 (migrations, functions, seed)
# Review diff, confirm each step
```

### Selective Component Deployment

```bash
# Deploy only migrations
pnpm prod
# Select: 1

# Deploy only functions
pnpm prod
# Select: 2

# Deploy only AWS (preview)
pnpm deploy:aws:preview
```

## What Gets Deployed

### Database Migrations
- Shows diff before applying (`pnpm supa db diff --linked`)
- Prompts for confirmation if changes detected
- Pushes migrations safely (no reset unless option 5 selected)

### Edge Functions
- Available functions:
  - `trpc` - Main API router
  - `job-import` - Job import function
  - `news` - News aggregation function
- Select which functions to deploy
- Deploys individually with status feedback

### Database Seeding
- Shows production warning
- Requires confirmation before seeding
- Uses production environment variables

### AWS Deployment
- Deploys to S3 bucket and invalidates CloudFront cache
- Supports multiple environments (dev, preview, production)
- Builds workspace packages first
- Verifies build output before deployment

## Troubleshooting

### Migration Diff Shows No Changes
This means your remote database is already up to date. No action needed.

### Migration Push Fails
```bash
# Check migration status
pnpm supa db diff --linked

# If needed, check remote status
pnpm supa projects list
```

### Function Deployment Fails
```bash
# Deploy individual function manually
cd packages/supabase
pnpx supabase functions deploy trpc
```

### Seeding Fails
```bash
# Run seeding manually
pnpm supa:seed:prod
```

### AWS Deployment Fails
```bash
# Check build locally first
pnpm web:build

# Verify AWS credentials
aws sts get-caller-identity

# Verify environment variables
cat .env.production
```

### GitHub Actions Not Triggered
```bash
# Manual trigger
gh workflow run deploy-web.yml --ref prod

# Or push to production branch
git push origin prod
```

## Monitoring

### Check Deployment Status

```bash
# Verify deployment health
pnpm deploy:verify

# Check Supabase functions
pnpm supa functions list

# Check GitHub Actions
gh run list --workflow=deploy-web.yml

# Verify production deployment
pnpm supa status
```

### View Logs

- **Supabase Dashboard**: https://supabase.com/dashboard/project/_
- **AWS CloudWatch**: https://console.aws.amazon.com/cloudwatch/
- **GitHub Actions**: https://github.com/YOUR-ORG/SCF-Scaffald/actions

## Legacy Scripts Archive

Legacy deployment scripts have been archived to `scripts/archive/`:
- `deploy.sh.legacy` - Original safe deployment script
- `deploy-preview.sh.legacy` - Original preview deployment script (replaced by `deploy.sh preview`)
- `deploy-production.sh.legacy` - Original production deployment script (replaced by `deploy.sh production`)

These scripts are kept for reference but are superseded by the unified `deploy.sh` script. The following scripts remain available for specific use cases:
- `deploy-reset.sh` - Standalone database reset script (`pnpm deploy:reset`)
- `deploy-aws.sh` - Standalone AWS deployment script (`pnpm deploy:aws`)
- `verify-prod-deployment.sh` - Production deployment verification (`pnpm deploy:verify`)
- `test-api.sh` - Quick REST API health checks (see [API Testing Guide](../docs/API_TESTING_GUIDE.md))
- `test-api-keys.mjs` / `test-api-keys.sh` - API key validation
- `apply-inbound-email-migration.sh` - Inbound email setup
- `setup-docs-domain.sh` / `setup-docs-domain-github-pages.sh` - Docs site domain setup

## Security Notes

- Never commit `.env.production` to git
- Store production secrets in GitHub Secrets
- Use `SUPABASE_SERVICE_ROLE_KEY` (service role key) only for deployments
- Regular users should use `SUPABASE_ANON_KEY`
- Always review migration diffs before applying
- Use preview deployments for testing before production

## Additional Resources

- [Production Deployment Guide](../docs/deployment/PRODUCTION_DEPLOYMENT.md)
- [Supabase Cloud Setup](../docs/deployment/supabase-cloud-setup.md)
- [AWS Setup Guide](../docs/deployment/aws-setup.md)
