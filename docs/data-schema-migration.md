# Data Schema Migration - MasterFormat & Universities

## Overview

This migration consolidates reference/catalog data (`masterformat` and `universities`) from separate schemas (`csi` and `public`) into a new unified `data` schema. This provides better organization by separating reference data from application data.

## What Changed

### Schema Organization

**Before:**
- `csi.masterformat` - CSI MasterFormat construction specifications
- `public.universities` - University catalog

**After:**
- `data.masterformat` - CSI MasterFormat (moved from `csi` schema)
- `data.universities` - University catalog (moved from `public` schema)
- `csi` schema - Kept for backward compatibility with a view
- `public.universities` view - Backward compatibility view

### Migration Details

**Migration File:** `packages/supabase/migrations/090_migrate_to_data_schema.sql`

**Key Changes:**
1. Created new `data` schema for reference/catalog data
2. Moved `masterformat` table from `csi` to `data`
3. Moved `universities` table from `public` to `data`
4. Updated all foreign key references
5. Recreated functions in `data` schema:
   - `data.search_universities()`
   - `data.search_masterformat()`
   - `data.get_hierarchy_path()`
6. Updated RLS policies
7. Created compatibility views for backward compatibility

### Code Updates

**Files Updated:**
- `packages/supabase/functions/trpc/routers/office/universities.router.ts`
- `packages/supabase/functions/trpc/routers/profile/skills-multi-taxonomy.router.ts`
- `packages/supabase/scripts/seed-csi.ts`
- `packages/supabase/scripts/verify-schemas.ts`

**Changes Made:**
- Updated table references from `universities` to `data.universities`
- Updated table references from `csi.masterformat` to `data.masterformat`
- Updated RPC function calls to use `data` schema

## Backward Compatibility

The migration includes compatibility views to ensure existing code continues to work:

```sql
-- Old code still works via views:
SELECT * FROM csi.masterformat;           -- Redirects to data.masterformat
SELECT * FROM public.universities;         -- Redirects to data.universities

-- New code should use direct references:
SELECT * FROM data.masterformat;
SELECT * FROM data.universities;
```

## Testing the Migration

### 1. Run the Migration

```bash
# Start Supabase locally
pnpm supa start

# Apply the migration
pnpm supa migration up
```

### 2. Verify the Migration

```bash
# Run verification script
cd packages/supabase/scripts
DATABASE_URL='postgresql://postgres:postgres@localhost:54322/postgres' \
  deno run --allow-net --allow-env verify-schemas.ts
```

Expected output:
```
✅ CSI MasterFormat: [count] records
✅ O*NET Occupations: [count] records  
✅ Universities: [count] records
```

### 3. Test Compatibility Views

```sql
-- Test that old paths still work
SELECT count(*) FROM csi.masterformat;
SELECT count(*) FROM public.universities;

-- Test that new paths work
SELECT count(*) FROM data.masterformat;
SELECT count(*) FROM data.universities;
```

### 4. Test Application Features

1. **Skills Search** - Test CSI skill search in construction industry profiles
2. **Education Forms** - Test university autocomplete in education forms
3. **Office Admin** - Test university CRUD operations in office panel

### 5. Generate Updated Types

```bash
# Generate TypeScript types from new schema
pnpm supa:generate
```

## Rolling Back

If you need to rollback this migration:

```bash
# Note: This migration is not easily reversible due to schema moves
# Best approach is to restore from backup before migration
pnpm supa db reset
```

## Future Considerations

### Additional Reference Data

Consider moving other reference/catalog tables to the `data` schema:
- `industries` - Industry catalog
- `certifications` - Certification types catalog
- Future lookup/reference tables

### Deprecation of Compatibility Views

After confirming all code is updated:
1. Remove compatibility views
2. Update all remaining references
3. Clean up old schema references in documentation

## Benefits

1. **Clear Separation** - Reference data separated from application data
2. **Better Organization** - All catalog/lookup data in one schema
3. **Easier Maintenance** - Clear boundary between data types
4. **Future Scalability** - Easy to add more reference data tables

## Notes

- The `csi` schema is kept with a compatibility view
- All foreign keys are updated automatically
- RLS policies are recreated in the new schema
- Functions are recreated with identical signatures
