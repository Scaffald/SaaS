# Private Schema Migration Guide

**Created:** October 12, 2025  
**Status:** Production-Ready

## Overview

This guide documents the migration of personally identifiable information (PII) from the `public` schema to a dedicated `private` schema for enhanced security and compliance.

## What Changed

### Schema Structure

#### Before (Old Structure)
```sql
public.profiles                -- Redundant with users table
public.user_private           -- PII data mixed with public schema
public.user_preferences       -- User settings in public schema
public.applications           -- Sensitive application data
public.application_messages   -- Communication data
public.connections            -- Relationship data
public.invites                -- Email addresses
```

#### After (New Structure)
```sql
-- Private Schema (All PII)
private.profile               -- All personally identifiable information
private.preferences           -- User settings and career preferences
private.applications          -- Job applications
private.application_messages  -- Application communications
private.application_inquiries -- Job negotiations and offers
private.connections           -- Social relationships
private.invites               -- Email addresses and invitation tokens

-- Public Schema (Non-PII only)
public.users                  -- Public profile data (merged old profiles table)
```

### Key Changes

1. **Removed `public.profiles` table** - Fields merged into `public.users`
   - `users.about` - from `profiles.about`
   - `users.avatar_path` - from `profiles.avatar_path`

2. **Renamed for clarity**
   - `public.user_private` → `private.profile`
   - `public.user_preferences` → `private.preferences`

3. **Moved to private schema**
   - All application-related tables
   - Connection and invitation tables

## Migration Files

The following migration files have been updated:

- `001_extensions_and_base_schema.sql` - Core schema and private schema creation
- `002_organizations_jobs_skills.sql` - Business tables and private schema tables
- `026_critical_rls_and_permissions.sql` - Updated security policies

## Application Code Updates

### tRPC Routers

Updated routers to use new schema:

```typescript
// Before
.from("user_private")
.from("user_preferences")

// After  
.from("private.profile")
.from("private.preferences")
```

**Files Changed:**
- `packages/supabase/functions/trpc/routers/prerequisites.router.ts`
- `packages/supabase/functions/trpc/routers/profile/completion.router.ts`

### Type Generation

After migration, regenerate TypeScript types:

```bash
pnpm supa:generate
```

## Deployment Steps

### For Development (Fresh Database)

1. **Reset local database**
   ```bash
   pnpm supa db reset
   ```

2. **Regenerate types**
   ```bash
   pnpm supa:generate
   ```

3. **Test prerequisites flow**
   - Create new user account
   - Complete prerequisites form
   - Verify data saved correctly

### For Production (Existing Database)

⚠️ **WARNING: This is a breaking change requiring downtime**

#### Option 1: Blue-Green Deployment (Recommended)

1. **Create new Supabase project** with new schema
2. **Migrate data** from old to new schema
3. **Deploy application** pointing to new database
4. **Verify** everything works
5. **Switch DNS/routing** to new deployment
6. **Deprecate** old database after verification period

#### Option 2: In-Place Migration (Requires Downtime)

1. **Schedule maintenance window**

2. **Backup current database**
   ```bash
   # Using Supabase CLI
   supabase db dump -f backup-$(date +%Y%m%d).sql
   ```

3. **Create private schema and copy data**
   ```sql
   BEGIN;
   
   -- Create private schema
   CREATE SCHEMA IF NOT EXISTS private;
   GRANT USAGE ON SCHEMA private TO authenticated, service_role;
   
   -- Migrate user_private to private.profile
   CREATE TABLE private.profile AS 
   SELECT * FROM public.user_private;
   
   -- Migrate user_preferences to private.preferences  
   CREATE TABLE private.preferences AS
   SELECT * FROM public.user_preferences;
   
   -- Migrate applications
   CREATE TABLE private.applications AS
   SELECT * FROM public.applications;
   
   -- Add constraints, indexes, RLS policies
   -- (Copy from migration 001 and 002)
   
   COMMIT;
   ```

4. **Update application code** and deploy

5. **Verify data migration**
   ```sql
   -- Check record counts match
   SELECT 
     (SELECT COUNT(*) FROM public.user_private) as old_count,
     (SELECT COUNT(*) FROM private.profile) as new_count;
   ```

6. **Drop old tables** (after verification period)
   ```sql
   DROP TABLE public.user_private CASCADE;
   DROP TABLE public.user_preferences CASCADE;
   ```

## Verification Checklist

After migration, verify:

- [ ] All users can log in
- [ ] Prerequisites form saves data correctly
- [ ] Profile data displays properly
- [ ] Applications can be created and viewed
- [ ] No PII exposed in public schema
- [ ] RLS policies working correctly
- [ ] Service role can access private schema
- [ ] Authenticated users see only their own data

## Security Benefits

### Before
- PII mixed with public schema
- Table names not clearly indicating sensitive data
- Redundant profiles table
- Harder to audit PII access

### After
✅ **Clear security boundaries** - `private` schema explicitly marks PII  
✅ **Schema-level permissions** - Can grant/revoke at schema level  
✅ **Self-documenting** - Schema name indicates data sensitivity  
✅ **Audit-friendly** - Easy to identify all PII tables  
✅ **Cleaner structure** - No redundant tables, clear naming

## Rollback Plan

If issues arise:

1. **Keep backup** of database before migration
2. **Revert application** to previous version
3. **Restore database** from backup if needed
   ```bash
   psql -h localhost -U postgres -d postgres < backup.sql
   ```

## Testing

### Local Testing

```bash
# Reset and test
pnpm supa db reset
pnpm supa:generate

# Start development
pnpm dev

# Test user flow
# 1. Sign up new user
# 2. Complete prerequisites
# 3. Verify profile data
# 4. Check database for PII location
```

### Production Testing

- [ ] Test in staging environment first
- [ ] Run through complete user journey
- [ ] Verify analytics and monitoring
- [ ] Test backup/restore procedures
- [ ] Load test with production-like data

## Support

For issues or questions:
- Check Supabase logs for migration errors
- Review RLS policy violations in logs
- Verify service role has proper grants
- Check application error tracking (Sentry, etc.)

## References

- [Supabase Schemas Documentation](https://supabase.com/docs/guides/database/schemas)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [GDPR Compliance Best Practices](https://gdpr.eu/data-protection/)
