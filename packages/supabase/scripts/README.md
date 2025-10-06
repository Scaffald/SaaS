# Supabase Scripts Documentation

This directory contains scripts for managing database operations, seeding data, and testing permissions.

## Quick Start

### Complete Database Setup
Reset database, run migrations, seed data, and test permissions:
```bash
pnpm --filter @app/supabase db:setup
```

### Individual Operations

#### Reset Database
```bash
pnpm supa db reset
```

#### Seed Data Only
```bash
pnpm --filter @app/supabase seed
```

#### Test Permissions
```bash
pnpm --filter @app/supabase test:permissions
```

#### Reset and Seed
```bash
pnpm --filter @app/supabase db:reset:seed
```

## Available Scripts

### Database Management

#### `db:reset`
Resets the local database and applies all migrations.
```bash
pnpm --filter @app/supabase db:reset
```

#### `db:reset:seed`
Resets database and seeds with development data.
```bash
pnpm --filter @app/supabase db:reset:seed
```

#### `db:setup`
Complete setup: reset, seed, and test.
```bash
pnpm --filter @app/supabase db:setup
```

### Seeding

#### `seed`
Seeds the database with external jobs from RSS feeds.
- Verifies skills and industries are present
- Imports jobs from active job feeds
- Imports 10 jobs per feed by default
- Displays statistics after completion

```bash
pnpm --filter @app/supabase seed
```

**What it seeds:**
- External jobs (30 jobs from 3 feeds)
- Verifies 71 skills are present
- Verifies 4 industries are present

#### `seed-csi`
Seeds CSI (Construction Specifications Institute) MasterFormat data.
```bash
pnpm --filter @app/supabase seed-csi
```

### Testing

#### `test:permissions`
Tests database permissions for all roles (anon, authenticated, service_role).
```bash
pnpm --filter @app/supabase test:permissions
```

**Tests performed:**
- Anonymous access to external_jobs
- Service role access with joins
- Job feeds access
- Related table permissions

## Script Details

### seed-all.ts
Comprehensive seeding script for development data.

**Features:**
- Verifies base data (skills, industries)
- Fetches jobs from RSS feeds
- Imports configurable number of jobs per feed
- Updates feed metadata (last_fetched_at, error_count)
- Displays database statistics
- Error handling and retry logic

**Environment Variables:**
- `SUPABASE_URL` - Defaults to http://127.0.0.1:54321
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Required

**Output:**
```
🌱 Starting Database Seeding...

📊 Verifying Skills Data...
✅ Found 71 skills in database

🏭 Verifying Industries Data...
✅ Found 4 industries in database

💼 Seeding External Jobs...
   Found 3 active job feeds
   ✅ Imported 10 jobs from WeWorkRemotely - All Jobs
   ✅ Imported 10 jobs from WeWorkRemotely - Programming
   ✅ Imported 10 jobs from WeWorkRemotely - Design

✅ Seeding complete! Imported 30 jobs.

📊 Database Statistics
==================================================
Total Jobs: 30
Active Jobs: 30
Total Skills: 71
Total Industries: 4
Active Feeds: 3
```

### test-external-jobs-permissions.ts
Permission testing script for external jobs feature.

**What it tests:**
1. Anonymous user access to external_jobs table
2. Service role access with industry joins
3. Job feeds access
4. Related table grants (industries, skills)

**Environment Variables:**
- `SUPABASE_URL` - Defaults to http://127.0.0.1:54321
- `SUPABASE_ANON_KEY` - Required
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Required

**Output:**
```
🔍 Testing External Jobs Permissions

✅ Anonymous access successful - Found 5 jobs
✅ Service role access successful - Found 5 jobs with industries
✅ Job feeds access successful - Found 3 active feeds

Overall: ✅ ALL TESTS PASSED
```

### import-jobs.ts
Legacy job import script (superseded by seed-all.ts).

Use `seed-all.ts` for new development.

## Development Workflow

### Initial Setup
1. Start Supabase:
   ```bash
   pnpm supa start
   ```

2. Setup database:
   ```bash
   pnpm --filter @app/supabase db:setup
   ```

3. Verify:
   - Check Supabase Studio: http://127.0.0.1:54323
   - Review external_jobs table
   - Check external_job_feeds table

### After Migrations
When you add new migrations:

```bash
pnpm supa db reset
pnpm --filter @app/supabase seed
```

### Testing Changes
After modifying permissions or RLS policies:

```bash
pnpm --filter @app/supabase test:permissions
```

### Troubleshooting

#### Permission Errors
If you get "permission denied" errors:

1. Check grants exist:
   ```sql
   SELECT grantee, privilege_type 
   FROM information_schema.role_table_grants 
   WHERE table_name = 'external_jobs';
   ```

2. Check RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'external_jobs';
   ```

3. Run permission tests:
   ```bash
   pnpm --filter @app/supabase test:permissions
   ```

#### Seeding Fails
If seeding fails:

1. Verify migrations applied:
   ```bash
   pnpm supa db reset
   ```

2. Check base data exists:
   - Skills should have 71 records
   - Industries should have 4 records
   - Job feeds should have 3 active records

3. Check RSS feed URLs are accessible

#### Empty Results
If queries return no data:

1. Run seeding:
   ```bash
   pnpm --filter @app/supabase seed
   ```

2. Verify data in Supabase Studio

3. Check RLS policies aren't filtering everything

## Package.json Scripts Reference

```json
{
  "scripts": {
    "seed": "Seed database with development data",
    "test:permissions": "Test database permissions",
    "db:reset": "Reset database and apply migrations",
    "db:reset:seed": "Reset and seed database",
    "db:setup": "Complete setup: reset, seed, test"
  }
}
```

## Environment Variables

### Local Development
Set these in your shell or `.env.local`:

```bash
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<your-anon-key>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-service-role-key>
```

Get keys from:
```bash
pnpm supa status
```

### Required for Scripts
- **seed**: `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **test:permissions**: `SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Related Documentation

- [Migration Consolidation](../migrations/MIGRATION_CONSOLIDATION.md)
- [Migration Best Practices](../migrations/BEST_PRACTICES.md)
- [tRPC Supabase Patterns](../../.cursor/rules/trpc-supabase-patterns.mdc)
- [Job Import README](../functions/README-JOB-IMPORT.md)
