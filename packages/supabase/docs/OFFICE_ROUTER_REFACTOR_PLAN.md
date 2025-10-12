# Office Router Refactoring Plan

**File:** `packages/supabase/functions/trpc/routers/office.router.ts`  
**Size:** 1,287 lines  
**Status:** Needs table reference updates + potential modularization

## References to Fix (13 total)

### Profiles → Users (6 instances)
- Line 23 - `listUsers` procedure
- Line 51 - `getUser` procedure
- Line 117 - `updateUser` procedure
- Line 868 - `deleteUser` procedure
- Line 1090 - `getUserProfile` procedure
- Line 1158 - `updateUserProfile` procedure

### User_private → private.profile (7 instances)
- Line 65 - `getUser` procedure
- Line 132 - `updateUser` procedure  
- Line 864 - `deleteUser` procedure
- Line 1103 - `getUserProfile` procedure
- Line 1199 - `updateUserProfile` procedure
- Line 1222 - `updateUserProfile` procedure
- Line 1264 - `getUserContactInfo` procedure

## Fixing Strategy

### Phase 3A: User Management Procedures (Lines 21-150)
Fix all references in:
- `listUsers`
- `getUser`
- `updateUser`

### Phase 3B: User Deletion (Lines 860-870)
Fix references in:
- `deleteUser`

### Phase 3C: Profile Management (Lines 1085-1270)
Fix references in:
- `getUserProfile`
- `updateUserProfile`
- `getUserContactInfo`

## Future Refactoring Recommendations

### 1. Split into Focused Routers
The office.router.ts file is too large (1287 lines). Consider splitting into:

```
routers/office/
├── users.router.ts       # User CRUD operations
├── profile.router.ts     # Profile management
├── organizations.router.ts
├── jobs.router.ts
├── universities.router.ts (already exists)
└── index.ts              # Combines all office routers
```

### 2. Extract Common Patterns
Create shared utilities for:
- User fetching with private data
- Profile updates with validation
- Error handling patterns

### 3. Benefits
- **Smaller files** - Easier to navigate and maintain
- **Clear responsibility** - Each router has a focused purpose
- **Better testing** - Easier to test individual routers
- **Team collaboration** - Multiple devs can work on different routers
- **DRY principles** - Shared utilities reduce duplication

## Implementation Steps

### Immediate (This Session)
1. ✅ Map all table references
2. ⏳ Fix all `profiles` → `users` references
3. ⏳ Fix all `user_private` → `.schema("private").from("profile")` references
4. ⏳ Test updated endpoints

### Future (Separate Task)
1. Create `routers/office/` directory structure
2. Split procedures into focused routers
3. Extract shared utilities
4. Update imports in `_app.ts`
5. Test thoroughly
6. Document new structure

## Notes

- The `universities` router is already separated - good pattern to follow
- Most procedures follow similar patterns - ripe for DRY refactoring
- Consider adding TypeScript interfaces for common data structures
- Admin procedures use `supabaseAdmin` - ensure permissions are correct

---

**Priority:** Fix table references first, then consider refactoring in separate PR/task
