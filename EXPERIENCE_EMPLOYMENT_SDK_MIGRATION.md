# Experience & Employment Endpoints Migration to SDK Hooks

**Date:** 2026-02-10

## Overview

Successfully migrated 5 files from tRPC to SDK hooks for Experience and Employment profile endpoints. This migration aligns with the ongoing effort to move from tRPC to the Scaffald SDK for better type safety and maintainability.

## Files Migrated

### 1. `/packages/scf-core/features/profile/components/EmploymentSection.tsx`

**Endpoints Migrated:**
- `api.profile.employment.getEmployment.useQuery()` → `useEmployment()`
- `api.profile.employment.updateEmployment.useMutation()` → `useUpdateEmploymentMutation()`

**Changes:**
- Added import: `useEmployment, useUpdateEmploymentMutation` from `@scf/core/utils/profile-employment-sdk-hooks`
- Updated query and mutation hooks for user mode (admin mode still uses tRPC office endpoints)
- No cache pattern changes needed (component uses local refetch)

### 2. `/packages/scf-core/features/profile/profile-employment-left.tsx`

**Endpoints Migrated:**
- `api.profile.employment.getEmployment.useQuery()` → `useEmployment()`
- `api.profile.employment.updateEmployment.useMutation()` → `useUpdateEmploymentMutation()`
- `api.useContext()` → `useQueryClient()` from `@tanstack/react-query`

**Changes:**
- Added imports: `useEmployment, useUpdateEmploymentMutation` from `@scf/core/utils/profile-employment-sdk-hooks`
- Added import: `useQueryClient` from `@tanstack/react-query`
- Updated cache invalidation:
  - `utils.profile.employment.getEmployment.cancel()` → `queryClient.cancelQueries({ queryKey: ['profiles', 'employment'] })`
  - `utils.profile.employment.getEmployment.getData()` → `queryClient.getQueryData(['profiles', 'employment'])`
  - `utils.profile.employment.getEmployment.setData()` → `queryClient.setQueryData(['profiles', 'employment'], ...)`
  - `utils.profile.employment.getEmployment.invalidate()` → `queryClient.invalidateQueries({ queryKey: ['profiles', 'employment'] })`

### 3. `/packages/scf-core/features/profile/profile-experience-left.tsx`

**Endpoints Migrated:**
- `api.profile.experience.getExperience.useQuery()` → `useExperience()`
- `api.profile.experience.getExperienceSummary.useQuery()` → `useExperienceSummary()`
- `api.profile.experience.saveExperience.useMutation()` → `useSaveExperienceMutation()`
- `api.useContext()` → `useQueryClient()` from `@tanstack/react-query`

**Changes:**
- Added imports: `useExperience, useExperienceSummary, useSaveExperienceMutation` from `@scf/core/utils/profile-experience-sdk-hooks`
- Added import: `useQueryClient` from `@tanstack/react-query`
- Updated cache invalidation for both experience and summary queries:
  - `utils.profile.experience.getExperience.*` → `queryClient.*({ queryKey: ['profiles', 'experience'] })`
  - `utils.profile.experience.getExperienceSummary.*` → `queryClient.*({ queryKey: ['profiles', 'experience', 'summary'] })`
- Removed TypeScript type assertion `as never` (no longer needed with SDK hooks)

### 4. `/packages/scf-core/features/profile/profile-experience-right.tsx`

**Endpoints Migrated:**
- `api.profile.experience.getExperience.useQuery()` → `useExperience()`
- `api.profile.experience.getExperienceSummary.useQuery()` → `useExperienceSummary()`

**Changes:**
- Removed import: `api` from `@scf/core/utils/api`
- Added imports: `useExperience, useExperienceSummary` from `@scf/core/utils/profile-experience-sdk-hooks`
- Simple read-only component with no mutations

### 5. `/packages/scf-core/features/resume/components/ResumeWizard.tsx`

**Endpoints Migrated:**
- `api.profile.experience.getExperience.useQuery()` → `useExperience()`
- `api.profile.employment.getEmployment.useQuery()` → `useEmployment()`

**Changes:**
- Added imports: `useExperience` from `@scf/core/utils/profile-experience-sdk-hooks`
- Added imports: `useEmployment` from `@scf/core/utils/profile-employment-sdk-hooks`
- Updated queries to use SDK hooks with `refetchOnWindowFocus: false` option
- Only read queries migrated (resume wizard doesn't directly mutate experience/employment)

## SDK Hook Mappings

### Experience Endpoints

| tRPC Endpoint | SDK Hook |
|--------------|----------|
| `api.profile.experience.getExperience.useQuery()` | `useExperience()` |
| `api.profile.experience.getExperienceSummary.useQuery()` | `useExperienceSummary()` |
| `api.profile.experience.saveExperience.useMutation()` | `useSaveExperienceMutation()` |
| `api.profile.experience.deleteExperience.useMutation()` | `useDeleteExperienceMutation()` (not used in migrated files) |

### Employment Endpoints

| tRPC Endpoint | SDK Hook |
|--------------|----------|
| `api.profile.employment.getEmployment.useQuery()` | `useEmployment()` |
| `api.profile.employment.updateEmployment.useMutation()` | `useUpdateEmploymentMutation()` |

## Cache Key Mappings

### Experience Cache Keys

| tRPC Cache | React Query Cache Key |
|-----------|----------------------|
| `utils.profile.experience.getExperience.*` | `['profiles', 'experience']` |
| `utils.profile.experience.getExperienceSummary.*` | `['profiles', 'experience', 'summary']` |

### Employment Cache Keys

| tRPC Cache | React Query Cache Key |
|-----------|----------------------|
| `utils.profile.employment.getEmployment.*` | `['profiles', 'employment']` |

## Migration Patterns Applied

1. **Import Changes:**
   - Add SDK hook imports from `@scf/core/utils/profile-{experience|employment}-sdk-hooks`
   - Add `useQueryClient` from `@tanstack/react-query` for cache management

2. **Query Updates:**
   - Replace `api.profile.{endpoint}.useQuery()` with `use{Endpoint}()`
   - Maintain existing query options (e.g., `refetchOnWindowFocus`)

3. **Mutation Updates:**
   - Replace `api.profile.{endpoint}.useMutation()` with `use{Endpoint}Mutation()`
   - Update `onMutate`, `onError`, `onSuccess`, `onSettled` callbacks

4. **Cache Pattern Updates:**
   - Replace `api.useContext()` with `useQueryClient()`
   - Update `utils.profile.*` calls to `queryClient.*` with explicit query keys
   - Change cache operations:
     - `.cancel()` → `.cancelQueries({ queryKey: [...] })`
     - `.getData()` → `.getQueryData([...])`
     - `.setData(undefined, ...)` → `.setQueryData([...], ...)`
     - `.invalidate()` → `.invalidateQueries({ queryKey: [...] })`

## Verification

✅ All tRPC references to `api.profile.experience.*` and `api.profile.employment.*` removed from migrated files
✅ SDK hook imports correctly added to all 5 files
✅ Cache invalidation patterns updated to use React Query's `queryClient`
✅ TypeScript compilation verified (no new errors introduced)

## Notes

- **EmploymentSection.tsx**: Admin mode still uses tRPC `api.office.*` endpoints (as intended)
- **Type Safety**: SDK hooks provide better type inference than tRPC mutations
- **Cache Keys**: Consistent query keys across all files: `['profiles', 'experience']` and `['profiles', 'employment']`
- **Backwards Compatibility**: Migration maintains all existing functionality and behavior

## Next Steps

Future migrations could include:
- Education endpoints (`profile.education.*`)
- Certifications endpoints (`profile.certifications.*`)
- Skills endpoints (`profile.skills*`)
- Admin office endpoints for experience/employment

## Related Files

- SDK Hook Definitions:
  - `/packages/scf-core/utils/profile-experience-sdk-hooks.ts`
  - `/packages/scf-core/utils/profile-employment-sdk-hooks.ts`

- Scaffald SDK Implementation:
  - `/packages/scaffald-sdk/src/modules/experience.ts`
  - `/packages/scaffald-sdk/src/modules/employment.ts`
