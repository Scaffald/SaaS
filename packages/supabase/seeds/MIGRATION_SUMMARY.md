# Seed Data Migration Summary

## Overview
This document summarizes the migration of seed data from migration files to dedicated seed files in the `seeds/` directory.

## Migration Date
January 6, 2025

## Changes Made

### 1. New Seed Files Created
The following seed files were created in `packages/supabase/seeds/`:

- **`seed-affiliates.sql`**
  - OSHA 30-Hour Construction Training
  - HAZWOPER 40-Hour Certification
  - NIMS CNC Operator Certification
  - Build Your Future Craft Training

- **`seed-soft-skills.sql`**
  - 10 Reliability skills
  - 9 Collaboration skills
  - 9 Professionalism skills
  - 7 Technical skills

- **`seed-test-users.sql`**
  - testuser1@example.com (John Smith - Construction)
  - testuser2@example.com (Sarah Johnson - Manufacturing)
  - testuser3@example.com (Mike Wilson - Transportation)

- **`seed-super-admins.sql`**
  - Super admin role assignments for core team

- **`README.md`** - Comprehensive documentation for all seed files

### 2. Migration Files Deprecated
The following migration files were updated with deprecation notices:

- `migrations/004_seed_domain_data.sql` → Points to `seeds/seed.sql`
- `migrations/006_seed_affiliates.sql` → Points to `seeds/seed-affiliates.sql`
- `migrations/017_seed_users.sql` → Points to `seeds/seed-test-users.sql`
- `migrations/028_seed_super_admins.sql` → Points to `seeds/seed-super-admins.sql`
- `migrations/047_seed_soft_skills.sql` → Points to `seeds/seed-soft-skills.sql`

### 3. Documentation Updated
- **`seeds/README.md`** - Created comprehensive guide for all seed files
- **`docs/SEEDING.md`** - Updated to reflect new seed file locations

## Directory Structure

### Before
```
packages/supabase/
├── seed.sql (base data)
├── seeds/
│   ├── seed.sql (duplicate/confusion)
│   └── seed-job-feeds.sql
└── migrations/
    ├── 004_seed_domain_data.sql (seed data mixed with migrations)
    ├── 006_seed_affiliates.sql (seed data mixed with migrations)
    ├── 017_seed_users.sql (seed data mixed with migrations)
    ├── 028_seed_super_admins.sql (seed data mixed with migrations)
    └── 047_seed_soft_skills.sql (seed data mixed with migrations)
```

### After
```
packages/supabase/
├── seeds/                          # All seed data organized here
│   ├── README.md                   # Comprehensive documentation
│   ├── seed.sql                    # Main seed file
│   ├── seed-affiliates.sql         # Affiliate programs
│   ├── seed-soft-skills.sql        # Soft skills taxonomy
│   ├── seed-test-users.sql         # Test users
│   ├── seed-super-admins.sql       # Admin role assignments
│   └── seed-job-feeds.sql          # RSS feeds
└── migrations/                     # Schema migrations only
    ├── 004_seed_domain_data.sql    # DEPRECATED (deprecation notice)
    ├── 006_seed_affiliates.sql     # DEPRECATED (deprecation notice)
    ├── 017_seed_users.sql          # DEPRECATED (deprecation notice)
    ├── 028_seed_super_admins.sql   # DEPRECATED (deprecation notice)
    └── 047_seed_soft_skills.sql    # DEPRECATED (deprecation notice)
```

## Benefits

### 1. Clear Separation of Concerns
- **Migrations** = Schema changes (structure, functions, policies)
- **Seeds** = Sample data for development and testing

### 2. Better Organization
- All seed files in one directory
- Easy to find and maintain
- Clear naming convention

### 3. Selective Seeding
Can now seed specific data types:
```bash
pnpm supa db seed --file seeds/seed-affiliates.sql
pnpm supa db seed --file seeds/seed-soft-skills.sql
```

### 4. Improved Documentation
- Comprehensive README in seeds directory
- Updated main SEEDING.md documentation
- Clear migration path from old to new structure

### 5. No Breaking Changes
- Main `seed.sql` still runs automatically on `pnpm supa:reset`
- Deprecated migration files kept for history
- All functionality preserved

## Usage

### Standard Workflow (No Changes)
```bash
# Full reset and seed - works exactly as before
pnpm supa:reset:seed
```

### New Selective Seeding
```bash
# Seed only affiliates
pnpm supa db seed --file seeds/seed-affiliates.sql

# Seed only soft skills
pnpm supa db seed --file seeds/seed-soft-skills.sql

# Seed only test users
pnpm supa db seed --file seeds/seed-test-users.sql
```

## Testing Verification

After migration, verify everything works:

```bash
# 1. Reset database (should work as before)
pnpm supa:reset

# 2. Check base data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM industries;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# 3. Run additional seeds
pnpm supa db seed --file seeds/seed-affiliates.sql
pnpm supa db seed --file seeds/seed-soft-skills.sql

# 4. Verify
psql $DATABASE_URL -c "SELECT COUNT(*) FROM affiliates;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM soft_skills;"
```

## Migration Notes

### Why Keep Deprecated Migration Files?
- Preserve migration history
- Avoid breaking existing workflows
- Clear deprecation path for developers

### What About Existing Databases?
- No impact on existing databases
- Migration files (004, 006, 017, 028, 047) already ran
- Future resets will use new seed files

### Future Considerations
- Consider removing deprecated migration files in a future major version
- All new seed data should go in `seeds/` directory
- Update team documentation and onboarding

## Rollback Plan

If issues arise, the old migration files still contain the seed data in git history:

```bash
# View old migration file
git show HEAD~1:packages/supabase/migrations/047_seed_soft_skills.sql

# Restore if needed
git checkout HEAD~1 -- packages/supabase/migrations/047_seed_soft_skills.sql
```

## Related Files Modified

- `packages/supabase/seeds/seed-affiliates.sql` (created)
- `packages/supabase/seeds/seed-soft-skills.sql` (created)
- `packages/supabase/seeds/seed-test-users.sql` (created)
- `packages/supabase/seeds/seed-super-admins.sql` (created)
- `packages/supabase/seeds/README.md` (created)
- `packages/supabase/migrations/004_seed_domain_data.sql` (deprecated)
- `packages/supabase/migrations/006_seed_affiliates.sql` (deprecated)
- `packages/supabase/migrations/017_seed_users.sql` (deprecated)
- `packages/supabase/migrations/028_seed_super_admins.sql` (deprecated)
- `packages/supabase/migrations/047_seed_soft_skills.sql` (deprecated)
- `packages/supabase/docs/SEEDING.md` (updated)
