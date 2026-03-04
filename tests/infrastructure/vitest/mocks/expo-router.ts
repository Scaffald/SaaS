import { vi } from 'vitest'

export const useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  navigate: vi.fn(),
  dismiss: vi.fn(),
}))

export const useSegments = vi.fn(() => [])
export const usePathname = vi.fn(() => '/')
export const useLocalSearchParams = vi.fn(() => ({}))
export const useGlobalSearchParams = vi.fn(() => ({}))
export const useRootNavigationState = vi.fn(() => null)
export const useNavigation = vi.fn(() => null)
export const useFocusEffect = vi.fn()
export const useIsFocused = vi.fn(() => true)
export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  navigate: vi.fn(),
  dismiss: vi.fn(),
}
export const Link = vi.fn()
export const Redirect = vi.fn()
export const Stack = vi.fn()
export const Tabs = vi.fn()
export const Slot = vi.fn()
