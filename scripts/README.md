# Production Deployment Scripts

Automated scripts for deploying SCF-Neue to production.

## 📋 Available Scripts

### `deploy-prod-full.sh`
**Complete production deployment orchestrator**

```bash
./scripts/deploy-prod-full.sh
```

Deploys everything:
- ✅ Database (reset + migrations + seed)
- ✅ Edge Functions (tRPC, job-import, news)
- ✅ Web App (via GitHub Actions)

**Options:**
```bash
./scripts/deploy-prod-full.sh --skip-db         # Skip database
./scripts/deploy-prod-full.sh --skip-functions  # Skip functions
./scripts/deploy-prod-full.sh --skip-web        # Skip web
./scripts/deploy-prod-full.sh --help            # Show help
```

### `deploy-db-prod.sh`
**Database-only deployment**

```bash
./scripts/deploy-db-prod.sh
```

- Resets production database
- Applies all migrations (currently 9)
- Seeds production data (CSI codes, universities, certifications, jobs)
- Generates TypeScript types

### `deploy-functions-prod.sh`
**Edge Functions-only deployment**

```bash
./scripts/deploy-functions-prod.sh
```

- Deploys tRPC router
- Deploys job-import function
- Deploys news function
- Lists deployed functions

### `verify-prod-deployment.sh`
**Deployment health check**

```bash
./scripts/verify-prod-deployment.sh
```

Verifies:
- Environment variables configured
- Database connection working
- Migrations applied
- Edge Functions responding
- API endpoints accessible

## 🚀 Quick Start

### Prerequisites

1. **Create `.env.production`** (see docs/deployment/PRODUCTION_DEPLOYMENT.md)
2. **Link Supabase project:**
   ```bash
   cd packages/supabase
   pnpx supabase link --project-ref YOUR-PROJECT-REF
   cd ../..
   ```
3. **Configure GitHub secrets** for automatic web deployment

### One-Command Deployment

```bash
pnpm deploy:prod:full
```

This runs `deploy-prod-full.sh` with all safety checks and prompts.

## 📦 Package.json Commands

Convenient aliases for the scripts:

```bash
pnpm deploy:prod:full       # Complete deployment
pnpm deploy:prod:db         # Database only
pnpm deploy:prod:functions  # Functions only
pnpm deploy:prod:web        # Web only (triggers GitHub Actions)
pnpm deploy:verify:prod     # Health check
```

## 🔒 Safety Features

### Pre-flight Checks
- Verifies `.env.production` exists
- Checks for uncommitted changes
- Validates Supabase project link
- Runs code quality checks

### Confirmation Prompts
- Database reset requires typing 'yes'
- Functions deployment requires y/n
- Full deployment requires y/n
- Option to cancel at any point

### Error Handling
- Scripts exit on error (`set -e`)
- Colored output (red/yellow/green)
- Detailed error messages
- Rollback instructions

## 📊 Deployment Flow

```
deploy-prod-full.sh
    ├── Pre-flight checks
    │   ├── Git status
    │   ├── Environment files
    │   └── Code quality (pnpm check)
    │
    ├── Database (deploy-db-prod.sh)
    │   ├── Confirm reset
    │   ├── Apply migrations
    │   ├── Seed data
    │   └── Generate types
    │
    ├── Functions (deploy-functions-prod.sh)
    │   ├── Deploy tRPC
    │   ├── Deploy job-import
    │   ├── Deploy news
    │   └── List functions
    │
    ├── Web (GitHub Actions)
    │   └── Trigger workflow
    │
    └── Summary
        └── Display results
```

## 🔍 Debugging

### Script Execution
```bash
# Add debug output
bash -x ./scripts/deploy-prod-full.sh

# Check script permissions
ls -la scripts/*.sh

# Make executable
chmod +x scripts/*.sh
```

### Environment Issues
```bash
# Verify .env.production
cat .env.production

# Test Supabase connection
cd packages/supabase
pnpx supabase db remote --status
```

### Deployment Issues
```bash
# Check deployment logs
pnpm deploy:verify:prod

# View GitHub Actions
gh run list --workflow=deploy-web.yml

# Supabase logs
# Visit: https://supabase.com/dashboard/project/_/logs
```

## 📖 Documentation

Full documentation: [docs/deployment/PRODUCTION_DEPLOYMENT.md](../docs/deployment/PRODUCTION_DEPLOYMENT.md)

## 🆘 Common Issues

### Database Connection Failed
```bash
cd packages/supabase
pnpx supabase link --project-ref YOUR-PROJECT-REF
```

### Functions Deployment Failed
- Check `import_map.json`
- Verify Supabase project linked
- Review function logs in dashboard

### Web Deployment Failed
- Check GitHub Actions logs
- Verify GitHub secrets set
- Check Netlify configuration

## 🎯 Best Practices

1. **Test locally first**
   ```bash
   pnpm supa:reset          # Test migrations locally
   pnpm supa:seed           # Test seeding locally
   pnpm web:build           # Test web build locally
   ```

2. **Use verification**
   ```bash
   pnpm deploy:verify:prod  # After deployment
   ```

3. **Monitor deployment**
   - Check Supabase Dashboard
   - Monitor GitHub Actions
   - Test production site

4. **Have rollback plan**
   - Supabase automatic backups
   - Git revert capability
   - Netlify rollback option

## 🔗 Related Scripts

- `deploy.sh` - Netlify-only deployment (existing)
- `build-production.sh` - Production build script (if exists)
- `seed-production.ts` - Production seeding (if exists)

## 📝 Notes

- Scripts require bash shell (macOS/Linux)
- Colored output uses ANSI escape codes
- All scripts are idempotent (safe to run multiple times)
- Scripts log all operations for debugging
