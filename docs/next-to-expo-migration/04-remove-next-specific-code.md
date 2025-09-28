# Phase 2.1: Remove Next.js-Specific Code

## Overview
This document provides step-by-step instructions for removing Next.js-specific code and replacing it with Expo/React Native Web equivalents.

## Code Migration Tasks

### 1. tRPC Client Migration

#### Current Implementation (packages/core/utils/api.ts)
```typescript
import { createTRPCNext } from '@trpc/next'
import SuperJSON from 'superjson'

export const api = createTRPCNext<AppRouter>({
  // Next.js-specific configuration
})
```

#### Target Implementation
```typescript
import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'
import SuperJSON from 'superjson'

export const api = createTRPCReact<AppRouter>()

// Create client configuration
export const trpcClient = api.createClient({
  transformer: SuperJSON,
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
    }),
  ],
})
```

#### Migration Steps
1. **Replace tRPC Next.js client** with vanilla React client
2. **Update provider setup** in root layout
3. **Test all tRPC queries and mutations**
4. **Update any SSR-specific tRPC usage**

### 2. Router Migration

#### Current Implementation (packages/core/utils/usePathname.ts)
```typescript
import { useRouter } from 'next/router'

export const usePathname = () => {
  const router = useRouter()
  return router.pathname
}
```

#### Target Implementation
```typescript
import { usePathname as useExpoPathname } from 'expo-router'

export const usePathname = () => {
  return useExpoPathname()
}
```

#### Migration Steps
1. **Replace Next.js router imports** with Expo Router equivalents
2. **Update navigation logic** to use Expo Router
3. **Test all routing functionality**
4. **Update any programmatic navigation**

### 3. Theme Provider Migration

#### Current Implementation (packages/core/provider/theme/UniversalThemeProvider.tsx)
```typescript
export { useRootTheme, useThemeSetting } from '@tamagui/next-theme'
```

#### Target Implementation
```typescript
import { createContext, useContext, useState, useEffect } from 'react'
import { useColorScheme } from 'react-native'

type ThemeName = 'light' | 'dark'

interface ThemeContextValue {
  current: ThemeName
  systemTheme: ThemeName
  resolvedTheme: ThemeName
  toggle: () => void
  set: (theme: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export const useRootTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useRootTheme must be used within ThemeProvider')
  return context
}

export const useThemeSetting = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useThemeSetting must be used within ThemeProvider')
  return {
    current: context.current,
    set: context.set,
    toggle: context.toggle,
    systemTheme: context.systemTheme,
    resolvedTheme: context.resolvedTheme,
  }
}
```

#### Migration Steps
1. **Remove @tamagui/next-theme dependency**
2. **Implement custom theme context**
3. **Update theme provider setup**
4. **Test theme switching functionality**

### 4. Environment Variables Migration

#### Current Pattern
```typescript
// Next.js environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
```

#### Target Pattern
```typescript
// Expo environment variables
process.env.EXPO_PUBLIC_SUPABASE_URL
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
```

#### Migration Steps
1. **Update all environment variable references**
2. **Update .env files** with EXPO_PUBLIC_ prefix
3. **Update build configuration**
4. **Test environment variable access**

### 5. Authentication Migration

#### Current Supabase Auth Helpers
```typescript
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
```

#### Target Implementation
```typescript
import { createClient } from '@supabase/supabase-js'

// Use unified Supabase client (already exists in your project)
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
)
```

#### Migration Steps
1. **Remove Next.js auth helpers** dependencies
2. **Use existing unified Supabase client**
3. **Update authentication flows** to use standard Supabase client
4. **Test authentication on all platforms**

## File-by-File Migration Checklist

### packages/core/utils/api.ts
- [ ] Replace `createTRPCNext` with `createTRPCReact`
- [ ] Update client configuration
- [ ] Remove Next.js-specific options
- [ ] Test tRPC functionality

### packages/core/utils/usePathname.ts
- [ ] Replace `next/router` with `expo-router`
- [ ] Update hook implementation
- [ ] Test pathname functionality

### packages/core/provider/theme/UniversalThemeProvider.tsx
- [ ] Remove `@tamagui/next-theme` import
- [ ] Implement custom theme context
- [ ] Update theme provider logic
- [ ] Test theme switching

### packages/core/provider/theme/UniversalThemeProvider.native.tsx
- [ ] Remove Next.js theme references
- [ ] Update to use unified theme context
- [ ] Test native theme functionality

### Environment Variables
- [ ] Update all `NEXT_PUBLIC_*` to `EXPO_PUBLIC_*`
- [ ] Update .env files
- [ ] Update build configurations
- [ ] Test environment variable access

## Testing Strategy

### Unit Tests
- [ ] Test tRPC client functionality
- [ ] Test routing hooks
- [ ] Test theme provider
- [ ] Test environment variable access

### Integration Tests
- [ ] Test authentication flow
- [ ] Test API calls
- [ ] Test navigation
- [ ] Test theme switching

### Cross-Platform Tests
- [ ] Test on web browser
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Test responsive design

## Rollback Plan

### If Issues Arise
1. **Revert commits** to previous working state
2. **Restore Next.js dependencies** if needed
3. **Test functionality** on all platforms
4. **Document issues** for future resolution

### Incremental Migration
- Migrate one file at a time
- Test after each change
- Commit working changes
- Keep detailed migration log

## Success Criteria
- [ ] All Next.js imports removed
- [ ] All functionality preserved
- [ ] Cross-platform compatibility maintained
- [ ] Performance not degraded
- [ ] Tests passing on all platforms

## Common Issues and Solutions

### tRPC Client Issues
**Problem**: tRPC queries not working after migration
**Solution**: Ensure proper client setup and provider configuration

### Router Issues
**Problem**: Navigation not working correctly
**Solution**: Verify Expo Router setup and route definitions

### Theme Issues
**Problem**: Theme switching not working
**Solution**: Check theme context implementation and provider setup

### Environment Variable Issues
**Problem**: Environment variables not accessible
**Solution**: Verify EXPO_PUBLIC_ prefix and build configuration

## Next Steps
After completing this phase:
1. Proceed to Phase 2.2: Consolidate Platform Files
2. Update build scripts and configurations
3. Run comprehensive testing
4. Document any remaining issues
