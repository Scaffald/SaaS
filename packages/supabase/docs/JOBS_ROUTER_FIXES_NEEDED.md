# Jobs Router Fixes Needed

## Missing Tables

Based on schema audit, these tables referenced by jobs.router.ts don't exist:

1. **external_jobs** - Used by `getExternalJobs` and `getFilterOptions`
2. **certifications** - Referenced by `job_certifications` foreign key but table doesn't exist
3. **applications** - Used by `getMyApplications`, `createApplication`, `updateApplication`, `withdrawApplication`

## Tables That DO Exist

- `public.jobs` ✅
- `public.job_skills` ✅
- `public.job_certifications` ✅ (but FK to non-existent certifications table)

## Required Fixes

### 1. getExternalJobs
- **Status:** DISABLE - external_jobs table doesn't exist
- **Action:** Return empty array or throw "not implemented" error

### 2. getFilterOptions  
- **Status:** DISABLE - external_jobs table doesn't exist
- **Action:** Return empty arrays or throw "not implemented" error

### 3. getPublishedJobs
- **Status:** FIX - Remove job_certifications join (certifications table doesn't exist)
- **Action:** Query just jobs table without certifications join

### 4. get JobDetails
- **Status:** FIX - Remove job_certifications join
- **Action:** Query just jobs table without certifications join

### 5. getMyApplications
- **Status:** DISABLE - applications table doesn't exist  
- **Action:** Return empty array or throw "not implemented" error

### 6. createApplication, updateApplication, withdrawApplication, getMyApplicationForJob
- **Status:** DISABLE - applications table doesn't exist
- **Action:** Throw "not implemented" errors

### 7. getInternalJobFilterOptions
- **Status:** FIX - Remove job_certifications reference
- **Action:** Return filter options without certifications

## Implementation Plan

Simplify all endpoints to work with current minimal schema (just jobs + job_skills tables).
