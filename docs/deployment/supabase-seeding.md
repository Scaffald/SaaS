# Supabase Seeding Guide

## Overview

This guide explains how to seed your Supabase databases (local, staging, production) using environment-specific commands.

## Prerequisites

- Ensure you have `.env` and `.env.production` files configured with the correct Supabase credentials
- All seed files are located in `packages/supabase/seeds/`
- Migrations must be up-to-date before seeding

## Available Commands

### Local/Development Seeding

```bash
# Seed local database (uses .env)
pnpm supa:seed

# Push migrations and seed local database
pnpm supa:push:seed
```

### Production Seeding

```bash
# Seed production database (uses .env.production)
pnpm supa:seed:prod

# Push migrations and seed production database
pnpm supa:push:seed:prod
```

### Migration Management

```bash
# Push migrations to local (uses .env)
pnpm supa:push

# Push migrations to production (uses .env.production)
pnpm supa:push:prod
```

### Type Generation

```bash
# Generate types from local database
pnpm supa:generate

# Generate types from remote database (uses .env)
pnpm supa:generate:remote

# Generate types from production database (uses .env.production)
pnpm supa:generate:prod
```

## Environment File Requirements

### .env (Local/Staging)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### .env.production
```bash
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
```

## Seeding Workflow

### 1. First-Time Production Seeding

```bash
# Step 1: Push migrations to production
pnpm supa:push:prod

# Step 2: Seed production database
pnpm supa:push:seed:prod
```

### 2. Re-seeding (with existing data)

If you encounter duplicate key errors, you have two options:

**Option A: Manual cleanup (recommended for production)**
- Manually delete existing seed data from specific tables
- Run seed command again

**Option B: Full reset (destructive - use with caution)**
```bash
# This will drop ALL data and re-run migrations + seeds
# Only use in development/staging environments
pnpm supa db reset
```

### 3. Development Workflow

```bash
# Make changes to seed files in packages/supabase/seeds/

# Test locally first
pnpm supa:push:seed

# If everything works, deploy to production
pnpm supa:push:seed:prod
```

## Seed Files

Current seed files are executed in order:
- `01_seed-industries.sql` - Industry reference data
- `02_seed-organizations.sql` - Organization data
- `03_seed-users.sql` - User accounts (50 realistic users)
- `05_seed-affiliates.sql` - Affiliate data
- `06_seed-soft-skills.sql` - Soft skills reference data
- `07_seed-test-users.sql` - Test users for development
- `08_seed-super-admins.sql` - Super admin users
- `09_seed-certifications.sql` - Certification reference data
- `09_seed-job-feeds.sql` - Job feed configurations
- `10_seed-jobs.sql` - Sample job postings

## Troubleshooting

### Error: "duplicate key value violates unique constraint"
This means seed data already exists. Options:
1. Delete existing seed data manually
2. Use `on conflict` clauses in seed files (already implemented for users)
3. Reset database completely (development only)

### Error: "function gen_salt(unknown) does not exist"
This has been fixed in migration `079_ensure_pgcrypto_extension.sql`. Ensure:
1. Migration has been applied: `pnpm supa:push` or `pnpm supa:push:prod`
2. Seed files use qualified function names: `extensions.gen_salt()` and `extensions.crypt()`

### Error: "permission denied"
Ensure your `.env` or `.env.production` file has the correct `SUPABASE_SERVICE_ROLE_KEY` (not the anon key).

## Best Practices

1. **Always test locally first** before seeding production
2. **Use version control** for all seed file changes
3. **Document seed data** - include comments explaining what each seed file does
4. **Idempotent seeds** - use `on conflict` clauses to make seeds re-runnable
5. **Backup before seeding production** - especially if modifying existing seed files
6. **Review seed data** - ensure no sensitive information is in version control

## Security Considerations

- Never commit actual production credentials to `.env.production`
- Use `.env.production.template` to document required variables
- Consider using separate seed files for production vs. development
- Test user passwords should be different from production patterns
- Review seed data for PII or sensitive information before committing

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Supabase Seeding Guide](https://supabase.com/docs/guides/database/seed-data)
- Project Seeding Documentation: `packages/supabase/docs/SEEDING.md`
