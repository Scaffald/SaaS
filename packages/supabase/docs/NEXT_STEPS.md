# Migration Consolidation - Next Steps

**Date:** October 12, 2025  
**Current Status:** Table Reference Migration Complete ✅

---

## ✅ What's Complete

### 1. Table Reference Migration (100%)
All old table references have been successfully migrated:
- ✅ `profiles` → `users` (13/13 files)
- ✅ `user_private` → `private.profile` (12/12 files)
- ✅ `user_preferences` → `private.preferences` (12/12 files)
- ✅ `v_applications_with_user_profiles` view → refactored to direct joins

### 2. Profile Schema Enhancements (100%)
All critical profile columns added to migration 001:
- ✅ Added 6 new columns to `private.profile`
- ✅ Converted `drivers_license_class` → `drivers_license_classes[]`
- ✅ Changed `open_to_travel` default to `true`
- ✅ Added GIN indexes for array columns
- ✅ Documented all decisions in [SCHEMA_DECISIONS.md](./SCHEMA_DECISIONS.md)

**See [SCHEMA_DECISIONS.md](./SCHEMA_DECISIONS.md) for:**
- Fields added/modified/skipped
- Find/replace guide for application code
- Data migration strategies
- Testing checklist

**Files Updated:**
- prerequisites.router.ts
- profile/completion.router.ts
- profile/avatar.router.ts
- profile/education.router.ts
- profile/experience.router.ts
- profile/employment.router.ts
- profile/general.router.ts
- onet.router.ts
- user-profile.router.ts
- workers.router.ts
- office.router.ts
- applications.router.ts

### 2. Migration Consolidation Progress
- 91 original migrations → 12 consolidated migrations (89% reduction)
- Private schema architecture implemented
- Core functionality migrated successfully

---

## 🎯 Immediate Priority: Port Critical Security Migrations

These migrations fix actual bugs and security holes that should be addressed ASAP.

### Create Migration 027: Critical Security Fixes

**Recommended:** Create a single consolidated migration that includes all Priority 1 RLS & Permission fixes.

```bash
pnpm supa migration:new critical_security_fixes
```

**What to include from migrations-archive:**

#### RLS & Permissions Fixes
1. **055_fix_jobs_select_policy.sql** - Jobs table RLS policies
2. **056_fix_jobs_service_role_grants.sql** - Service role grants for jobs
3. **059_grant_service_role_user_private.sql** - Service role access to private.profile (fixes prerequisites bug)
4. **060_grant_jobs_table_access.sql** - Job access grants
5. **20251006010511_grant_service_role_job_access.sql** - Additional job fixes
6. **20251012073617_grant_job_skills_access.sql** - Job skills access

#### Skills System Fixes
7. **089_drop_deprecated_skill_functions.sql** - Remove conflicting functions
8. **091_fix_user_skills_service_role_grants.sql** - User skills mutations

**Why consolidate?** These are all permission/grant fixes that work together. Consolidating them:
- Reduces migration count
- Makes permissions easier to audit
- Ensures consistent security model
- Easier to test as a unit

**Estimated time:** 2-3 hours

---

## 🔧 Short-term: Admin & Organization Features

### Create Migration 028: Admin Roles System

Port the admin role infrastructure:
- 008_create_admin_roles.sql
- 011_create_organization_workflow.sql
- 20250928120000_fix_role_assignments_recursion.sql

**Why this matters:** Admin functionality currently won't work without these migrations.

### Create Migration 029: Organization Enhancements

Port organization location features:
- 029_add_org_coords_function.sql
- 033_fix_get_organizations_with_coords.sql
- 093_add_organization_locations.sql

**Impact:** Enables multi-location organizations and location-based features.

**Estimated time:** 3-4 hours

---

## 🤔 Strategic Decisions Needed

Before proceeding with Priority 2-5 migrations, you need to decide on feature scope:

### Question 1: ATS (Applicant Tracking System) Scope

**Options:**
1. **Basic** - Just job posting and applications (current state)
2. **Full ATS** - Pipelines, auto-scoring, team screening, compliance

**If Full ATS, need to port ~20 migrations:**
- Pipeline management
- Auto-scoring and rejection
- Interview scheduling
- Compliance tracking
- Team collaboration features

**Recommendation:** Start with Basic, add ATS features incrementally as needed.

### Question 2: External Job Feeds

**Do you need to import jobs from external sources?**
- LinkedIn integration
- Indeed feed
- Other job boards

**If YES, port 4 migrations:**
- 043_create_external_job_feeds.sql
- 044_setup_job_import_cron.sql
- 045_fix_external_jobs_permissions.sql
- 20251006011357_fix_external_jobs_anon_access.sql

**Recommendation:** Skip for now unless actively needed.

### Question 3: Optional Features

**Affiliates/Referrals:**
- Do you need affiliate tracking and referral system?
- Port: 005_create_affiliates_table.sql

**Reviews System:**
- Is this actively used?
- 5 migrations for review automation

**Soft Skills:**
- Separate from general skills?
- May already be covered by current skills table

---

## 📋 Recommended Roadmap

### Phase 1: Security First (This Week)
1. ✅ Complete table reference migration
2. Create migration 027: Critical security fixes
3. Test thoroughly with `pnpm supa db reset`
4. Verify all affected endpoints work

### Phase 2: Core Features (Next Week)
1. Create migration 028: Admin roles system
2. Create migration 029: Organization enhancements
3. Port Priority 2 profile enhancements if needed
4. Update documentation

### Phase 3: Strategic Features (Week 3)
1. Make decisions on ATS scope
2. Make decisions on external job feeds
3. Port relevant migrations based on decisions
4. Test end-to-end workflows

### Phase 4: Cleanup (Week 4)
1. Archive/document skipped migrations
2. Update all migration documentation
3. Final testing and validation
4. Production deployment plan

---

## 🛠️ Testing Strategy

After each migration phase:

```bash
# Reset database
pnpm supa db reset

# Regenerate types
pnpm supa:generate

# Run code quality checks
pnpm check

# Manual testing checklist
# - User authentication
# - Prerequisites flow
# - Profile management
# - Job posting/applications
# - Admin functions
# - Organization management
```

---

## 📝 Documentation to Update

As you progress:
- [ ] Update MIGRATION_AUDIT.md with completed migrations
- [ ] Update migrations/README.md with new migrations
- [ ] Document any breaking changes
- [ ] Update deployment guides
- [ ] Create rollback procedures

---

## 🚀 Quick Start: Next Steps

**To continue consolidation right now:**

1. **Review Priority 1 migrations in migrations-archive:**
   ```bash
   ls packages/supabase/migrations-archive/055*
   ls packages/supabase/migrations-archive/056*
   ls packages/supabase/migrations-archive/059*
   # ... etc
   ```

2. **Create new migration:**
   ```bash
   pnpm supa migration:new critical_security_fixes
   ```

3. **Consolidate permission fixes** into the new migration

4. **Test locally:**
   ```bash
   pnpm supa db reset
   pnpm supa:generate
   pnpm check
   ```

5. **Update documentation** when complete

---

## 📊 Progress Tracking

**Overall Consolidation Progress:**
- Original migrations: 91
- Current consolidated: 12
- Reduction: 89%

**Migration Porting Status:**
- ✅ Core schema (001, 002)
- ✅ Storage (004, 005)
- ✅ O*NET integration (020-025)
- ✅ Security baseline (026)
- ⏳ Critical security fixes (Priority 1)
- ⏳ Admin roles (Priority 1)
- ⏳ Organization features (Priority 1)
- ❓ Profile enhancements (Priority 2)
- ❓ ATS features (Priority 3 - decision needed)
- ❓ External jobs (Priority 4 - decision needed)
- ❓ Optional features (Priority 5 - decision needed)

---

## 💡 Key Insights

1. **Table migration is complete** - This was the bulk of breaking changes
2. **Security should be next priority** - RLS fixes are critical
3. **Consolidation saves time** - Group related migrations together
4. **Make strategic decisions early** - Avoid porting unused features
5. **Test incrementally** - Don't port everything at once

---

## 📚 Related Documentation

- [MIGRATION_AUDIT.md](./MIGRATION_AUDIT.md) - Full migration analysis
- [TABLE_MIGRATION_TODO.md](
