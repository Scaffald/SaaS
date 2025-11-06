# Remote Database Reset Guide

## Overview

When migrating to a new schema structure (like moving from `public`/`private` to `core` schema), you may need to reset the remote database to apply all migrations fresh.

## Prerequisites

1. **Linked Project**: Your local project must be linked to the remote Supabase project
   ```bash
   pnpm supa link --project-ref YOUR-PROJECT-REF
   ```

2. **Config Pushed**: Ensure API schemas are configured
   ```bash
   pnpm supa config push
   ```

## Method 1: CLI Reset (Recommended)

### Basic Reset
```bash
pnpm supa db reset --linked --yes
```

This will:
- Drop all tables and data
- Reapply all migrations (001-007)
- Run seed scripts automatically

### Reset with Direct Connection (if pooler fails)
If you get connection errors, try relinking with `--skip-pooler`:
```bash
pnpm supa link --skip-pooler --project-ref YOUR-PROJECT-REF
pnpm supa db reset --linked --yes
```

## Method 2: Dashboard SQL Editor

If CLI connection fails, use the Supabase Dashboard:

1. Go to **SQL Editor** in your Supabase Dashboard
2. Run this to check current schema:
   ```sql
   SELECT schema_name 
   FROM information_schema.schemata 
   WHERE schema_name IN ('core', 'cms', 'public', 'private');
   ```

3. If `core` schema doesn't exist or is empty, you can:
   - **Option A**: Use the Dashboard's "Reset Database" feature (if available)
   - **Option B**: Manually run migrations via SQL Editor
   - **Option C**: Contact Supabase support if project appears paused

## Method 3: Manual Migration via SQL

If you need to manually apply, you can copy/paste migration files into SQL Editor:

1. Open each migration file (001_schema.sql through 007_indexes.sql)
2. Copy and paste into SQL Editor
3. Run in order
4. Then run seed files

**Note**: This is tedious but works if CLI is unavailable.

## Troubleshooting

### Connection Refused Errors

**Possible causes:**
- Database is paused (free tier inactivity)
- IP restrictions enabled
- Network/firewall blocking
- Pooler service issues

**Solutions:**
1. Check project status in dashboard
2. Verify database is active (not paused)
3. Check IP restrictions in Project Settings → Database → Network Restrictions
4. Try direct connection (skip pooler)
5. Wait a few minutes and retry (temporary service issues)

### Schema Cache Errors

After pushing config changes, PostgREST needs to reload its schema cache. This can take 30-60 seconds.

**Wait and retry:**
- API calls may fail temporarily
- Wait 1-2 minutes after `config push`
- Test API endpoints again

### Migration Conflicts

If migrations show as applied but schema doesn't match:

```bash
# Check migration status
pnpm supa migration list --linked

# Repair migration history if needed
pnpm supa migration repair --status reverted MIGRATION_NAME
```

## Verification

After reset, verify:

1. **Schemas exist:**
   ```sql
   SELECT schema_name FROM information_schema.schemata 
   WHERE schema_name IN ('core', 'cms');
   ```

2. **Tables exist in core:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'core' 
   ORDER BY table_name;
   ```

3. **API works:**
   ```bash
   curl https://YOUR-PROJECT.supabase.co/rest/v1/ \
     -H "apikey: YOUR-ANON-KEY" \
     -H "Authorization: Bearer YOUR-ANON-KEY"
   ```

4. **tRPC endpoints work:**
   Test your application endpoints

## Post-Reset Steps

1. **Verify seeds ran:**
   ```sql
   SELECT COUNT(*) FROM core.industries;
   SELECT COUNT(*) FROM core.users;
   SELECT COUNT(*) FROM cms.welcome_slides;
   ```

2. **Regenerate types:**
   ```bash
   pnpm supa:generate:remote
   ```

3. **Test application:**
   - Authentication
   - Data queries
   - API endpoints

## Important Notes

⚠️ **WARNING**: `db reset` will **DELETE ALL DATA** in the remote database. Only use this for:
- Initial production setup
- Development/staging environments
- When schema changes are incompatible with existing data

For production with existing data, use migrations instead of reset.



