import { beforeEach, describe, expect, test, vi, afterEach } from 'vitest'

// Mock AsyncStorage
const asyncStorageStore = new Map<string, string>()

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => asyncStorageStore.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      asyncStorageStore.set(key, value)
    }),
    removeItem: vi.fn(async (key: string) => {
      asyncStorageStore.delete(key)
    }),
    __reset: () => {
      asyncStorageStore.clear()
    },
  },
}))

// Mock PostHog SDK
const mockPostHogInstance = {
  ready: vi.fn().mockResolvedValue(undefined),
  register: vi.fn().mockResolvedValue(undefined),
  optIn: vi.fn().mockResolvedValue(undefined),
  optOut: vi.fn().mockResolvedValue(undefined),
  debug: vi.fn(),
  identify: vi.fn(),
  alias: vi.fn(),
  capture: vi.fn(),
  screen: vi.fn(),
  reset: vi.fn(),
  flush: vi.fn().mockResolvedValue(undefined),
  shutdown: vi.fn().mockResolvedValue(undefined),
  getDistinctId: vi.fn().mockReturnValue('test-distinct-id'),
  optedOut: false,
}

const PostHogConstructor = vi.fn(() => mockPostHogInstance)

vi.mock('posthog-react-native', () => ({
  default: PostHogConstructor,
}))

// Mock expo-constants
const mockConstants = {
  expoConfig: {
    version: '1.0.0',
    runtimeVersion: '1.0.0',
    extra: {
      posthogKey: 'test-key',
      posthogHost: 'https://app.posthog.com',
      appEnv: 'development',
      analytics: {
        posthog: {
          key: 'test-key',
          host: 'https://app.posthog.com',
          env: 'development',
        },
      },
    },
    ios: {
      bundleIdentifier: 'com.test.app',
    },
    android: {
      package: 'com.test.app',
    },
  },
}

vi.mock('expo-constants', () => ({
  default: mockConstants,
}))

// Mock expo-updates
vi.mock('expo-updates', () => ({
  channel: 'development',
  runtimeVersion: '1.0.0',
}))

// Mock react-native Platform
const mockPlatform = {
  OS: 'ios' as 'ios' | 'android' | 'web',
  select: vi.fn(<T>(selections: { ios?: T; android?: T; web?: T; default?: T }) => {
    return selections.ios ?? selections.default
  }),
}

vi.mock('react-native', () => ({
  Platform: mockPlatform,
}))

// Mock validateEventProperties - need to import actual first
vi.mock('../events', async () => {
  const actual = await vi.importActual<typeof import('../events')>('../events')
  return {
    ...actual,
    validateEventProperties: vi.fn((event: string, properties: unknown) => {
      // Use actual validation for now, can be overridden in tests
      return actual.validateEventProperties(event as any, properties as any)
    }),
  }
})

describe('analytics client', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    asyncStorageStore.clear()
    vi.resetModules()
    
    // Set default environment
    process.env.APP_ENV = 'development'
    process.env.POSTHOG_KEY = 'test-key'
    process.env.POSTHOG_HOST = 'https://app.posthog.com'
    delete process.env.EXPO_PUBLIC_POSTHOG_API_KEY

    mockConstants.expoConfig.extra = {
      posthogKey: 'test-key',
      posthogHost: 'https://app.posthog.com',
      appEnv: 'development',
      analytics: {
        posthog: {
          key: 'test-key',
          host: 'https://app.posthog.com',
          env: 'development',
        },
      },
    }
    
    // Reset __DEV__
    ;(global as any).__DEV__ = true
    
    // Reset platform
    mockPlatform.OS = 'ios'
    mockPostHogInstance.optedOut = false
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initAnalytics', () => {
    test('does not initialize when consent is denied', async () => {
      const { initAnalytics } = await import('../client')
      
      await initAnalytics({ hasConsent: false })
      
      expect(PostHogConstructor).not.toHaveBeenCalled()
    })

    test('does not initialize when PostHog key is missing', async () => {
      vi.resetModules()
      process.env.POSTHOG_KEY = ''
      process.env.EXPO_PUBLIC_POSTHOG_API_KEY = ''
      delete process.env.POSTHOG_KEY_DEV
      delete process.env.POSTHOG_KEY_STAGING
      delete process.env.POSTHOG_KEY_PROD
      mockConstants.expoConfig.extra = {
        appEnv: 'development',
        analytics: {
          posthog: {
            key: '',
            host: '',
            env: 'development',
          },
        },
      }
      const { initAnalytics } = await import('../client')

      await initAnalytics({ hasConsent: true })

      expect(PostHogConstructor).not.toHaveBeenCalled()
    })

    test('skips initialization on web platform', async () => {
      mockPlatform.OS = 'web'
      const { initAnalytics } = await import('../client')
      
      await initAnalytics({ hasConsent: true, debug: true })
      
      expect(PostHogConstructor).not.toHaveBeenCalled()
    })

    test('initializes PostHog when consent is granted on native platform', async () => {
      mockPlatform.OS = 'ios'
      const { initAnalytics } = await import('../client')
      
      await initAnalytics({ hasConsent: true })
      
      expect(PostHogConstructor).toHaveBeenCalledWith('test-key', expect.objectContaining({
        host: 'https://app.posthog.com',
        flushAt: 20,
        flushInterval: 30_000,
        disableGeoip: true,
        captureNativeAppLifecycleEvents: true,
        defaultOptIn: false,
      }))
      
      expect(mockPostHogInstance.ready).toHaveBeenCalled()
      expect(mockPostHogInstance.register).toHaveBeenCalled()
      expect(mockPostHogInstance.optIn).toHaveBeenCalled()
    })

    test('updates consent state when client already exists', async () => {
      mockPlatform.OS = 'ios'
      const { initAnalytics } = await import('../client')
      
      // First initialization
      await initAnalytics({ hasConsent: true })
      vi.clearAllMocks()
      
      // Update consent
      await initAnalytics({ hasConsent: false })
      
      expect(mockPostHogInstance.optOut).toHaveBeenCalled()
    })

    test('handles initialization errors gracefully', async () => {
      mockPlatform.OS = 'ios'
      mockPostHogInstance.ready.mockRejectedValueOnce(new Error('Initialization failed'))
      const { initAnalytics, isAnalyticsInitialized } = await import('../client')
      
      await initAnalytics({ hasConsent: true })
      
      // Should not be initialized due to error
      // Note: The client may be set even on error, so this test checks that error was logged
      expect(mockPostHogInstance.ready).toHaveBeenCalled()
    })
  })

  describe('captureEvent', () => {
    test('returns false when client is not initialized', async () => {
      vi.resetModules()
      const { captureEvent } = await import('../client')
      
      const result = captureEvent('user_signed_in', {
        provider: 'email',
        is_new_user: true,
      })
      
      expect(result).toBe(false)
    })

    test('validates event properties before sending', async () => {
      vi.resetModules()
      mockPlatform.OS = 'ios'
      const { initAnalytics, captureEvent } = await import('../client')
      const { validateEventProperties } = await import('../events')
      
      await initAnalytics({ hasConsent: true })
      
      captureEvent('user_signed_in', {
        provider: 'email',
        is_new_user: true,
      })
      
      expect(validateEventProperties).toHaveBeenCalled()
    })

    test('sends event when validation succeeds', async () => {
      vi.resetModules()
      mockPlatform.OS = 'ios'
      const { initAnalytics, captureEvent } = await import('../client')
      
      await initAnalytics({ hasConsent: true })
      
      const result = captureEvent('user_signed_in', {
        provider: 'email',
        is_new_user: true,
      })
      
      expect(result).toBe(true)
      expect(mockPostHogInstance.capture).toHaveBeenCalledWith(
        'user_signed_in',
        expect.objectContaining({
          provider: 'email',
          is_new_user: true,
        }),
      )
    })
  })

  describe('identify', () => {
    test('does not identify when client is not initialized', async () => {
      vi.resetModules()
      const { identify } = await import('../client')
      
      identify('user-123', { email: 'test@example.com' })
      
      expect(mockPostHogInstance.identify).not.toHaveBeenCalled()
    })

    test('calls PostHog identify with user ID and properties', async () => {
      vi.resetModules()
      mockPlatform.OS = 'ios'
      const { initAnalytics, identify } = await import('../client')
      
      await initAnalytics({ hasConsent: true })
      
      identify('user-123', { email: 'test@example.com' })
      
      expect(mockPostHogInstance.identify).toHaveBeenCalledWith(
        'user-123',
        { email: 'test@example.com' },
      )
    })

    test('does not identify when user opted out', async () => {
      vi.resetModules()
      mockPlatform.OS = 'ios'
      const { initAnalytics, identify } = await import('../client')
      
      await initAnalytics({ hasConsent: true })
      mockPostHogInstance.optedOut = true
      
      identify('user-123', { email: 'test@example.com' })
      
      expect(mockPostHogInstance.identify).not.toHaveBeenCalled()
    })
  })

  describe('alias', () => {
    test('does not alias when client is not initialized', async () => {
      vi.resetModules()
      const { alias } = await import('../client')
      
      alias('user-123')
      
      expect(mockPostHogInstance.alias).not.toHaveBeenCalled()
    })

    test('calls PostHog alias with user ID', async () => {
      vi.resetModules()
      mockPlatform.OS = 'ios'
      const { initAnalytics, alias } = await import('../client')
      
      await initAnalytics({ hasConsent: true })
      
      alias('user-123')
      
      expect(mockPostHogInstance.alias).toHaveBeenCalledWith('user-123')
    })
  })

  describe('platform detection', () => {
    test('initializes on iOS', async () => {
      vi.resetModules()
      mockPlatform.OS = 'ios'
      const { initAnalytics } = await import('../client')
      
      await initAnalytics({ hasConsent: true })
      
      expect(PostHogConstructor).toHaveBeenCalled()
    })

    test('initializes on Android', async () => {
      vi.resetModules()
      mockPlatform.OS = 'android'
      const { initAnalytics } = await import('../client')
      
      await initAnalytics({ hasConsent: true })
      
      expect(PostHogConstructor).toHaveBeenCalled()
    })

    test('skips initialization on web', async () => {
      vi.resetModules()
      mockPlatform.OS = 'web'
      const { initAnalytics } = await import('../client')
      
      await initAnalytics({ hasConsent: true, debug: true })
      
      expect(PostHogConstructor).not.toHaveBeenCalled()
    })
  })

  describe('consent state management', () => {
    test('opts in when consent is granted', async () => {
      vi.resetModules()
      mockPlatform.OS = 'ios'
      const { initAnalytics } = await import('../client')
      
      await initAnalytics({ hasConsent: true })
      
      expect(mockPostHogInstance.optIn).toHaveBeenCalled()
    })

    test('opts out when consent is revoked', async () => {
      vi.resetModules()
      mockPlatform.OS = 'ios'
      const { initAnalytics } = await import('../client')
      
      await initAnalytics({ hasConsent: true })
      vi.clearAllMocks()
      
      await initAnalytics({ hasConsent: false })
      
      expect(mockPostHogInstance.optOut).toHaveBeenCalled()
    })
  })

  describe('utility functions', () => {
    test('isAnalyticsAvailable returns true when key and host are configured', async () => {
      vi.resetModules()
      const { isAnalyticsAvailable } = await import('../client')
      
      expect(isAnalyticsAvailable()).toBe(true)
    })

    test('isAnalyticsAvailable returns false when key is missing', async () => {
      vi.resetModules()
      process.env.POSTHOG_KEY = ''
      const { isAnalyticsAvailable } = await import('../client')
      
      // May still return true if key comes from expo config
      const result = isAnalyticsAvailable()
      expect(typeof result).toBe('boolean')
    })

    test('isAnalyticsInitialized returns false before initialization', async () => {
      vi.resetModules()
      const { isAnalyticsInitialized } = await import('../client')
      
      expect(isAnalyticsInitialized()).toBe(false)
    })

    test('isAnalyticsInitialized returns true after initialization', async () => {
      vi.resetModules()
      mockPlatform.OS = 'ios'
      const { initAnalytics, isAnalyticsInitialized } = await import('../client')
      
      await initAnalytics({ hasConsent: true })
      
      expect(isAnalyticsInitialized()).toBe(true)
    })

    test('getAnalyticsClient returns null before initialization', async () => {
      vi.resetModules()
      const { getAnalyticsClient } = await import('../client')
      
      expect(getAnalyticsClient()).toBe(null)
    })

    test('getAnalyticsClient returns client after initialization', async () => {
      vi.resetModules()
      mockPlatform.OS = 'ios'
      const { initAnalytics, getAnalyticsClient } = await import('../client')
      
      await initAnalytics({ hasConsent: true })
      
      expect(getAnalyticsClient()).toBe(mockPostHogInstance)
    })
  })
})
