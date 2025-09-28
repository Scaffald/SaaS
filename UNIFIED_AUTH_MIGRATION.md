# Unified Authentication Migration Guide

## Overview
This migration consolidates the web and native authentication flows into a single, unified implementation based on the native approach (which was working better).

## Benefits of Unified Approach
- ✅ **Single codebase** for both web and native platforms
- ✅ **Direct Supabase client** usage (no auth helpers dependency)
- ✅ **Consistent session management** across platforms
- ✅ **Platform-specific optimizations** where needed
- ✅ **Simplified debugging** and maintenance
- ✅ **Better error handling** with explicit state management

## Files Created
- `packages/core/provider/auth/AuthProvider.unified.tsx` - Unified AuthProvider
- `packages/core/utils/supabase/useSupabase.unified.ts` - Unified useSupabase hook
- `packages/core/utils/supabase/client.unified.ts` - Unified Supabase client
- `test-unified-auth.js` - Test script for unified implementation

## Migration Steps

### 1. Update AuthProvider Import
Replace platform-specific AuthProvider imports:

**Before:**
```tsx
// Web
import { AuthProvider } from '@app/core/provider/auth/AuthProvider'
// Native  
import { AuthProvider } from '@app/core/provider/auth/AuthProvider.native'
```

**After:**
```tsx
// Both platforms
import { AuthProvider } from '@app/core/provider/auth/AuthProvider.unified'
```

### 2. Update useSupabase Import
Replace platform-specific useSupabase imports:

**Before:**
```tsx
// Web
import { useSupabase } from '@app/core/utils/supabase/useSupabase'
// Native
import { useSupabase } from '@app/core/utils/supabase/useSupabase.native'
```

**After:**
```tsx
// Both platforms
import { useSupabase } from '@app/core/utils/supabase/useSupabase.unified'
```

### 3. Remove Dependencies (Web Only)
The unified approach removes the need for `@supabase/auth-helpers-react` on web:

```bash
# Remove from package.json dependencies
yarn remove @supabase/auth-helpers-react
```

### 4. Platform-Specific Considerations

#### Web Platform
- Uses `localStorage` for session persistence (Supabase default)
- Enables `detectSessionInUrl` for OAuth redirects
- Routing handled differently (Next.js router vs Expo router)

#### Native Platform
- Uses `AsyncStorage` for session persistence
- Includes `react-native-url-polyfill/auto` for URL handling
- Includes Expo router timeout fixes
- Protected route logic with `useProtectedRoute`

## Key Differences from Old Implementation

### Web (Before)
- Used `@supabase/auth-helpers-react` with `SessionContextProvider`
- Relied on auth helpers for session management
- More abstracted but potentially fragile

### Native (Before)
- Custom session context implementation
- Direct Supabase client usage
- Manual session state management

### Unified (After)
- **Best of both worlds**: Direct client control with platform optimizations
- **Consistent API**: Same hooks and providers across platforms
- **Platform awareness**: Handles web/native differences internally
- **Simplified**: Single codebase to maintain

## Testing
Run the test script to verify the unified implementation:

```bash
node test-unified-auth.js
```

## Rollback Plan
If issues arise, the old platform-specific files are preserved:
- `AuthProvider.tsx` (web)
- `AuthProvider.native.tsx` (native)
- `useSupabase.ts` (web)
- `useSupabase.native.ts` (native)

Simply revert the import changes to use the old files.

## Next Steps After Migration
1. Test thoroughly in both web and native environments
2. Verify OAuth flows work correctly
3. Test session persistence across app restarts
4. Confirm protected routes work as expected
5. Remove old platform-specific files once confident
