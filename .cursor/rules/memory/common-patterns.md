# Common Patterns

## File Organization Patterns

### Route Naming Convention
**Pattern**: `<parent>-<child>-{left|right|screen}.tsx`

**Examples**:
```
packages/core/features/dashboard/
├── dashboard-index-left.tsx      # DashboardIndexLeft
├── dashboard-index-right.tsx     # DashboardIndexRight

packages/core/features/profile/
├── profile-overview-left.tsx     # ProfileOverviewLeft
├── profile-overview-right.tsx    # ProfileOverviewRight
```

**Component Naming**:
```typescript
// Left column component
export function ProfileOverviewLeft() {
  return <div>Left content</div>
}

// Right column component
export function ProfileOverviewRight() {
  return <div>Right content</div>
}

// Main screen component (in apps/scaffald/app/dashboard/profile/overview.tsx)
import { DashboardLayout } from '@app/core/features/dashboard/DashboardLayout'

export default function Screen() {
  return (
    <DashboardLayout
      leftContent={<ProfileOverviewLeft />}
      rightContent={<ProfileOverviewRight />}
    />
  )
}
```

### Feature Structure Pattern
```
packages/core/features/<feature>/
├── <feature>-<route>-left.tsx
├── <feature>-<route>-right.tsx
├── components/                    # Feature-specific components
├── config/                        # Configuration files
│   ├── constants.ts
│   ├── types.ts
│   └── data.ts
└── hooks/                         # Feature-specific hooks
```

## Import Patterns

### Direct Imports (Preferred)
```typescript
// ✅ PREFER - Direct imports
import { ComponentA } from './components/ComponentA'
import { ComponentB } from './components/ComponentB'
import { ComponentC } from './components/ComponentC'
```

### Avoid Barrel Files
```typescript
// ❌ AVOID - Barrel file import
import { ComponentA, ComponentB, ComponentC } from './components'
```

### Platform-Specific Imports
```typescript
// Cross-platform with platform-specific fallbacks
import { Component } from './Component'           // Default
import { Component } from './Component.native'   // React Native
import { Component } from './Component.web'      // Web
import { Component } from './Component.ios'      # iOS specific
import { Component } from './Component.android'  # Android specific
```

## Component Patterns

### Beyond UI Component Usage
Use components from `@scaffald/ui` (which re-exports `@unicornlove/beyond-ui`). See `packages/scaffald-ui/` and `.cursor/rules/beyond-ui-properties.mdc` for patterns, tokens, and style factories.

### Cross-Platform Component Pattern
```typescript
import { Button, Text, Stack } from '@scaffald/ui'

export interface ExampleComponentProps {
  title: string
  onPress?: () => void
  variant?: 'primary' | 'secondary'
}

export const ExampleComponent = ({
  title,
  onPress,
  variant = 'primary'
}: ExampleComponentProps) => {
  return (
    <Stack gap={8}>
      <Text size="md">{title}</Text>
      <Button
        variant={variant === 'primary' ? 'filled' : 'outline'}
        color="primary"
        onPress={onPress}
      >
        {title}
      </Button>
    </Stack>
  )
}
```

## Data Fetching Patterns

### SDK Query Pattern
```typescript
import { useProfile } from '@scaffald/sdk/react'

export function ProfileComponent() {
  const { data, isLoading, error } = useProfile()

  if (isLoading) return <Text>Loading...</Text>
  if (error) return <Text>Error: {error.message}</Text>
  if (!data?.data) return <Text>No profile found</Text>

  const profile = data.data

  return (
    <Stack gap={16}>
      <Text size="lg">{profile.name}</Text>
      <Text>{profile.email}</Text>
    </Stack>
  )
}
```

### SDK Mutation Pattern
```typescript
import { useUpdateProfileMutation } from '@scf/core/utils/profile-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'

export function UpdateProfileForm() {
  const queryClient = useQueryClient()

  const updateProfile = useUpdateProfileMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: (error) => {
      console.error('Failed to update profile:', error)
    }
  })

  const handleSubmit = (data: ProfileUpdateData) => {
    updateProfile.mutate(data)
  }

  return (
    <Form onSubmit={handleSubmit}>
      {/* Form fields */}
    </Form>
  )
}
```

## Navigation Patterns

### Expo Router Navigation
```typescript
import { router } from 'expo-router'

// Navigate to route
router.push('/dashboard/profile/overview')

// Navigate with parameters
router.push({
  pathname: '/dashboard/profile/[id]',
  params: { id: '123' }
})

// Replace current route
router.replace('/dashboard')

// Go back
router.back()
```

### Navigation with Type Safety
```typescript
// packages/core/constants/routes.ts
export const ROUTES = {
  DASHBOARD: {
    INDEX: '/dashboard',
    PROFILE: {
      OVERVIEW: '/dashboard/profile/overview',
      SETTINGS: '/dashboard/profile/settings'
    }
  }
} as const

// Usage
import { ROUTES } from '@app/core/constants/routes'
router.push(ROUTES.DASHBOARD.PROFILE.OVERVIEW)
```

## State Management Patterns

### React Query with Zustand
```typescript
// For server state - use React Query (via SDK hooks)
const { data: user } = useCurrentUser()

// For client state - use Zustand
import { create } from 'zustand'

interface AppState {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme })
}))
```

## Error Handling Patterns

### API Error Handling
```typescript
import { useJobs } from '@scaffald/sdk/react'

export function DataComponent() {
  const { data, error, isLoading, refetch } = useJobs(
    { organizationId: '123' },
    {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  )

  if (error) {
    return (
      <Stack gap={8} align="center">
        <Text color="error">Failed to load data</Text>
        <Button onPress={() => refetch()}>
          Retry
        </Button>
      </Stack>
    )
  }

  return <div>{/* Success UI */}</div>
}
```

## Form Patterns

### Form with Validation
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  bio: z.string().optional()
})

type ProfileFormData = z.infer<typeof profileSchema>

export function ProfileForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema)
  })

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data)
    } catch (error) {
      console.error('Form submission failed:', error)
    }
  }

  return (
    <Stack gap={16}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          placeholder="Name"
          {...register('name')}
          error={errors.name?.message}
        />
        <Input
          placeholder="Email"
          {...register('email')}
          error={errors.email?.message}
        />
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </form>
    </Stack>
  )
}
```

## Testing Patterns

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react-native'
import { describe, it, expect, vi } from 'vitest'
import { ExampleComponent } from './ExampleComponent'

describe('ExampleComponent', () => {
  it('renders title correctly', () => {
    render(<ExampleComponent title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeTruthy()
  })

  it('calls onPress when button is pressed', () => {
    const mockOnPress = vi.fn()
    render(<ExampleComponent title="Test" onPress={mockOnPress} />)

    fireEvent.press(screen.getByText('Test'))
    expect(mockOnPress).toHaveBeenCalledTimes(1)
  })
})
```

## Configuration Patterns

### Environment Configuration
```typescript
// packages/core/config/env.ts
export const ENV = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  API_URL: process.env.EXPO_PUBLIC_API_URL!,
} as const

// Validation
const requiredEnvVars = Object.entries(ENV)
requiredEnvVars.forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
})
```

### Feature Configuration
```typescript
// packages/core/features/profile/config/constants.ts
export const PROFILE_CONFIG = {
  MAX_BIO_LENGTH: 500,
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png'],
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
} as const

export const PROFILE_ROUTES = {
  OVERVIEW: '/dashboard/profile/overview',
  SETTINGS: '/dashboard/profile/settings',
  EDIT: '/dashboard/profile/edit',
} as const
```

## Performance Patterns

### Lazy Loading
```typescript
import { lazy, Suspense } from 'react'

const LazyComponent = lazy(() => import('./HeavyComponent'))

export function ParentComponent() {
  return (
    <Suspense fallback={<Text>Loading...</Text>}>
      <LazyComponent />
    </Suspense>
  )
}
```

### Memoization
```typescript
import { memo, useMemo, useCallback } from 'react'

export const ExpensiveComponent = memo(({ data, onUpdate }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: true
    }))
  }, [data])

  const handleUpdate = useCallback((id: string) => {
    onUpdate(id)
  }, [onUpdate])

  return (
    <Stack>
      {processedData.map(item => (
        <Item
          key={item.id}
          data={item}
          onUpdate={handleUpdate}
        />
      ))}
    </Stack>
  )
})
```
