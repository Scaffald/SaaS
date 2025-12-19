# Migration Consolidation Documentation

## Overview
This document tracks migration consolidation efforts and provides guidance for maintaining a clean migration history.

## External Jobs Permissions Fix (October 2024)

### Problem Identified
The tRPC endpoint `jobs.getExternalJobs` was failing with:
```
permission denied for table external_jobs
```

### Root Cause
The original migration (`043_create_external_job_feeds.sql`) created RLS policies for `anon` and `authenticated` roles but did **not** grant table-level permissions. PostgreSQL requires **both** table grants AND RLS policies for access to work correctly.

When tRPC uses the service role with an auth header, it respects RLS policies but still needs table-level grants for the `authenticated` role.

### Migration History

#### Initial Implementation
- **043_create_external_job_feeds.sql**: Created external jobs tables with RLS policies
- **044_setup_job_import_cron.sql**: Set up cron job for importing jobs

#### Attempted Fixes (Incomplete)
- **20251006010511_grant_service_role_job_access.sql**: Added `service_role` grants only
- **20251006011357_fix_external_jobs_anon_access.sql**: Added `anon` grants only

❌ **Problem**: These migrations only partially addressed the issue. The `authenticated` role still lacked table-level grants, causing failures when tRPC used service role with auth context.

#### Comprehensive Fix
- **045_fix_external_jobs_permissions.sql**: Complete permissions fix
  - Grants table-level SELECT to `anon` and `authenticated`
  - Grants ALL to `service_role`
  - Ensures RLS policies are active and correct
  - Includes related tables (`industries`, `skills`)

✅ **Result**: All permission tests pass. Anonymous, authenticated, and service role access works correctly.

### Redundant Migrations

The following migrations are now **redundant** (superseded by migration 045):
- `20251006010511_grant_service_role_job_access.sql`
- `20251006011357_fix_external_jobs_anon_access.sql`

**Note**: These cannot be removed without breaking existing databases, so they remain in place. Future fresh installations will apply all migrations in sequence, which is safe (grants are idempotent).

### Lessons Learned

1. **Always grant table permissions to all relevant roles**
   - `anon` - For public read access
   - `authenticated` - For logged-in user access
   - `service_role` - For admin/service operations

2. **RLS policies alone are insufficient**
   - PostgreSQL enforces table-level grants first
   - Then RLS policies filter rows
   - Both layers are required

3. **Test with actual client patterns**
   - tRPC uses service role with auth headers
   - This respects RLS but needs proper grants
   - Test both anonymous and authenticated access

4. **Include related tables in permission grants**
   - Foreign key relationships need grants too
   - Example: `industries` table needed for joins

## Permission Architecture Pattern

### Correct Pattern for Public Tables

```sql
-- 1. Create table
CREATE TABLE example_table (...);

-- 2. Enable RLS
ALTER TABLE example_table ENABLE ROW LEVEL SECURITY;

-- 3. Grant table-level permissions
GRANT SELECT ON example_table TO anon, authenticated;
GRANT ALL ON example_table TO service_role;

-- 4. Create RLS policies
CREATE POLICY example_read ON example_table
  FOR SELECT TO anon, authenticated
  USING (is_public = true);

-- 5. Grant access to related tables
GRANT SELECT ON related_table TO anon, authenticated;
GRANT ALL ON related_table TO service_role;
```

### Security Layers

1. **Table Grants** (First layer)
   - Controls which operations are allowed
   - Must be granted explicitly to each role
   
2. **RLS Policies** (Second layer)
   - Filters which rows are visible/modifiable
   - Applied after table grants
   - Can reference auth context (`auth.uid()`)

3. **Application Logic** (Third layer)
   - Additional validation in tRPC/API
   - Business rules enforcement
   - Authorization checks

## Future Consolidation Strategy

### For New Tables
- Include complete permissions in initial migration
- Don't create separate "fix" migrations
- Use the pattern above from the start

### For Existing Tables
- Audit all tables for proper grants
- Create comprehensive fix migrations when needed
- Document any partial fixes as redundant

### Migration Naming Convention
- Use numbered sequence for core features: `001_`, `002_`, etc.
- Use timestamps for fixes: `YYYYMMDDHHMMSS_`
- Use descriptive names: `fix_table_permissions`, `grant_role_access`

## Testing Checklist

When adding new tables with RLS:

- [ ] Table grants for `anon` role
- [ ] Table grants for `authenticated` role  
- [ ] Table grants for `service_role` role
- [ ] RLS enabled on table
- [ ] RLS policies created
- [ ] Related tables have grants
- [ ] Test anonymous access
- [ ] Test authenticated access (with service role context)
- [ ] Test joins with related tables
- [ ] Verify tRPC endpoints work

## Related Documentation

- [tRPC & Supabase Security Patterns](.cursor/rules/trpc-supabase-patterns.mdc)
- [Test Script](../scripts/test-external-jobs-permissions.ts)
- [Job Import README](../functions/README-JOB-IMPORT.md)
