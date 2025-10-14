# Production Deployment Guide

Complete guide for deploying SCF-Neue to production, including database, Edge Functions, and web application.

## 🎯 Quick Start

### One-Command Full Deployment

```bash
pnpm deploy:prod:full
```

This single command orchestrates:
1. ✅ Database reset + migrations + seeding
2. ✅ Edge Functions deployment
3. ✅ Web app deployment (via GitHub Actions)

### Individual Component Deployment

```bash
# Database only (reset + migrations + seed)
pnpm deploy:prod:db

# Edge Functions only
pnpm deploy:prod:functions

# Web app only (triggers GitHub Actions)
pnpm deploy:prod:web

# Verify deployment health
pnpm deploy:verify:prod
```

## 📋 Prerequisites

### 1. Environment Configuration

Create `.env.production` in project root:

```bash
# Supabase Production Credentials
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SECRET=your-service-role-key

# App Configuration
EXPO_PUBLIC_URL=https://your-production-domain.com

# OAuth (Production)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
EXPO_PUBLIC_GOOGLE_IOS_SCHEME=com.yourapp.scaffald

# Mapbox
EXPO_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
EXPO_PUBLIC_MAPBOX_STYLE_URL=your-style-url
EXPO_PUBLIC_MAPBOX_API_URL=https://api.mapbox.com

# Database Connection (for seeding scripts)
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

### 2. Supabase Project Setup

1. **Create Supabase Project**
   - Visit [supabase.com](https://supabase.com)
   - Create new project
   - Note project reference ID

2. **Link Local Project to Production**
   ```bash
   cd packages/supabase
   pnpx supabase link --project-ref your-project-ref
   pnpx supabase db remote --status  # Verify connection
   cd ../..
   ```

### 3. GitHub Secrets Configuration

Set these secrets in GitHub repository settings:

```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_URL
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
EXPO_PUBLIC_GOOGLE_IOS_SCHEME
EXPO_PUBLIC_MAPBOX_TOKEN
EXPO_PUBLIC_MAPBOX_STYLE_URL
EXPO_PUBLIC_MAPBOX_API_URL
NETLIFY_AUTH_TOKEN
NETLIFY_SITE_ID
```

### 4. Netlify Configuration

1. Create Netlify site
2. Note site ID
3. Generate auth token (User Settings → Applications)
4. Add to GitHub secrets

## 🚀 Deployment Workflow

### Full Production Deployment

```bash
# Complete deployment
pnpm deploy:prod:full
```

**What it does:**
1. Pre-flight checks (uncommitted changes, env files)
2. Code quality checks (`pnpm check`)
3. Database deployment:
   - Reset production database
   - Apply all 9 migrations
   - Seed production data (industries, CSI codes, universities, certifications, jobs)
4. Edge Functions deployment:
   - Deploy tRPC router
   - Deploy job-import function
   - Deploy news function
5. Web app deployment:
   - Trigger GitHub Actions workflow
   - Build via GitHub Actions
   - Deploy to Netlify
6. Verification:
   - Generate TypeScript types from production
   - Display deployment summary

**Interactive Prompts:**
- Confirm production deployment (y/n)
- Confirm database reset (type 'yes')
- Confirm functions deployment (y/n)

### Database-Only Deployment

```bash
pnpm deploy:prod:db
```

**Use when:**
- Schema changes (new migrations)
- Data updates (seeding changes)
- Database reset needed

**Process:**
1. Confirms reset (destructive)
2. Checks Supabase project link
3. Pushes all migrations to production
4. Runs seed scripts:
   - CSI MasterFormat codes
   - Universities catalog
   - Certifications catalog
   - External jobs from RSS feeds
5. Generates TypeScript types

### Functions-Only Deployment

```bash
pnpm deploy:prod:functions
```

**Use when:**
- tRPC router changes
- Function logic updates
- New function endpoints

**Deploys:**
- `trpc` - Main API router
- `job-import` - Job import functionality
- `news` - News aggregation

### Web-Only Deployment

```bash
pnpm deploy:prod:web
```

**Use when:**
- UI changes only
- Frontend updates
- No database/function changes

**Process:**
- Triggers GitHub Actions `deploy-web.yml` workflow
- GitHub Actions builds the app
- Deploys to Netlify automatically

## 🔍 Deployment Verification

```bash
pnpm deploy:verify:prod
```

**Checks:**
1. Environment variables set correctly
2. Database connection successful
3. Migrations applied
4. Edge Functions responding
5. API endpoints accessible

## 📊 Deployment Scripts Details

### `deploy-prod-full.sh`

**Features:**
- Orchestrates complete deployment
- Optional component skipping (`--skip-db`, `--skip-functions`, `--skip-web`)
- Pre-flight safety checks
- Code quality validation
- Deployment summary

**Usage:**
```bash
./scripts/deploy-prod-full.sh              # Full deployment
./scripts/deploy-prod-full.sh --skip-web   # Skip web deployment
./scripts/deploy-prod-full.sh --help       # Show options
```

### `deploy-db-prod.sh`

**Features:**
- Database reset confirmation
- Migration application
- Production data seeding
- Type generation
- Connection verification

**Safety:**
- Requires typing 'yes' to confirm
- Verifies .env.production exists
- Checks Supabase link status
- Validates environment variables

### `deploy-functions-prod.sh`

**Features:**
- Deploys all Edge Functions
- Lists deployed functions
- Validates deployment

**Functions Deployed:**
- tRPC (main API)
- job-import
- news

### `verify-prod-deployment.sh`

**Verification Steps:**
1. Environment variable validation
2. Database connection test
3. Migration count check
4. Edge Functions list
5. API endpoint health check

## 🔐 Security Considerations

### Environment Variables

**Never commit:**
- `.env.production`
- Service role keys
- OAuth secrets

**Keep secure:**
- Store in password manager
- Use GitHub secrets for CI/CD
- Rotate keys regularly

### Database Access

**RLS Policies:**
- All migrations include RLS policies
- User data isolated by `auth.uid()`
- Admin access controlled by roles

**Backup Strategy:**
- Supabase automatic backups (Point-in-Time Recovery)
- Manual backups before major deployments
- Test restore procedures

## 🚨 Troubleshooting

### Common Issues

#### 1. Supabase Not Linked

**Error:** `Database connection failed`

**Solution:**
```bash
cd packages/supabase
pnpx supabase link --project-ref YOUR-PROJECT-REF
pnpx supabase db remote --status
```

#### 2. Migration Failures

**Error:** `Migration failed`

**Solutions:**
- Check migration syntax
- Verify no conflicting migrations
- Review Supabase logs
- Manual rollback if needed

#### 3. Function Deployment Issues

**Error:** `tRPC deployment failed`

**Solutions:**
- Check `import_map.json`
- Verify all dependencies listed
- Review function logs
- Test locally first

#### 4. Seeding Failures

**Error:** `Seeding completed with warnings`

**Solutions:**
- Check seed data files exist
- Verify database connection
- Review seed script logs
- Ensure tables exist (migrations applied)

### Manual Rollback

**Database:**
1. Use Supabase Dashboard backup restore
2. Or manual SQL backup restore

**Functions:**
1. Deploy previous version
2. Check function versions in dashboard

**Web:**
1. Rollback in Netlify dashboard
2. Or re-deploy previous commit

## 📈 Build Optimization

### GitHub Actions Strategy

**Why GitHub Actions + Netlify?**
- Avoids Netlify build timeout (10 min)
- Faster builds with caching
- More build resources
- Better control over process

**Build Process:**
1. GitHub Actions builds all packages
2. Incremental builds (UI → Core → Schemas → Web)
3. Dependency caching
4. Pre-built artifacts uploaded
5. Netlify deploys pre-built files (fast)

### Performance Tips

**Local Development:**
- Use local Supabase for testing
- Test migrations locally first
- Verify seeds work locally

**Production Deployment:**
- Deploy database changes during low traffic
- Monitor function logs after deployment
- Test critical paths immediately
- Have rollback plan ready

## 🔄 Continuous Deployment

### Automatic Deployment

**On push to `main`:**
- GitHub Actions builds web app
- Auto-deploys to Netlify
- Runs quality checks

**Manual Deployment:**
- Use `pnpm deploy:prod:full`
- Or trigger GitHub Actions manually
- Or deploy individual components

### Deployment Checklist

Before deploying:
- [ ] Code quality checks pass locally (`pnpm check`)
- [ ] All tests passing
- [ ] Migrations tested locally
- [ ] .env.production updated
- [ ] GitHub secrets current
- [ ] Backup database (optional but recommended)

After deploying:
- [ ] Run verification (`pnpm deploy:verify:prod`)
- [ ] Test authentication flows
- [ ] Verify API endpoints
- [ ] Check function logs
- [ ] Test critical user paths
- [ ] Monitor error rates

## 📚 Additional Resources

- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Netlify Deployment](https://docs.netlify.com/)
- [GitHub Actions](https://docs.github.com/en/actions)

## 🆘 Getting Help

If deployment fails:

1. **Check deployment logs:**
   - GitHub Actions logs
   - Supabase function logs
   - Netlify deployment logs

2. **Verify configuration:**
   - `.env.production` complete
   - GitHub secrets set
   - Supabase project linked

3. **Test locally:**
   - Run migrations locally
   - Test functions locally
   - Build web app locally

4. **Manual intervention:**
   - Supabase Dashboard for database
   - GitHub Actions for re-runs
   - Netlify Dashboard for deploys

## 🎉 Success!

After successful deployment:

1. **Verify Production:**
   ```bash
   pnpm deploy:verify:prod
   ```

2. **Test Website:**
   - Visit production URL
   - Test authentication
   - Verify data loading

3. **Monitor:**
   - Supabase Dashboard
   - Netlify Analytics
   - Error tracking

4. **Celebrate! 🎊**
