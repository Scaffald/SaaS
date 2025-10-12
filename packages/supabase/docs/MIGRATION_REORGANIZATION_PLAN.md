# Migration Reorganization Plan

**Date:** October 12, 2025  
**Goal:** Consolidate all migrations into 7 clean, organized files

## Target Structure

```
001_schema.sql       - Tables, types, enums, basic triggers (NO FKs, NO RLS)
002_relations.sql    - Foreign key constraints only
003_data.sql         - O*NET + CSI + Universities + skill associations  
004_functions.sql    - Stored procedures and helper functions
005_policies.sql     - RLS policies and grants
006_storage.sql      - Storage buckets and policies
007_indexes.sql      - Performance indexes
```

## Current State Analysis

### From 001_extensions_and_base_schema.sql
**Extract to 001_schema.sql:**
- Schemas (private)
- Extensions
- Custom types (app_role, review_status, application_status)
- Tables: industries, users, private.profile, private.preferences
- Basic triggers: set_updated_at, handle_new_user

**Move to 002_relations.sql:**
- FK: users.id → auth.users(id)
- FK: users.industry_id → industries(id)
- FK: private.profile.user_id → users(id)
- FK: private.preferences.user_id → users(id)

**Move to 004_functions.sql:**
- set_updated_at() function
- handle_new_user() function

**Move to 005_policies.sql:**
- All RLS policies (users, private.profile, private.preferences)
- All GRANT statements

**Move to 007_indexes.sql:**
- All CREATE INDEX statements

### From 002_organizations_jobs_skills.sql
**Extract to 001_schema.sql:**
- Tables (without FKs): organizations, teams, team_members, skills, user_skills, organization_skills
- Tables (without FKs): private.connections, follows, jobs, job_skills
- Tables (without FKs): private.applications, private.application_messages, private.application_inquiries
- Tables (without FKs): reviews, review_skill_ratings, review_aspects, private.invites
- Add search_tsv columns to organizations and jobs

**Move to 002_relations.sql:**
- All REFERENCES clauses (approximately 30+ foreign keys)

**Move to 004_functions.sql:**
- organizations_tsv_update()
- jobs_tsv_update()

**Move to 005_policies.sql:**
- All RLS policies (organizations, teams, team_members, etc.)
- All DO $$ policy creation blocks

**Move to 007_indexes.sql:**
- All CREATE INDEX statements
- GIN indexes for search_tsv

### From Current Migrations (020-025)
**Consolidate to 003_data.sql:**
- 020_create_onet_schema.sql - O*NET schema
- 021_import_onet_full_data.sql - O*NET data import
- 023_create_data_schema.sql - CSI/MasterFormat, Universities
- 024_create_polymorphic_skill_associations.sql - Skill associations

**Move to 004_functions.sql:**
- 022_create_onet_helper_functions.sql
- 025_create_onet_search_function.sql

### From Current Migrations (004, 005)
**Keep as 006_storage.sql:**
- 004_storage_avatars.sql
- 005_storage_certifications.sql

## Extraction Strategy

### Phase 1: Create Schema-Only File (001_schema.sql)
1. Copy all CREATE TABLE statements
2. Remove all REFERENCES clauses
3. Remove all RLS enable/policy statements
4. Keep column definitions and constraints (NOT NULL, CHECK, UNIQUE, DEFAULT)
5. Keep triggers that fire on INSERT/UPDATE
6. Remove all CREATE INDEX statements

### Phase 2: Extract Foreign Keys (002_relations.sql)
1. Go through each table systematically
2. Extract REFERENCES clauses as ALTER TABLE ... ADD CONSTRAINT
3. Group by table for clarity
4. Add comments explaining relationships

### Phase 3: Consolidate Data Dumps (003_data.sql)
1. Copy current 020, 021, 023, 024 files
2. Ensure proper ordering (schema before data)
3. Remove any RLS/grant statements

### Phase 4: Consolidate Functions (004_functions.sql)
1. Extract all CREATE OR REPLACE FUNCTION statements
2. Include: set_updated_at, handle_new_user, tsv_update functions
3. Add O*NET helper functions (022)
4. Add O*NET search function (025)
5. Order: utility functions first, then domain-specific

### Phase 5: Consolidate Security (005_policies.sql)
1. Extract all ALTER TABLE ... ENABLE ROW LEVEL SECURITY
2. Extract all CREATE POLICY statements
3. Extract all GRANT statements
4. Group by table
5. Add section comments

### Phase 6: Keep Storage (006_storage.sql)
1. Copy current 004 and 005 files
2. Minimal changes needed

### Phase 7: Extract Indexes (007_indexes.sql)
1. Extract all CREATE INDEX statements
2. Group by table
3. Add comments explaining purpose
4. Include GIN, GIST, trgm indexes

## Testing Strategy

After creating each file:
1. Run `pnpm supa db reset`
2. Verify no errors
3. Check that all tables exist
4. Verify RLS is working
5. Test a few queries

## Rollback Plan

- Keep current migrations in migrations-archive/
- Can revert by restoring archived files
- Document which migrations were consolidated

## Estimated Timeline

- Phase 1 (001_schema.sql): 2 hours
- Phase 2 (002_relations.sql): 1 hour
- Phase 3 (003_data.sql): 30 minutes
- Phase 4 (004_functions.sql): 1 hour
- Phase 5 (005_policies.sql): 2 hours
- Phase 6 (006_storage.sql): 15 minutes
- Phase 7 (007_indexes.sql): 1 hour
- Testing & Fixes: 2 hours

**Total:** ~10 hours

## Next Steps

1. Create 001_schema.sql (start here)
2. Test basic schema creation
3. Create 002_relations.sql
4. Test relationships work
5. Continue through phases
6. Final comprehensive test
7. Archive old migrations
8. Update documentation
