# Migration Guidelines

## Overview

This document outlines the migration-only development workflow for the Supabase schema. **Database resets are prohibited** in local development. All schema changes must be made through migrations.

## Migration Structure

Migrations follow a numbered convention (001-007) for core application setup:

- **001_schema.sql**: Pure database schema (tables, types, enums) - NO foreign keys, NO RLS, NO indexes
- **002_data.sql**: Reference data schemas (`data`, `onet`) and polymorphic skill tables
- **003_relations.sql**: Foreign key relationships and cascading rules
- **004_functions.sql**: Stored procedures, helper functions, and triggers
- **005_policies.sql**: RLS policies and permission grants
- **006_storage.sql**: Storage buckets and policies
- **007_indexes.sql**: Performance indexes

## Schema Organization

### Core Schema (`core.*`)

All application tables live in the `core` schema:
- Application tables: `core.users`, `core.organizations`, `core.jobs`, etc.
- Private/PII tables: `core.profile`, `core.preferences`, `core.applications`, etc. (no `private_` prefix)
- Review enhancements: `core.soft_skills`, `core.review_category_ratings`, etc.

### Reference Data Schemas

- **`data.*`**: Reference data (universities, masterformat, certifications) - remains separate
- **`cms.*`**: CMS content management (welcome_slides, etc.) - remains separate
- **`onet.*`**: O*NET external reference data - remains separate

### Naming Conventions

- Rich text fields: Use `description` or `about` (not `*_rich`) - stored as JSONB
- No plain text fallbacks: `*_plain` columns are removed - use `extract_tiptap_plain_text()` function for search
- Private tables: No `private_` prefix when moved to `core` schema (RLS handles privacy)

## Migration Workflow

### Creating a New Migration

1. **Never modify existing migrations** (001-007) unless absolutely necessary
2. Create new numbered migrations after 007 for new features
3. Follow the convention: `008_feature_name.sql`, `009_another_feature.sql`, etc.
4. Each migration should be self-contained and reversible

### Migration Best Practices

1. **Always use transactions**: Wrap migrations in `BEGIN;` / `COMMIT;`
2. **Use IF NOT EXISTS**: For tables, indexes, functions to allow idempotent runs
3. **Drop before create**: For policies, use `DROP POLICY IF EXISTS` before `CREATE POLICY`
4. **Test migrations**: Test migrations on a fresh database before committing
5. **Document changes**: Add comments explaining why changes were made

### Prohibited Practices

- ❌ **NO database resets** - Use migrations for all changes
- ❌ **NO direct schema modifications** - Always use migrations
- ❌ **NO manual table edits** - All changes go through migrations
- ❌ **NO `*_plain` columns** - Use function-based extraction for search
- ❌ **NO `*_rich` suffix** - Rich text columns are just `description` or `about`

## Rich Text Fields

Rich text fields are stored as JSONB (TipTap format):

- **Users**: `core.users.about` (JSONB)
- **Organizations**: `core.organizations.description` (JSONB)
- **Jobs**: `core.jobs.description` (JSONB)
- **User Experience**: `core.user_experience.description` (JSONB)
- **User Education**: `core.user_education.description` (JSONB)

### Search Indexing

Full-text search uses function-based indexes:

```sql
CREATE INDEX idx_users_about_search 
  ON core.users 
  USING gin(to_tsvector('english', COALESCE(core.extract_tiptap_plain_text(about), '')));
```

The `extract_tiptap_plain_text()` function extracts plain text from JSONB on-the-fly for search.

## Type Generation

After schema changes, regenerate TypeScript types:

```bash
pnpm supa:generate
```

This updates `packages/supabase/types.ts` with the new schema structure.

## Testing Migrations

1. Reset database (last allowed reset - this is the final one)
2. Run all migrations in order: `001 -> 002 -> 003 -> 004 -> 005 -> 006 -> 007`
3. Verify schema structure:
   - All tables in `core.*` schema
   - No `*_plain` columns
   - Rich text columns renamed (no `_rich` suffix)
   - Foreign keys reference `core.*` tables
4. Test application functionality
5. Regenerate types

## Common Migration Patterns

### Adding a New Table

```sql
-- In 001_schema.sql (if core table) or new migration
CREATE TABLE core.new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- In 003_relations.sql
ALTER TABLE core.new_table
  ADD CONSTRAINT new_table_fkey 
  FOREIGN KEY (id) REFERENCES core.other_table(id);

-- In 005_policies.sql
ALTER TABLE core.new_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY new_table_read ON core.new_table FOR SELECT USING (true);

-- In 007_indexes.sql
CREATE INDEX idx_new_table_name ON core.new_table(name);
```

### Adding a Rich Text Field

```sql
-- In 001_schema.sql
ALTER TABLE core.table_name 
  ADD COLUMN description JSONB;

-- In 007_indexes.sql
CREATE INDEX idx_table_description_search 
  ON core.table_name 
  USING gin(to_tsvector('english', COALESCE(core.extract_tiptap_plain_text(description), '')));
```

## Troubleshooting

### Migration Fails

1. Check migration syntax
2. Verify table/schema names are correct
3. Ensure foreign keys reference existing tables
4. Check for circular dependencies

### Type Generation Issues

1. Run `pnpm supa:generate` after migrations
2. Verify database connection is active
3. Check that all tables exist in expected schemas

## References

- Migration files: `packages/supabase/migrations/`
- Schema documentation: `packages/supabase/docs/`
- Type definitions: `packages/supabase/types.ts`

