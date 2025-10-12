# Consolidated Migrations

**Created:** October 12, 2025  
**Status:** Ready for testing

## Overview

This directory contains the completely reorganized and consolidated migration structure for SCF-Neue. All migrations have been consolidated from 26+ scattered files into 7 clean, organized files.

## Migration Structure

```
001_schema.sql       - Pure database schema (tables, types, enums)
002_relations.sql    - Foreign key constraints only
003_data.sql         - O*NET + CSI + Universities + skill associations
004_functions.sql    - Stored procedures and helper functions
005_policies.sql     - RLS policies and grants
006_storage.sql      - Storage buckets (avatars, certifications)
007_indexes.sql      - Performance indexes
```

## Migration Order

**Critical:** These migrations MUST be run in numerical order:

1. **001_schema.sql** - Creates all tables without foreign keys or RLS
2. **002_relations.sql** - Adds all foreign key constraints
3. **003_data.sql** - Creates O*NET, CSI, and polymorphic skill schemas
4. **004_functions.sql** - Creates all stored procedures and triggers
5. **005_policies.sql** - Enables RLS and creates security policies
6. **006_storage.sql** - Sets up Supabase Storage buckets
7. **007_indexes.sql** - Creates performance indexes

## Data Import Requirements

After running these migrations, you must import data:

### 1. O*NET Data Import
```bash
# Import O*NET 30.0 data (creates onet.occupation_data table)
# Run migration: 021_import_onet_full_data.sql
```

### 2. CSI MasterFormat Data
```bash
pnpm tsx packages/supabase/scripts/seed-csi.ts
```

### 3. Universities Data
```bash
pnpm tsx packages/supabase/scripts/seed-universities.ts
```

### 4. Add O*NET Foreign Keys
After O*NET data is imported, add foreign key constraints:

```sql
ALTER TABLE public.user_skills
  ADD CONSTRAINT user_skills_onet_occupation_id_fkey 
  FOREIGN KEY (onet_occupation_id) 
  REFERENCES onet.occupation_data(onetsoc_code) ON DELETE CASCADE;

ALTER TABLE public.job_skills
  ADD CONSTRAINT job_skills_onet_occupation_id_fkey 
  FOREIGN KEY (onet_occupation_id) 
  REFERENCES onet.occupation_data(onetsoc_code) ON DELETE CASCADE;

ALTER TABLE public.organization_skills
  ADD CONSTRAINT org_skills_onet_occupation_id_fkey 
  FOREIGN KEY (onet_occupation_id) 
  REFERENCES onet.occupation_data(onetsoc_code) ON DELETE CASCADE;
```

## Testing

To test these migrations:

```bash
# Reset database and run new migrations
pnpm supa db reset

# Check for errors
# Verify all tables exist
# Test RLS policies
# Verify functions work
```

## Key Features

### Security
- **RLS enabled** on all sensitive tables
- **Proper grants** for anon, authenticated, and service_role
- **Fine-grained policies** for multi-tenant data

### Performance
- **50+ indexes** for optimal query performance
- **GIN indexes** for full-text search and array operations
- **GIST indexes** for geospatial queries
- **Partial indexes** for frequently filtered columns

### Data Organization
- **Clear separation** between public and private data
- **Polymorphic skill associations** supporting multiple taxonomies
- **Dedicated schemas** for O*NET and reference data

## Benefits Over Old Structure

1. **Maintainability** - Easy to understand and modify
2. **Clear Dependencies** - Explicit ordering prevents issues
3. **Better Testing** - Can test each layer independently
4. **Easier Debugging** - Know exactly where to look
5. **Documentation** - Each file is well-commented
6. **Performance** - All indexes in one place

## Migration from Old Structure

The old migrations have been archived in `migrations-archive/`. This new structure replaces:

- 001-026+ scattered migration files
- Multiple duplicate policies
- Inconsistent naming
- Complex dependencies

## Troubleshooting

### If a migration fails:

1. Check the error message carefully
2. Verify previous migrations completed successfully
3. Check if data imports are required before this step
4. Review the migration file comments for dependencies

### Common Issues:

- **O*NET foreign key errors**: Import O*NET data first
- **RLS policy conflicts**: Ensure schema exists before policies
- **Function errors**: Verify tables exist before creating functions

## Next Steps

After successful migration:

1. Run data imports (O*NET, CSI, Universities)
2. Add O*NET foreign key constraints
3. Test application functionality
4. Update type generation: `pnpm supa:generate`
5. Archive old migrations directory

## Documentation

For more details, see:
- `../docs/MIGRATION_REORGANIZATION_PLAN.md` - Full reorganization plan
- `../docs/MIGRATION_AUDIT.md` - What was consolidated
- `../docs/SCHEMA_DECISIONS.md` - Schema design decisions
