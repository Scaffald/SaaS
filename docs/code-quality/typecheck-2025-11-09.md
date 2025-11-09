# Typecheck Diagnostics – 2025-11-09

## Summary
- Ran `pnpm typecheck` at `2025-11-09T` (local) from `/Users/clay/Development/SCF-Neue`.
- Turbo reported failures in the `expo-app` workspace; other packages passed via cache.
- Output captured to `typecheck-output.txt` for reference.

## Quick Win Tasks
- [ ] Quick Win – Harden form hooks against implicit `any` values  
  Files: `.../profile/profile-education-left.tsx`, `packages/core/features/profile/profile-employment-left.tsx`, `packages/core/features/profile/components/EducationEntryEditModal.tsx`, `packages/core/features/profile/__tests__/profile-employment-left.test.tsx`, `packages/core/features/profile/profile-education-right.tsx`, `packages/core/features/personality-assessment/components/ResultsStep.tsx`.
- [ ] Quick Win – Fix accessibility prop typings (`aria-hidden`, `aria-live`, `aria-atomic`) to use booleans and the allowed literal unions  
  Files: `packages/core/features/profile-wizard/components/ProgressIndicator.tsx`, `packages/ui/src/components/image-picker/AvatarCropModal.tsx`.
- [ ] Quick Win – Update Tamagui variant unions to include `ghost` / `solid` where needed or swap to supported tokens  
  Files: `packages/core/features/profile-import/components/ImportReviewScreen.tsx`, `packages/ui/src/components/image-picker/AvatarCropModal.tsx`.
- [ ] Quick Win – Resolve test utility typing conflicts (duplicate `beforeEach`/`describe` etc.) by scoping Vitest/Jest globals  
  Files: `packages/ui/src/components/image-picker/utils/__tests__/imageProcessing.test.ts`.
- [ ] Quick Win – Fix missing module typings for clipboard utilities  
  Files: `packages/core/utils/clipboard.ts`.

## Deeper Follow-ups
- [ ] Deep Dive – Align all Tamagui theme assignments (`color="blue"`, `theme="red"` etc.) with declared `ThemeName` tokens across core and UI packages.
- [ ] Deep Dive – Replace unsupported style props (`backgroundColor`, `borderRadius`, `left`, `top`, `w`, `maxWidth`, `minWidth`, `justifyContent`) with approved Tamagui shorthands or create wrapper components.  
  Files: primarily in `packages/core/features/profile` and `packages/ui/src/components/image-picker/AvatarCropModal.tsx`, `packages/ui/src/components/buttons/Button.tsx`, `packages/core/features/profile/components/...`.
- [ ] Deep Dive – Reconcile `apps/expo/tsconfig.json` includes so that all imported files under `packages/schemas` and `packages/supabase` participate in the project reference.  
  Errors: TS6307 across numerous schema entry points and `client-types.ts`.
- [ ] Deep Dive – Restore missing exports from `packages/supabase/functions/_shared/schemas/consolidated.ts` (e.g., `ProfileWizardProgress`, `profileWizardProgressSchema`).  
  Files: `packages/supabase/client-types.ts`.
- [ ] Deep Dive – Correct Supabase `useOrganizations` query to target an existing table type (`team_members` relation issue).  
  File: `packages/core/utils/useOrganizations.ts`.
- [ ] Deep Dive – Standardize Tamagui component prop usage (e.g., `alignSelf`, `placement` on `Select`, `placeholder` on `MonthYearPicker`) either by extending component typings or restructuring UI usage.  
  Files: `packages/core/features/luscher-test/components`, `packages/core/features/profile/components/EducationEntryEditModal.tsx`, `packages/core/features/profile/profile-education-left.tsx`, `packages/core/features/profile/profile-education-right.tsx`.

## Notes
- Re-running `pnpm typecheck` after each task will confirm progress; update this report by removing completed items and commit the change before moving on.
- Keep `typecheck-output.txt` or regenerate as needed to validate fixes.

