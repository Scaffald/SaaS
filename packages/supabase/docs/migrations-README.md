# Supabase Migrations

**Last Major Refactor:** January 2025  
**Status:** Migration-only development (resets prohibited)

## Overview

This directory contains the consolidated migration structure for SCF-Scaffald. All application tables are organized in the `core` schema, with reference data in separate schemas (`data`, `cms`, `onet`).

## Migration Structure

```
001_schema.sql       - Pure database schema (tables, types, enums, core + cms schemas)
002_data.sql         - Reference data schemas (data, onet) and polymorphic skill tables
003_relations.sql    - Foreign key constraints (all referencing core.* tables)
004_functions.sql    - Stored procedures and helper functions (core schema)
005_policies.sql     - RLS policies and grants (core.* tables)
006_storage.sql      - Storage buckets (avatars, certifications, cms-media)
007_indexes.sql      - Performance indexes (function-based for rich text search)
```

## Schema Organization

### Core Schema (`core.*`)
- **ALL application tables** live in `core` schema
- Application tables: `core.users`, `core.organizations`, `core.jobs`, etc.
- Private/PII tables: `core.profile`, `core.preferences`, `core.applications`, etc.
  - **NO `private_` prefix** - RLS handles privacy
- Review enhancements: `core.soft_skills`, `core.review_category_ratings`, etc.

### Reference Data Schemas (Separate)
- **`data.*`**: Reference data (universities, masterformat, certifications) - remains separate
- **`cms.*`**: CMS content (welcome_slides, etc.) - remains separate
- **`onet.*`**: O*NET external reference data - remains separate

### Column Naming
- Rich text fields: `description` or `about` (NOT `*_rich`) - stored as JSONB
- NO `*_plain` columns - use `extract_tiptap_plain_text()` function for search

## Migration Order

**Critical:** These migrations MUST be run in numerical order:

1. **001_schema.sql** - Creates `core` and `cms` schemas, all tables (no foreign keys, no RLS, no indexes)
2. **002_data.sql** - Creates `data` and `onet` schemas, polymorphic skill tables
3. **003_relations.sql** - Adds all foreign key constraints (all reference `core.*` tables)
4. **004_functions.sql** - Creates functions and triggers (moved to `core` schema)
5. **005_policies.sql** - Enables RLS and creates security policies (for `core.*` tables)
6. **006_storage.sql** - Sets up Supabase Storage buckets (avatars, certifications, cms-media)
7. **007_indexes.sql** - Creates performance indexes (function-based for rich text search)

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
ALTER TABLE core.user_skills
  ADD CONSTRAINT user_skills_onet_occupation_id_fkey 
  FOREIGN KEY (onet_occupation_id) 
  REFERENCES onet.occupation_data(onetsoc_code) ON DELETE CASCADE;

ALTER TABLE core.job_skills
  ADD CONSTRAINT job_skills_onet_occupation_id_fkey 
  FOREIGN KEY (onet_occupation_id) 
  REFERENCES onet.occupation_data(onetsoc_code) ON DELETE CASCADE;

ALTER TABLE core.organization_skills
  ADD CONSTRAINT org_skills_onet_occupation_id_fkey 
  FOREIGN KEY (onet_occupation_id) 
  REFERENCES onet.occupation_data(onetsoc_code) ON DELETE CASCADE;
```

## Migration-Only Development

**⚠️ IMPORTANT: Database resets are PROHIBITED**

- All schema changes must be made through migrations
- Never use `pnpm supa reset` - create migrations instead
- See `../docs/MIGRATION_GUIDELINES.md` for full guidelines

## Testing

To test migrations:

```bash
# After schema changes, regenerate types
pnpm supa:generate

# Check for errors
# Verify all tables exist in correct schemas (core.*, data.*, cms.*)
# Test RLS policies
# Verify functions work
# Test application functionality
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
- **Core schema** for all application tables (clear separation from extensions)
- **Private tables** in core schema (no prefix, RLS handles privacy)
- **Polymorphic skill associations** supporting multiple taxonomies
- **Dedicated schemas** for reference data (data, cms, onet)
- **Rich text fields** as JSONB (no `*_rich` suffix, no `*_plain` fallbacks)

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
- `../docs/MIGRATION_GUIDELINES.md` - Migration-only workflow and best practices
- `../docs/MIGRATION_REORGANIZATION_PLAN.md` - Full reorganization plan (historical)
- Schema organization: All tables in `core.*` schema, reference data in `data.*`, `cms.*`, `onet.*`
