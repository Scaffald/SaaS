# SCF-Neue Refactor Task List

Generated from `pnpm check` on 9/30/2025

## Summary
- **Total Error Categories**: 5
- **Critical Issues**: 2 (Build failures, Missing modules)
- **Medium Priority**: 2 (Type safety, Component props) 
- **Low Priority**: 1 (Code cleanup)

---

## 🚨 CRITICAL PRIORITY - Build Failures

### Tamagui CLI Build Error
**Difficulty**: Hard  
**Files**: `packages/ui/package.json`, build configuration  
**Error**: `Cannot find module '/Users/clay/Development/SCF-Neue/node_modules/@tamagui/cli/dist/build'`

**Solution Required**:
- Fix Tamagui CLI installation/configuration
- Verify build dependencies are correctly installed
- May need to reinstall or update Tamagui packages

---

## 🚨 CRITICAL PRIORITY - Missing Core Files

### Missing Profile Feature Components
**Difficulty**: Medium-Hard  
**Count**: 10+ missing files

**Missing Files**:
```
packages/core/features/profile/
├── profile-employment-left.tsx
├── profile-employment-right.tsx
├── profile-experience-left.tsx
├── profile-experience-right.tsx
├── profile-general-left.tsx
├── profile-general-right.tsx
├── profile-skills-right.tsx
└── ... (and more)
```

**Impact**: Complete TypeScript compilation failure for expo app

### Missing Auth/Utility Files
**Difficulty**: Medium  
**Files**:
- `@app/core/utils/auth/useProtectedRoute`
- `@app/core/utils/supabase/client`

---

## ⚠️ HIGH PRIORITY - Type Safety Violations

### Explicit `any` Type Usage
**Difficulty**: Medium  
**Count**: 5 instances

**Files & Lines**:
1. `packages/core/features/profile/profile-skills-left.tsx:40`
   ```typescript
   } = (api as any).profile.getSkills.useQuery(undefined, {
   ```

2. `packages/core/features/profile/profile-skills-left.tsx:53`
   ```typescript
   const updateSkillsMutation = (api as any).profile.updateSkills.useMutation({
   ```

3. `packages/core/provider/auth/AuthProvider.tsx:7`
   ```typescript
   type Session = any // Will be properly typed when Supabase types are available
   ```

4. `apps/expo/app/_layout.tsx:34`
   ```typescript
   .then(({ data }) => { // data implicitly has 'any' type
   ```

**Solutions**:
- Replace `any` with proper TypeScript interfaces
- Import correct types from Supabase
- Define explicit type definitions for API responses
- Use proper generic constraints

---

## ⚠️ HIGH PRIORITY - Component Property Errors

### Tamagui Component Props Issues
**Difficulty**: Easy-Medium  
**Count**: 6+ instances

**Property Errors**:
1. **Unknown shorthand props**: `f`, `fb`, `jc`, `dsp`
   - Files: `apps/expo/app/auth/index.tsx:16,17,23`
   - Replace with full property names or correct Tamagui syntax

2. **Invalid CSS properties**: 
   - `backgroundColor` → should be `background` or `bg`
   - `marginRight` → should use Tamagui spacing tokens

3. **Missing media query properties**: `media.gtSm` 
   - File: `apps/expo/app/dashboard/_layout.tsx:26,27`
   - Update to correct Tamagui media query syntax

**Quick Fixes**:
```typescript
// Before
<XStack flex={1}>
<YStack flex={2} fb={0} justify="center">

// After  
<XStack flex={1}>
<YStack flex={2} flexBasis={0} justify="center">
```

---

## 📝 MEDIUM PRIORITY - Code Cleanup

### Unused Variables
**Difficulty**: Easy  
**File**: `packages/core/provider/auth/useAuth.tsx:58`

**Variables**:
- `error` (line 58)
- `isLoading` (line 58) 
- `supabaseClient` (line 58)

**Solution**: Remove unused destructured variables or implement their usage

---

## 🔧 Implementation Strategy

### Phase 1: Critical Fixes (Week 1)
1. **Fix Tamagui build issues**
   - Reinstall/reconfigure @tamagui/cli
   - Verify package.json dependencies

2. **Create missing profile components**
   - Generate missing profile feature files using route generator
   - Follow established naming conventions

3. **Add missing utility files**
   - Implement `useProtectedRoute` hook
   - Set up proper Supabase client exports

### Phase 2: Type Safety (Week 2)  
1. **Replace all `any` types**
   - Define proper interfaces for API responses
   - Import correct Supabase types
   - Add generic type constraints

2. **Fix component property issues**
   - Update Tamagui shorthand properties
   - Correct CSS property names
   - Fix media query usage

### Phase 3: Code Quality (Week 3)
1. **Remove unused variables**
2. **Add comprehensive type definitions**
3. **Verify all imports resolve correctly**

---

## 📋 Verification Checklist

- [ ] `pnpm check` passes without errors
- [ ] `pnpm build` completes successfully  
- [ ] All TypeScript compilation errors resolved
- [ ] No linting violations for `any` type usage
- [ ] All component imports resolve correctly
- [ ] Tamagui properties use correct syntax

---

## 🎯 Success Metrics

**Before**: 35+ TypeScript errors, build failures  
**Target**: Zero errors, successful compilation across all packages

**Code Quality Goals**:
- Zero `any` type usage
- All components properly typed
- Complete build pipeline functionality
- Consistent Tamagui component usage
