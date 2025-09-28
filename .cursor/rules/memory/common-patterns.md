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

// Main screen component
export function ProfileOverviewScreen() {
  return (
    <DashboardLayout
      leftContent={<ProfileEmploymentLeft />}
      rightContent={<ProfileEmploymentRight />}
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

### Tamagui Component Usage
```typescript
import { Button, Text, View, XStack, YStack } from '@tamagui/core'

export function ExampleComponent() {
  return (
    <YStack space="$4" padding="$4">
      <Text fontSize="$6" fontWeight="bold">
        Title
      </Text>
      <XStack space="$2" alignItems="center">
        <Button theme="blue" onPress={handlePress}>
          Action
        </Button>
        <Button variant="outlined" onPress={handleCancel}>
          Cancel
        </Button>
      </XStack>
    </YStack>
  )
}
```

### Cross-Platform Component Pattern
```typescript
// packages/ui/src/components/ExampleComponent.tsx
import { ComponentProps } from 'react'
import { Button, Text, YStack } from '@tamagui/core'

export interface ExampleComponentProps {
  title: string
  onPress?: () => void
  variant?: 'primary' | 'secondary'
}

/**
 * Example cross-platform component
 * @param props - Component props
 * @returns JSX element
 */
export const ExampleComponent = ({ 
  title, 
  onPress, 
  variant = 'primary' 
}: ExampleComponentProps) => {
  return (
    <YStack space="$2">
      <Text fontSize="$5">{title}</Text>
      <Button 
        theme={variant === 'primary' ? 'blue' : 'gray'}
        onPress={onPress}
      >
        {title}
      </Button>
    </YStack>
  )
}
```

## Data Fetching Patterns

### tRPC Query Pattern
```typescript
import { api } from '@app/core/utils/api'

export function ProfileComponent() {
  const { data: profile, isLoading, error } = api.profile.get.useQuery()
  
  if (isLoading) return <Text>Loading...</Text>
  if (error) return <Text>Error: {error.message}</Text>
  if (!profile) return <Text>No profile found</Text>
  
  return (
    <YStack space="$4">
      <Text fontSize="$6">{profile.name}</Text>
      <Text>{profile.email}</Text>
    </YStack>
  )
}
```

### tRPC Mutation Pattern
```typescript
import { api } from '@app/core/utils/api'

export function UpdateProfileForm() {
  const utils = api.useUtils()
  
  const updateProfile = api.profile.update.useMutation({
    onSuccess: () => {
      // Invalidate and refetch profile data
      utils.profile.get.invalidate()
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
// For server state - use React Query (tRPC)
const { data: user } = api.auth.getUser.useQuery()

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
import { api } from '@app/core/utils/api'

export function DataComponent() {
  const { data, error, isLoading } = api.data.get.useQuery(
    { id: '123' },
    {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      onError: (error) => {
        console.error('Data fetch failed:', error)
        // Show toast notification
      }
    }
  )
  
  if (error) {
    return (
      <YStack space="$2" alignItems="center">
        <Text color="$red10">Failed to load data</Text>
        <Button onPress={() => refetch()}>
          Retry
        </Button>
      </YStack>
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
      await api.profile.update.mutate(data)
    } catch (error) {
      console.error('Form submission failed:', error)
    }
  }
  
  return (
    <YStack space="$4" asChild>
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
    </YStack>
  )
}
```

## Testing Patterns

### Component Testing
```typescript
import { render, screen } from '@testing-library/react-native'
import { ExampleComponent } from './ExampleComponent'

describe('ExampleComponent', () => {
  it('renders title correctly', () => {
    render(<ExampleComponent title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeTruthy()
  })
  
  it('calls onPress when button is pressed', () => {
    const mockOnPress = jest.fn()
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
    <YStack>
      {processedData.map(item => (
        <Item 
          key={item.id} 
          data={item} 
          onUpdate={handleUpdate}
        />
      ))}
    </YStack>
  )
})
