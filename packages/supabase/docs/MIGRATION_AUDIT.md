# Migration Consolidation Audit

**Date:** October 12, 2025  
**Status:** In Progress

## Overview

This document tracks the status of migration consolidation from `migrations-archive/` to the current `migrations/` directory.

## Current Active Migrations

```
001_extensions_and_base_schema.sql          ✅ Core schema
002_organizations_jobs_skills.sql           ✅ Domain tables
004_storage_avatars.sql                     ✅ Storage
005_storage_certifications.sql              ✅ Storage
018_add_career_assessment_to_preferences.sql.disabled
020_create_onet_schema.sql                  ✅ ONET
021_import_onet_full_data.sql               ✅ ONET data
022_create_onet_helper_functions.sql        ✅ ONET helpers
023_create_csi_schema.sql.disabled
023_create_data_schema.sql                  ✅ MasterFormat/Universities
024_create_polymorphic_skill_associations.sql ✅ Skills
025_create_onet_search_function.sql         ✅ ONET search
```

## Missing Migrations Analysis

### Priority 1: CRITICAL - Must Port

These migrations are essential for core functionality and security:

#### Admin & Roles System
- [ ] **008_create_admin_roles.sql**
  - Purpose: Admin role infrastructure
  - Impact: Admin functionality won't work
  - Location: migrations-archive/
  
- [ ] **011_create_organization_workflow.sql**
  - Purpose: Organization role management
  - Impact: Organization permissions incomplete
  - Location: migrations-archive/
  
- [ ] **20250928120000_fix_role_assignments_recursion.sql**
  - Purpose: Fixes infinite recursion in role checks
  - Impact: Role system may crash
  - Location: migrations-archive/

#### RLS & Permissions (CRITICAL FOR SECURITY)
- [ ] **055_fix_jobs_select_policy.sql**
  - Purpose: Jobs table RLS policies
  - Impact: Jobs may not be accessible properly
  
- [ ] **056_fix_jobs_service_role_grants.sql**
  - Purpose: Service role grants for jobs
  - Impact: tRPC mutations may fail
  
- [ ] **059_grant_service_role_user_private.sql**
  - Purpose: Service role access to user_private
  - Impact: Prerequisites mutation failing (current bug!)
  
- [ ] **060_grant_jobs_table_access.sql**
  - Purpose: Jobs table access grants
  - Impact: Job operations may fail
  
- [ ] **20251006010511_grant_service_role_job_access.sql**
  - Purpose: Additional job access fixes
  - Impact: Job functionality incomplete
  
- [ ] **20251012073617_grant_job_skills_access.sql**
  - Purpose: Job skills access
  - Impact: Skills on jobs may not work

#### Skills System Enhancements
- [ ] **089_drop_deprecated_skill_functions.sql**
  - Purpose: Remove old/conflicting skill functions
  - Impact: May have function conflicts
  
- [ ] **091_fix_user_skills_service_role_grants.sql**
  - Purpose: User skills service role grants
  - Impact: Skills mutations may fail

#### Organization Features
- [ ] **029_add_org_coords_function.sql**
  - Purpose: Organization coordinate functions
  - Impact: Location features incomplete
  
- [ ] **033_fix_get_organizations_with_coords.sql**
  - Purpose: Fix coordinate retrieval
  - Impact: Location queries may fail
  
- [ ] **093_add_organization_locations.sql**
  - Purpose: Multi-location support
  - Impact: Organizations limited to single location

---

### Priority 2: HIGH - Should Port

Enhanced functionality that adds significant value:

#### Profile Enhancements
- [ ] **007_add_profile_columns.sql**
  - Purpose: Additional profile fields
  - Impact: Limited profile data
  
- [ ] **021_enhance_profile_tables.sql**
  - Purpose: Profile table improvements
  - Impact: Missing profile features
  
- [ ] **022_add_profile_fields.sql**
  - Purpose: More profile fields
  - Impact: Incomplete profile system
  
- [ ] **025_add_employment_profile_columns.sql**
  - Purpose: Employment history fields
  - Impact: Can't track employment history
  
- [ ] **053_add_experience_summary_columns.sql**
  - Purpose: Experience summaries
  - Impact: Missing experience tracking

#### Certifications
- [ ] **052_add_certification_file_support.sql**
  - Purpose: File attachments for certifications
  - Impact: Can't attach certification files
  
- [ ] **080_add_certification_id_to_user_certifications.sql**
  - Purpose: Link to certification definitions
  - Impact: Certifications not properly linked

#### Profile Verification
- [ ] **009_create_profile_verifications.sql**
  - Purpose: Profile verification system
  - Impact: No verification capabilities

#### Views & Search
- [ ] **092_create_applications_view.sql**
  - Purpose: Applications view for easier querying
  - Impact: More complex application queries

---

### Priority 3: EVALUATE - ATS Features

Only needed if building full ATS (Applicant Tracking System):

- [ ] **054_enhance_jobs_for_ats.sql** - ATS job enhancements
- [ ] **057_create_applications_table.sql** - Applications base (may already be in 002)
- [ ] **058_fix_applications_table.sql** - Applications fixes
- [ ] **067_application_screening_team_management.sql** - Team screening
- [ ] **068_job_metadata_management.sql** - Job metadata
- [ ] **069_enhanced_requirements.sql** - Requirement system
- [ ] **070_compensation_benefits.sql** - Compensation details
- [ ] **071_application_process_configuration.sql** - Process config
- [ ] **072_multi_location_scheduling.sql** - Location scheduling
- [ ] **073_distribution_visibility.sql** - Distribution control
- [ ] **074_compliance_analytics.sql** - Compliance tracking
- [ ] **075_enhance_applications_table.sql** - More application features
- [ ] **076_create_application_attachments_storage.sql** - Attachment storage
- [ ] **077_create_application_scoring_function.sql** - Auto-scoring
- [ ] **078_create_auto_rejection_function.sql** - Auto-rejection
- [ ] **20251008090000_create_ats_pipelines.sql** - Pipeline management
- [ ] **20251008090500_create_candidate_job_links.sql** - Candidate linking
- [ ] **20251008091000_extend_applications_with_pipeline.sql** - Pipeline integration

**Decision needed:** Are you building a full ATS or just basic job posting/applications?

---

### Priority 4: OPTIONAL - External Job Feeds

Only needed if importing jobs from external sources:

- [ ] **043_create_external_job_feeds.sql** - External job feed tables
- [ ] **044_setup_job_import_cron.sql** - Cron job for importing
- [ ] **045_fix_external_jobs_permissions.sql** - Permissions
- [ ] **20251006011357_fix_external_jobs_anon_access.sql** - Anonymous access

**Decision needed:** Will you import jobs from external sources?

---

### Priority 5: EVALUATE - Feature Additions

Need to determine if these features are needed:

#### Affiliates System
- [ ] **005_create_affiliates_table.sql**
  - Purpose: Affiliate/referral tracking
  - Question: Do you need affiliate tracking?

#### Soft Skills
- [ ] **046_create_soft_skills_system.sql**
  - Purpose: Separate soft skills taxonomy
  - Question: Already covered by skills table?

#### Reviews Automation
- [ ] **019_update_reviews_workflow.sql** - Review workflow updates
- [ ] **020_review_submission_automation.sql** - Auto-submission
- [ ] **048_add_review_comment_columns.sql** - Comment fields
- [ ] **049_grant_reviews_service_role_access.sql** - Service role access
- [ ] **050_review_auto_release_and_flags.sql** - Auto-release & flags

**Decision needed:** Are you actively using the reviews system?

---

### Priority 6: LIKELY REDUNDANT - Skip or Verify

These may already be covered in consolidated migrations:

#### Profile Fixes (may be in 001)
- **012_fix_profile_triggers.sql** - Likely in base schema now

#### Skill Search (may be redundant with new search)
- **034_create_skill_search_functions.sql**
- **036_add_skills_rls_policies.sql**
- **037_add_user_skills_rls_policies.sql**
- **038_fix_skill_search_hierarchy_path.sql**
- **039_simplify_skill_search.sql**
- **040_fix_get_skill_children_active.sql**
- **041_ensure_user_skills_rls.sql**
- **042_grant_user_skills_permissions.sql**

**Note:** Check if 024_create_polymorphic_skill_associations.sql covers these

---

## Current Status Update (October 12, 2025)

### ✅ Completed: Table Reference Migration (100%)
**All old table references have been migrated**
- `profiles` → `users` (13/13 files) ✅
- `user_private` → `private.profile` (12/12 files) ✅
- `user_preferences` → `private.preferences` (12/12 files) ✅
- `v_applications_with_user_profiles` view → refactored to direct joins ✅

### ✅ Completed: Profile Schema Enhancements (100%)
**All critical profile columns have been added to migration 001**
- Added 6 new columns to `private.profile` ✅
- Converted `drivers_license_class` → `drivers_license_classes[]` ✅
- Changed `open_to_travel` default to `true` ✅
- Added GIN indexes for array columns ✅
- Documented all decisions in [SCHEMA_DECISIONS.md](./SCHEMA_DECISIONS.md) ✅

**Fields Added:**
1. `preferred_work_locations` TEXT[] - Work location preferences
2. `authorized_countries` TEXT[] - Work authorization countries
3. `drivers_license_classes` TEXT[] - Multiple license types
4. `military_status` TEXT[] - Military service status
5. `travel_distance_miles` INTEGER - Max travel distance
6. `career_level` TEXT - Career level classification

**Fields Skipped (See SCHEMA_DECISIONS.md):**
- ❌ `employment_*` address fields (use `address` JSONB instead)
- ❌ `willing_to_travel` (duplicate of `open_to_travel`)
- ❌ `total_years_experience` (use `users.years_of_experience`)

---

## Recommended Action Plan

### Phase 1: Security & Core (Do First)
1. Port all Priority 1 RLS & Permission fixes (055, 056, 059, 060, etc.)
2. Port admin roles system (008, 011, role recursion fix)
3. Port skills system fixes (089, 091)
4. Port organization locations (029, 033, 093)

### Phase 2: Enhanced Features
1. Port profile enhancements (007, 021, 022, 025, 053)
2. Port certification enhancements (052, 080)
3. Port profile verification (009)
4. Port applications view (092)

### Phase 3: Evaluate & Decide
1. Decide on ATS features scope
2. Decide on external job feeds
3. Decide on affiliates system
4. Decide on reviews automation
5. Verify if skill search migrations are needed

### Phase 4: Cleanup
1. Remove redundant archived migrations
2. Update CONSOLIDATION.md to reflect actual state
3. Document which archived migrations were intentionally skipped

---

## Next Steps

1. **Immediate:** Review Priority 1 migrations and create consolidation plan
2. **Short-term:** Port Priority 1 & 2 migrations
3. **Medium-term:** Make decisions on Priority 3-5 features
4. **Long-term:** Clean up archive and update documentation

---

## Questions to Answer

1. Are you building a full ATS or just basic job posting? (Affects Priority 3)
2. Will you import jobs from external feeds? (Affects Priority 4)
3. Do you need the affiliates/referral system? (Affects Priority 5)
4. Is the reviews system actively used? (Affects Priority 5)
5. Are soft skills handled differently from regular skills? (Affects Priority 5)
