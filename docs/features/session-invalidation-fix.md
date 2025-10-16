# Robust Session Management & Auth Redirect System

## Problem

When sessions expire or become invalid (DB reset, manual deletion, token expiry), users experience:
- UNAUTHORIZED errors from tRPC endpoints
- Infinite loading states with no redirect to login
- Stale sessions persisting in browser/app storage (localStorage, cookies, AsyncStorage)
- Competing redirect logic causing navigation issues
- React Query cache containing stale user data

## Root Causes

When sessions become invalid:
1. Client-side session tokens remain stored in platform storage
2. React Query cache contains stale user data
3. Invalid sessions cause API calls to fail with UNAUTHORIZED errors
4. Multiple systems try to handle errors simultaneously, creating race conditions
5. No proactive session expiry checking on app focus/visibility changes

## Solution Architecture

We implemented a **comprehensive reactive session management system** with multiple layers of defense:

### 1. Centralized Storage Cleanup Utility (Foundation)

**Location**: `packages/core/utils/auth/clearAuthStorage.ts`

Created a cross-platform utility that comprehensively clears ALL auth-related storage:

```typescript
export async function clearAllAuthStorage(queryClient?: QueryClient): Promise<void> {
  // 1. Clear React Query cache
  if (queryClient) {
    queryClient.clear();
  }

  // 2. Sign out from Supabase (clears Supabase's internal storage)
  await supabase.auth.signOut();

  // 3. Platform-specific storage cleanup
  if (Platform.OS === "web") {
    // Clear localStorage, sessionStorage, cookies
    await clearWebStorage();
  } else {
    // Clear AsyncStorage on native
    await clearNativeStorage();
  }
}
```

**Clears**:
- React Query cache (all queries)
- Supabase auth storage
- Web: localStorage, sessionStorage, auth-related cookies
- Native: AsyncStorage auth keys
- All auth-related data across platforms

### 2. Enhanced tRPC Error Link (Primary Defense)

**Location**: `packages/core/utils/api.ts`

Custom tRPC link that intercepts UNAUTHORIZED errors and triggers comprehensive cleanup:

```typescript
const sessionValidationLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        error: async (err) => {
          if (err instanceof TRPCClientError && err.data?.code === "UNAUTHORIZED") {
            console.log("[tRPC] UNAUTHORIZED error - triggering cleanup");
            
            const queryClient = getGlobalQueryClient();
            await clearAllAuthStorage(queryClient || undefined);
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
- Comprehensive cleanup (not just signOut)
- Single point of control for reactive session validation
- Clears all storage, not just Supabase auth
- No race conditions

### 3. Global Query Client Access

**Location**: `packages/core/provider/react-query/QueryProvider.tsx` (web and native)

Made React Query client globally accessible for cleanup operations:

```typescript
let globalQueryClient: QueryClient | null = null;

export function getGlobalQueryClient(): QueryClient | null {
  return globalQueryClient;
}
```

**Benefits**:
- Allows cache clearing from non-React contexts
- Used by tRPC error link and auth utilities
- Single source of truth for query client

### 4. Enhanced AuthProvider with clearAuth

**Location**: `packages/core/provider/auth/AuthProvider.tsx`

Added comprehensive `clearAuth` function alongside basic `signOut`:

```typescript
// Basic signOut - clears Supabase auth only
const signOut = useCallback(async () => {
  await supabase.auth.signOut();
}, []);

// Comprehensive clearAuth - clears ALL storage
const clearAuth = useCallback(async () => {
  const queryClient = getGlobalQueryClient();
  await clearAllAuthStorage(queryClient || undefined);
}, []);
```

**Benefits**:
- Explicit separation between basic signOut and full cleanup
- Available throughout app via useAuth hook
- Can be called manually from UI components

### 5. Proactive Session Validation (Prevents Waiting for API Calls)

**Location**: `packages/core/provider/auth/AuthStateChangeHandler.ts`

Added session expiry checking on app focus/visibility changes:

```typescript
const useProactiveSessionValidation = () => {
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.expires_at) {
        const expired = isSessionExpired(session.expires_at);
        
        if (expired) {
          const queryClient = getGlobalQueryClient();
          await clearAllAuthStorage(queryClient || undefined);
        }
      }
    };

    // Web: Check on visibility change
    // Native: Check on AppState becoming active
    // ...
  }, []);
};
```

**Benefits**:
- Detects expired sessions BEFORE first API call
- Prevents infinite loading states
- Works on app focus (native) and tab visibility (web)
- Only checks when app becomes active, not continuously

### 6. Loading Timeout Protection

**Location**: `packages/core/utils/auth/useProtectedRoute.ts`

Added 10-second timeout to prevent infinite loading states:

```typescript
useEffect(() => {
  if (isPending && !hasChecked) {
    const timeoutId = setTimeout(() => {
      if (Date.now() - loadingStartTime.current >= 10000) {
        console.warn("[useProtectedRoute] Loading timeout - redirecting to auth");
        router.replace(AUTH_ROUTES.INDEX.path);
        setHasChecked(true);
      }
    }, 10000);
    return () => clearTimeout(timeoutId);
  }
}, [isPending, hasChecked]);
```

**Benefits**:
- Prevents users from being stuck on loading screens
- Graceful degradation for edge cases
- Assumes session is invalid after 10 seconds

### 7. Conditional Prerequisites Check (Prevents Race Conditions)

**Location**: `apps/expo/app/dashboard/_layout.tsx`

Prerequisites check only runs when user is validated:

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

### 8. Profile Fetch Safety Net (Additional Layer)

**Location**: `packages/core/utils/useUser.ts`

Handles database-level user deletion gracefully:

```typescript
if (error.code === "PGRST116") {
  console.log("[useUser] User not found in database, signing out");
  await supabase.auth.signOut();
  return null;
}
```

**Benefits**:
- Catches database-level user deletion
- Additional safety layer for edge cases

## Flow Examples

### Scenario 1: Session Expires While App is Open

1. **Session expires** → Token expires_at timestamp passes
2. **User makes action** → Triggers tRPC call (e.g., load profile data)
3. **tRPC error link triggered** → Detects UNAUTHORIZED error
4. **Comprehensive cleanup** → `clearAllAuthStorage()` called
5. **Storage cleared** → React Query cache, localStorage/AsyncStorage, cookies all cleared
6. **Supabase signOut** → Triggers SIGNED_OUT event
7. **Auth handler redirects** → User redirected to `/auth`
8. **Clean state** → Fresh login experience, no stale data

### Scenario 2: User Returns to App After Session Expired

1. **User switches back to app** → App becomes active/visible
2. **Proactive check runs** → `useProactiveSessionValidation` checks session
3. **Expired session detected** → `isSessionExpired()` returns true
4. **Immediate cleanup** → `clearAllAuthStorage()` called BEFORE any API calls
5. **Storage cleared** → All platforms cleaned
6. **Redirect happens** → User sees login screen immediately
7. **No API calls wasted** → Prevents waiting for UNAUTHORIZED error

### Scenario 3: Database Reset (Development)

1. **DB Reset occurs** → `pnpm supa reset` deletes all users
2. **User navigates/reloads** → App initializes with stale session
3. **Prerequisites check disabled** → Won't run because cleanup will happen first
4. **First tRPC call made** → Error link detects UNAUTHORIZED
5. **Comprehensive cleanup** → All storage cleared
6. **User redirected** → Redirected to `/auth` login page
7. **Clean state** → Fresh start, no stale data

### Scenario 4: Loading Takes Too Long

1. **User loads protected route** → `useProtectedRoute` starts
2. **Session check hangs** → Network issue or invalid session
3. **10 seconds pass** → Timeout protection triggers
4. **Automatic redirect** → Assumes session invalid, redirects to `/auth`
5. **No infinite loading** → User can log in again

## Key Design Principles

1. **Comprehensive Cleanup**: All storage cleared (React Query, localStorage, cookies, AsyncStorage)
2. **Reactive Detection**: UNAUTHORIZED errors trigger immediate cleanup
3. **Proactive Validation**: Session expiry checked on app focus/visibility
4. **Platform Agnostic**: Works consistently on web and native
5. **Single Source of Truth**: Centralized `clearAllAuthStorage` utility
6. **No Race Conditions**: Clear dependency chain and conditional queries
7. **Fail Fast**: Invalid sessions detected and handled immediately
8. **Timeout Protection**: Prevents infinite loading states
9. **Clear Logging**: Detailed console logs for debugging
10. **Separation of Concerns**: Basic `signOut` vs comprehensive `clearAuth`

## Testing Scenarios

To test this solution:

1. **DB Reset Test**:
   ```bash
   pnpm supa reset
   # Reload app
   # Should cleanly redirect to auth screen with all storage cleared
   ```

2. **Manual Session Invalidation**:
   - Clear database user manually
   - Make any API call
   - Should detect UNAUTHORIZED and clear all storage

3. **Session Expiry Test**:
   - Set session to expire soon (modify expires_at in database)
   - Switch away from app
   - Switch back to app
   - Should detect expired session proactively and redirect

4. **Loading Timeout Test**:
   - Disconnect network
   - Navigate to protected route
   - Wait 10 seconds
   - Should automatically redirect to /auth

5. **Storage Persistence Test**:
   - Sign in
   - Sign out
   - Check browser DevTools → Application → Storage
   - Verify all auth-related items are cleared

6. **Cross-Tab Test (Web)**:
   - Open app in two tabs
   - Sign out in one tab
   - Check other tab
   - Should detect signed out state and redirect

## Benefits

✅ **Comprehensive**: Clears ALL auth storage across all platforms
✅ **Robust**: Handles multiple edge cases (expiry, invalid tokens, DB resets)
✅ **Proactive**: Detects expired sessions before API calls
✅ **Reactive**: Handles UNAUTHORIZED errors immediately
✅ **Platform Consistent**: Works identically on web and native
✅ **No Infinite Loading**: Timeout protection prevents hanging
✅ **No Stale Data**: React Query cache cleared on auth issues
✅ **No Race Conditions**: Clear dependency chain
✅ **Maintainable**: Centralized cleanup utility
✅ **Developer-Friendly**: Detailed console logging
✅ **User-Friendly**: Clean redirects, no confusing states

## Files Created/Modified

### Created:
- `packages/core/utils/auth/clearAuthStorage.ts` - Centralized storage cleanup utility

### Modified:
- `packages/core/utils/api.ts` - Enhanced tRPC error link with comprehensive cleanup
- `packages/core/provider/auth/AuthProvider.tsx` - Added `clearAuth` function
- `packages/core/provider/react-query/QueryProvider.tsx` - Global query client access (web)
- `packages/core/provider/react-query/QueryProvider.native.tsx` - Global query client access (native)
- `packages/core/provider/auth/AuthStateChangeHandler.ts` - Proactive session validation
- `packages/core/utils/auth/useProtectedRoute.ts` - Loading timeout protection
- `apps/expo/app/dashboard/_layout.tsx` - Conditional prerequisites check
- `packages/core/utils/useUser.ts` - Profile fetch error handling

## API for Developers

### Using clearAuth from Components

```typescript
import { useAuth } from '@app/core/provider/auth/useAuth';

function MyComponent() {
  const { clearAuth } = useAuth();
  
  const handleLogout = async () => {
    // Comprehensive cleanup - use for logout buttons
    await clearAuth();
  };
  
  return <Button onPress={handleLogout}>Sign Out</Button>;
}
```

### Direct Cleanup (Non-React Contexts)

```typescript
import { clearAllAuthStorage } from '@app/core/utils/auth/clearAuthStorage';
import { getGlobalQueryClient } from '@app/core/provider/react-query';

// In utility functions, middleware, etc.
async function handleAuthError() {
  const queryClient = getGlobalQueryClient();
  await clearAllAuthStorage(queryClient || undefined);
}
```

## Future Considerations

- Add user-facing toast notifications for better UX ("Session expired, please log in again")
- Implement session refresh logic for near-expiry sessions
- Add analytics tracking for auth cleanup events
- Consider adding a grace period for token refresh attempts before cleanup
