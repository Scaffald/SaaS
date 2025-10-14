# Deployment Scripts

This directory contains simplified deployment scripts for the SCF-Neue project.

## Available Scripts

### `pnpm deploy`

**Safe production deployment** - Pushes migrations, deploys functions, and triggers web deployment.

**What it does:**
- Pushes database migrations (no reset - safe)
- Deploys Edge Functions (trpc, job-import, news)
- Triggers web app deployment via GitHub Actions

**When to use:**
- Regular production deployments
- After adding new migrations
- When updating functions or web app

**Usage:**
```bash
pnpm deploy
```

### `pnpm deploy:reset`

**Destructive production deployment** - Resets database to match local state, then deploys everything.

**What it does:**
- **DROPS and recreates the entire database** ⚠️
- Applies all migrations
- Seeds production data (CSI codes, universities, certifications, jobs)
- Deploys Edge Functions
- Triggers web app deployment

**When to use:**
- Initial production setup
- When database needs to be reset to match local state
- **Temporary measure** - will be phased out once database is stable

**Usage:**
```bash
pnpm deploy:reset
```

**Warning:** This command requires typing `RESET` to confirm, as it's destructive.

## Prerequisites

### Required Environment Files

**`.env.production`** - Must contain:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET=your-service-role-key
# ... other production configs
```

### Required Setup

1. **Supabase Project Link:**
   ```bash
   pnpm supa link --project-ref YOUR-PROJECT-REF
   ```

2. **GitHub CLI (optional but recommended):**
   ```bash
   brew install gh
   gh auth login
   ```

## Deployment Workflow

### Standard Deployment

```bash
# 1. Make your changes
git add .
git commit -m "feat: add new feature"

# 2. Run code quality checks
pnpm check

# 3. Deploy to production
pnpm deploy
```

### Reset Deployment (Destructive)

```bash
# 1. Ensure local database is in desired state
pnpm supa:reset

# 2. Test locally
pnpm dev

# 3. Deploy to production with reset
pnpm deploy:reset
```

## What Gets Deployed

### Database
- **`pnpm deploy`**: Pushes new migrations only
- **`pnpm deploy:reset`**: Full reset + migrations + seed

### Edge Functions
Both scripts deploy:
- `trpc` - Main API router
- `job-import` - Job import function
- `news` - News aggregation function

### Web App
- Triggers GitHub Actions workflow
- Builds and deploys to Netlify
- Can monitor at: `gh run list --workflow=deploy-web.yml`

## Troubleshooting

### Database Migration Fails
```bash
# Check what migrations haven't been applied
pnpm supa db diff

# If migrations conflict, may need reset
pnpm deploy:reset
```

### Function Deployment Fails
```bash
# Deploy individual function
cd packages/supabase
pnpx supabase functions deploy trpc
```

### Seeding Fails
```bash
# Run seeding manually
pnpm env-prod pnpm --filter @app/supabase seed
```

### GitHub Actions Not Triggered
```bash
# Manual trigger
gh workflow run deploy-web.yml --ref production

# Or push to production branch
git push origin production
```

## Monitoring

### Check Deployment Status

```bash
# Check Supabase functions
pnpm supa functions list

# Check GitHub Actions
gh run list --workflow=deploy-web.yml

# Verify production deployment
pnpm supa status
```

### View Logs

- **Supabase Dashboard**: https://supabase.com/dashboard/project/_
- **Netlify Dashboard**: https://app.netlify.com/
- **GitHub Actions**: https://github.com/YOUR-ORG/SCF-Neue/actions

## Migration Path

**Current State:**
- `pnpm deploy` - Safe, incremental deployments
- `pnpm deploy:reset` - Temporary, destructive reset

**Future State:**
- `pnpm deploy` - Only deployment command needed
- `pnpm deploy:reset` - Will be removed once database is stable

## Security Notes

- Never commit `.env.production` to git
- Store production secrets in GitHub Secrets
- Use `SUPABASE_SECRET` (service role key) only for deployments
- Regular users should use `SUPABASE_ANON_KEY`

## Additional Resources

- [Production Deployment Guide](../docs/deployment/PRODUCTION_DEPLOYMENT.md)
- [Supabase Cloud Setup](../docs/deployment/supabase-cloud-setup.md)
- [GitHub Actions Setup](../docs/deployment/github-actions-netlify-setup.md)
