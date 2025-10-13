# Session Invalidation After DB Reset - Solution

## Problem

After performing a database reset (`pnpm supa reset`), users would experience:
- UNAUTHORIZED errors from tRPC endpoints
- Race conditions between auth routing and prerequisites checking
- Stale sessions persisting in browser/app storage
- Competing redirect logic causing navigation issues

## Root Cause

When the database is reset:
1. All user records are deleted from the database
2. Client-side session tokens remain stored in localStorage/cookies
3. The invalid session causes API calls to fail with UNAUTHORIZED errors
4. Multiple systems try to handle the error simultaneously, creating race conditions

## Solution Architecture

We implemented a **centralized session validation system** with three layers of defense:

### 1. tRPC Error Link (Primary Defense)

**Location**: `packages/core/utils/api.ts`

Added a custom tRPC link that intercepts all UNAUTHORIZED errors and immediately signs out the user:

```typescript
const sessionValidationLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        error: async (err) => {
          if (err instanceof TRPCClientError && err.data?.code === "UNAUTHORIZED") {
            console.log("[tRPC] Invalid session detected, signing out");
            await supabase.auth.signOut();
          }
          observer.error(err);
        },
      });
      return unsubscribe;
    });
  };
};
```

**Benefits**:
- Catches invalid sessions on ANY tRPC call
- Single point of control for session validation
- Automatic across all endpoints
- No race conditions

### 2. Conditional Prerequisites Check (Prevents Race Conditions)

**Location**: `apps/expo/app/dashboard/_layout.tsx`

Made the prerequisites check conditional on having a valid user:

```typescript
const { data: statusData, isLoading: isCheckingPrereqs } = api.prerequisites.check.useQuery(
  undefined,
  {
    enabled: !!user, // Only run if user exists
  }
);
```

**Benefits**:
- Prevents prerequisites check when session is invalid
- Eliminates race condition with auth routing
- Clear dependency chain

### 3. Profile Fetch Safety Net (Additional Layer)

**Location**: `packages/core/utils/useUser.ts`

Enhanced the profile fetch to handle missing users gracefully:

```typescript
if (error.code === "PGRST116") {
  console.log("[useUser] User not found in database, signing out");
  await supabase.auth.signOut();
  return null;
}
```

Added conditional query execution:

```typescript
const { data, isPending, refetch } = useQuery({
  queryKey: ["profile", user?.id],
  queryFn: async () => { /* ... */ },
  enabled: !!user?.id, // Only run if user exists
});
```

**Benefits**:
- Handles database-level user deletion
- Additional safety net for edge cases
- Clear logging for debugging

## Flow After DB Reset

1. **DB Reset occurs** → All users deleted, sessions invalidated
2. **User navigates/reloads** → App initializes with stale session token
3. **Prerequisites check disabled** → Won't run because `user` is undefined/invalid
4. **First tRPC call made** → Error link detects UNAUTHORIZED
5. **Session invalidated** → `supabase.auth.signOut()` called
6. **Auth state changes** → `AuthStateChangeHandler` detects SIGNED_OUT
7. **User redirected** → Redirected to `/auth` login page
8. **Clean state** → No race conditions, clear user experience

## Key Design Principles

1. **Single Responsibility**: Session validation happens in one place (tRPC error link)
2. **Fail Fast**: Invalid sessions detected on first API call
3. **No Race Conditions**: Prerequisites check prevented until session validated
4. **Leverages Existing Patterns**: Uses Supabase's built-in auth state management
5. **No Competing Logic**: Only one system handles redirects after sign-out
6. **Clear Logging**: Console logs show exactly what's happening and why

## Testing Scenarios

To test this solution:

1. **DB Reset Test**:
   ```bash
   pnpm supa reset
   # Reload app
   # Should cleanly redirect to auth screen
   ```

2. **Manual Session Invalidation**:
   - Clear database user manually
   - App should detect and sign out on next API call

3. **Network Failure**:
   - Simulate network issues
   - Should handle gracefully without false positives

## Benefits

✅ **Robust**: Handles multiple edge cases
✅ **Elegant**: Single point of control
✅ **No Side Effects**: Doesn't create competing redirect logic
✅ **Maintainable**: Clear, well-documented code
✅ **Scalable**: Works for all current and future tRPC endpoints
✅ **Developer-Friendly**: Clear console logging for debugging

## Files Modified

- `packages/core/utils/api.ts` - Added session validation link
- `apps/expo/app/dashboard/_layout.tsx` - Made prerequisites check conditional
- `packages/core/utils/useUser.ts` - Enhanced profile fetch error handling

## Future Considerations

- This pattern could be extended to handle other auth-related errors
- Could add retry logic for transient network errors
- Could add user-facing toast notifications for better UX
