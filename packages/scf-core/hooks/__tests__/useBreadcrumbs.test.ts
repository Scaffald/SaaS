import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks  (vi.mock factories are hoisted -- no external references allowed)
// ---------------------------------------------------------------------------

const usePathnameMock = vi.fn<() => string>()

vi.mock('expo-router', () => ({
  usePathname: () => usePathnameMock(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSegments: () => [],
}))

vi.mock('@scf/core/utils/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    locale: 'en',
    setLocale: vi.fn(),
  }),
}))

vi.mock('@scf/core/constants/routes', () => {
  const ALL_ROUTES = [
    { path: '/', titleKey: 'routes.home', protected: false, exact: true },
    { path: '/dashboard', titleKey: 'routes.dashboard.title', protected: true, exact: false },
    { path: '/workers', titleKey: 'routes.dashboard.discover.workers.title', protected: true, exact: false },
    { path: '/workers/:id', titleKey: 'routes.dashboard.discover.workers.detail', protected: true, exact: true },
    { path: '/workers/map', titleKey: 'routes.dashboard.discover.map', protected: true, exact: true },
    { path: '/employers', titleKey: 'routes.dashboard.discover.employers.title', protected: true, exact: false },
    { path: '/employers/create', titleKey: 'routes.dashboard.discover.employers.create', protected: true, exact: true },
    { path: '/employers/:id', titleKey: 'routes.dashboard.discover.employers.detail', protected: true, exact: true },
    { path: '/employers/org', titleKey: 'routes.org.title', protected: true, exact: false },
    { path: '/employers/org/:slug', titleKey: 'routes.org.detail', protected: true, exact: false },
    { path: '/profile', titleKey: 'routes.dashboard.profile.title', protected: true, exact: false },
    { path: '/profile/general', titleKey: 'routes.dashboard.profile.general', protected: true, exact: true },
    // Route with a gap -- /settings is exact:true, /settings/notifications/email exists
    // but /settings/notifications does NOT exist (intermediate segment)
    { path: '/settings', titleKey: 'routes.settings', protected: true, exact: true },
    { path: '/settings/notifications/email', titleKey: 'routes.settings.notifications.email', protected: true, exact: true },
  ]

  function flattenRoutes() {
    return ALL_ROUTES
  }

  function matchesRoute(path: string, route: { path: string; exact?: boolean }): boolean {
    const normalizedPath = path.replace(/\/+$/, '') || '/'
    const routePattern = route.path.replace(/:[^/]+/g, '[^/]+')
    const regex = new RegExp(`^${routePattern}$`)
    if (route.exact) {
      return regex.test(normalizedPath)
    }
    const basePath = route.path.split(':')[0]
    return normalizedPath.startsWith(basePath) || regex.test(normalizedPath)
  }

  return {
    flattenRoutes,
    matchesRoute,
    ROUTES: {
      HOME: { path: '/', titleKey: 'routes.home', protected: false, exact: true },
      DASHBOARD: { path: '/dashboard', titleKey: 'routes.dashboard.title', protected: true, exact: false },
    },
    RouteConfig: {},
    buildPath: vi.fn(),
    isRouteConfig: vi.fn(),
  }
})

// Import after mocks are registered
import { useBreadcrumbs } from '../useBreadcrumbs'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setPathname(path: string) {
  usePathnameMock.mockReturnValue(path)
}

/** Render the hook with a given pathname and options */
function renderBreadcrumbs(
  path: string,
  options: Parameters<typeof useBreadcrumbs>[0] = {}
) {
  setPathname(path)
  return renderHook(() => useBreadcrumbs(options))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useBreadcrumbs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setPathname('/')
  })

  // -----------------------------------------------------------------------
  // Default / no-options behaviour
  // -----------------------------------------------------------------------

  describe('default behaviour (no options)', () => {
    it('returns empty breadcrumbs when autoGenerate is false', () => {
      const { result } = renderBreadcrumbs('/')
      expect(result.current.breadcrumbs).toEqual([])
    })

    it('returns empty breadcrumbs when no options are provided', () => {
      const { result } = renderBreadcrumbs('/dashboard/anything')
      expect(result.current.breadcrumbs).toEqual([])
    })
  })

  // -----------------------------------------------------------------------
  // Custom items
  // -----------------------------------------------------------------------

  describe('customItems', () => {
    it('uses custom breadcrumb items when provided', () => {
      const custom = [
        { label: 'Home', href: '/' },
        { label: 'About' },
      ]
      const { result } = renderBreadcrumbs('/', { customItems: custom })
      expect(result.current.breadcrumbs).toEqual(custom)
    })

    it('custom items take priority over auto-generation', () => {
      const custom = [{ label: 'Custom Root', href: '/custom' }]
      const { result } = renderBreadcrumbs('/dashboard', {
        autoGenerate: true,
        customItems: custom,
      })
      expect(result.current.breadcrumbs).toEqual(custom)
    })
  })

  // -----------------------------------------------------------------------
  // Root path handling
  // -----------------------------------------------------------------------

  describe('root path', () => {
    it('generates Home breadcrumb for root path "/"', () => {
      const { result } = renderBreadcrumbs('/', { autoGenerate: true })
      const crumbs = result.current.breadcrumbs
      expect(crumbs.length).toBe(1)
      // Root maps to the Home route
      expect(crumbs[0].href).toBe('/')
      expect(crumbs[0].label).toBe('routes.home')
    })
  })

  // -----------------------------------------------------------------------
  // Dashboard route precedence
  // -----------------------------------------------------------------------

  describe('dashboard route precedence', () => {
    it('uses Dashboard as apex for dashboard routes (not Home)', () => {
      const { result } = renderBreadcrumbs('/dashboard', {
        autoGenerate: true,
      })
      const crumbs = result.current.breadcrumbs
      expect(crumbs.length).toBeGreaterThanOrEqual(1)
      expect(crumbs[0].href).toBe('/dashboard')
      expect(crumbs[0].label).toBe('routes.dashboard.title')
    })

    it('does not include Home breadcrumb for dashboard routes', () => {
      const { result } = renderBreadcrumbs('/dashboard', {
        autoGenerate: true,
      })
      const homeItem = result.current.breadcrumbs.find(
        (b) => b.href === '/' || b.label === 'Home'
      )
      expect(homeItem).toBeUndefined()
    })

    it('dashboard sub-paths all start with Dashboard as first crumb', () => {
      const { result } = renderBreadcrumbs('/dashboard/some/deep/path', {
        autoGenerate: true,
      })
      const crumbs = result.current.breadcrumbs
      expect(crumbs[0].href).toBe('/dashboard')
      expect(crumbs[0].label).toBe('routes.dashboard.title')
    })
  })

  // -----------------------------------------------------------------------
  // Known route matching
  // -----------------------------------------------------------------------

  describe('known route matching', () => {
    it('generates breadcrumbs for a known route', () => {
      const { result } = renderBreadcrumbs('/employers', {
        autoGenerate: true,
      })
      const crumbs = result.current.breadcrumbs
      expect(crumbs.length).toBeGreaterThanOrEqual(1)
      const employersItem = crumbs.find((b) => b.href === '/employers')
      expect(employersItem).toBeDefined()
    })

    it('builds hierarchy for a deep known route', () => {
      const { result } = renderBreadcrumbs('/employers/create', {
        autoGenerate: true,
      })
      const crumbs = result.current.breadcrumbs
      expect(crumbs.length).toBeGreaterThanOrEqual(2)
      expect(crumbs.some((b) => b.href === '/employers')).toBe(true)
      expect(crumbs.some((b) => b.href === '/employers/create')).toBe(true)
    })

    it('uses translated titleKey as label for known routes', () => {
      const { result } = renderBreadcrumbs('/employers', {
        autoGenerate: true,
      })
      const employersItem = result.current.breadcrumbs.find(
        (b) => b.href === '/employers'
      )
      expect(employersItem).toBeDefined()
      // t() mock returns key as-is
      expect(employersItem!.label).toBe(
        'routes.dashboard.discover.employers.title'
      )
    })
  })

  // -----------------------------------------------------------------------
  // Dynamic route segments
  // -----------------------------------------------------------------------

  describe('dynamic route segments', () => {
    it('matches a dynamic route like /workers/:id', () => {
      const { result } = renderBreadcrumbs('/workers/abc-123', {
        autoGenerate: true,
      })
      const crumbs = result.current.breadcrumbs
      expect(crumbs.length).toBeGreaterThanOrEqual(1)
      const workersItem = crumbs.find((b) => b.href === '/workers')
      expect(workersItem).toBeDefined()
    })

    it('matches a deeply nested dynamic route like /employers/org/:slug', () => {
      const { result } = renderBreadcrumbs('/employers/org/acme-corp', {
        autoGenerate: true,
      })
      const crumbs = result.current.breadcrumbs
      expect(crumbs.length).toBeGreaterThanOrEqual(2)
      expect(crumbs.some((b) => b.href === '/employers')).toBe(true)
    })
  })

  // -----------------------------------------------------------------------
  // Intermediate path segment detection
  // -----------------------------------------------------------------------

  describe('intermediate path segments', () => {
    it('creates intermediate breadcrumb between exact parent and deep child', () => {
      // /settings is exact:true, /settings/notifications/email exists,
      // but /settings/notifications does NOT -- should be auto-generated
      const { result } = renderBreadcrumbs('/settings/notifications/email', {
        autoGenerate: true,
      })
      const crumbs = result.current.breadcrumbs

      // Should include /settings parent
      expect(crumbs.some((b) => b.href === '/settings')).toBe(true)
      // Should include intermediate /settings/notifications with de-kebab label
      const intermediate = crumbs.find(
        (b) => b.href === '/settings/notifications'
      )
      expect(intermediate).toBeDefined()
      expect(intermediate!.label).toBe('Notifications')
      // Should include the final route
      expect(
        crumbs.some((b) => b.href === '/settings/notifications/email')
      ).toBe(true)
    })

    it('generates correct breadcrumb count for dashboard sub-paths', () => {
      // /dashboard is non-exact, so all intermediate paths match it
      const { result } = renderBreadcrumbs('/dashboard/section/detail', {
        autoGenerate: true,
      })
      const crumbs = result.current.breadcrumbs
      // Should produce 3 breadcrumbs: dashboard, section, detail
      expect(crumbs.length).toBe(3)
      expect(crumbs[0].href).toBe('/dashboard')
    })
  })

  // -----------------------------------------------------------------------
  // Path-based fallback (unregistered routes)
  // -----------------------------------------------------------------------

  describe('path-based fallback', () => {
    it('generates breadcrumbs from path for fully unknown routes', () => {
      // A path with no matching routes at all (not under /dashboard which is non-exact)
      const { result } = renderBreadcrumbs('/totally/unknown/path', {
        autoGenerate: true,
      })
      const crumbs = result.current.breadcrumbs
      expect(crumbs.length).toBeGreaterThanOrEqual(1)
      // Should have generated labels from path segments
      expect(crumbs.some((b) => b.label === 'Unknown')).toBe(true)
      expect(crumbs.some((b) => b.label === 'Path')).toBe(true)
    })

    it('capitalizes and de-kebabs path segments in fallback', () => {
      const { result } = renderBreadcrumbs('/some-cool-page', {
        autoGenerate: true,
      })
      const crumbs = result.current.breadcrumbs
      expect(crumbs.some((b) => b.label === 'Some Cool Page')).toBe(true)
    })
  })

  // -----------------------------------------------------------------------
  // updateBreadcrumb
  // -----------------------------------------------------------------------

  describe('updateBreadcrumb', () => {
    it('updates a specific breadcrumb by index', () => {
      const { result } = renderBreadcrumbs('/dashboard', {
        autoGenerate: true,
      })
      const initialLength = result.current.breadcrumbs.length
      expect(initialLength).toBeGreaterThanOrEqual(1)

      act(() => {
        result.current.updateBreadcrumb(0, { label: 'My Dashboard' })
      })

      expect(result.current.breadcrumbs[0].label).toBe('My Dashboard')
    })

    it('preserves other properties when updating', () => {
      const custom = [
        { label: 'A', href: '/a' },
        { label: 'B', href: '/b' },
      ]
      const { result } = renderBreadcrumbs('/', { customItems: custom })

      act(() => {
        result.current.updateBreadcrumb(1, { label: 'Updated B' })
      })

      expect(result.current.breadcrumbs[1].label).toBe('Updated B')
      expect(result.current.breadcrumbs[1].href).toBe('/b')
      expect(result.current.breadcrumbs[0]).toEqual({ label: 'A', href: '/a' })
    })

    it('can update href on a breadcrumb', () => {
      const custom = [{ label: 'Page', href: '/old' }]
      const { result } = renderBreadcrumbs('/', { customItems: custom })

      act(() => {
        result.current.updateBreadcrumb(0, { href: '/new' })
      })

      expect(result.current.breadcrumbs[0].href).toBe('/new')
      expect(result.current.breadcrumbs[0].label).toBe('Page')
    })
  })

  // -----------------------------------------------------------------------
  // resetBreadcrumbs
  // -----------------------------------------------------------------------

  describe('resetBreadcrumbs', () => {
    it('resets to auto-generated state after manual updates', () => {
      const { result } = renderBreadcrumbs('/dashboard', {
        autoGenerate: true,
      })
      const original = [...result.current.breadcrumbs]

      act(() => {
        result.current.updateBreadcrumb(0, { label: 'Changed' })
      })
      expect(result.current.breadcrumbs[0].label).toBe('Changed')

      act(() => {
        result.current.resetBreadcrumbs()
      })
      expect(result.current.breadcrumbs).toEqual(original)
    })

    it('resets to customItems when provided', () => {
      const custom = [{ label: 'Custom', href: '/custom' }]
      const { result } = renderBreadcrumbs('/', { customItems: custom })

      act(() => {
        result.current.updateBreadcrumb(0, { label: 'Modified' })
      })
      expect(result.current.breadcrumbs[0].label).toBe('Modified')

      act(() => {
        result.current.resetBreadcrumbs()
      })
      expect(result.current.breadcrumbs).toEqual(custom)
    })
  })

  // -----------------------------------------------------------------------
  // Priority: manualItems > customItems > autoGenerated
  // -----------------------------------------------------------------------

  describe('breadcrumb priority', () => {
    it('manual updates override customItems', () => {
      const custom = [{ label: 'Original', href: '/x' }]
      const { result } = renderBreadcrumbs('/', { customItems: custom })

      act(() => {
        result.current.updateBreadcrumb(0, { label: 'Manual' })
      })

      expect(result.current.breadcrumbs[0].label).toBe('Manual')
    })

    it('manual updates override autoGenerate', () => {
      const { result } = renderBreadcrumbs('/dashboard', {
        autoGenerate: true,
      })

      act(() => {
        result.current.updateBreadcrumb(0, { label: 'Overridden' })
      })

      expect(result.current.breadcrumbs[0].label).toBe('Overridden')
    })
  })

  // -----------------------------------------------------------------------
  // Return shape
  // -----------------------------------------------------------------------

  describe('return shape', () => {
    it('returns breadcrumbs array, updateBreadcrumb fn, and resetBreadcrumbs fn', () => {
      const { result } = renderBreadcrumbs('/')
      expect(Array.isArray(result.current.breadcrumbs)).toBe(true)
      expect(typeof result.current.updateBreadcrumb).toBe('function')
      expect(typeof result.current.resetBreadcrumbs).toBe('function')
    })
  })

  // -----------------------------------------------------------------------
  // Breadcrumb items have correct shape
  // -----------------------------------------------------------------------

  describe('breadcrumb item shape', () => {
    it('each breadcrumb has label and href', () => {
      const { result } = renderBreadcrumbs('/employers/create', {
        autoGenerate: true,
      })
      result.current.breadcrumbs.forEach((crumb) => {
        expect(crumb).toHaveProperty('label')
        expect(typeof crumb.label).toBe('string')
        expect(crumb.label.length).toBeGreaterThan(0)
        expect(crumb).toHaveProperty('href')
      })
    })
  })

  // -----------------------------------------------------------------------
  // Infinite loop protection
  // -----------------------------------------------------------------------

  describe('infinite loop protection', () => {
    it('does not exceed depth limit for deeply nested unknown paths', () => {
      const deepPath = '/dashboard/a/b/c/d/e/f/g/h/i/j/k'
      const { result } = renderBreadcrumbs(deepPath, { autoGenerate: true })
      // Should not hang; should produce some breadcrumbs
      expect(result.current.breadcrumbs.length).toBeGreaterThan(0)
      // Dashboard should be first
      expect(result.current.breadcrumbs[0].href).toBe('/dashboard')
    })
  })

  // -----------------------------------------------------------------------
  // No duplicate breadcrumbs
  // -----------------------------------------------------------------------

  describe('deduplication', () => {
    it('does not produce duplicate Dashboard entries', () => {
      const { result } = renderBreadcrumbs('/dashboard', {
        autoGenerate: true,
      })
      const dashboardItems = result.current.breadcrumbs.filter(
        (b) => b.href === '/dashboard'
      )
      expect(dashboardItems.length).toBe(1)
    })

    it('does not produce duplicate href entries for nested paths', () => {
      const { result } = renderBreadcrumbs(
        '/dashboard/unknown/deep',
        { autoGenerate: true }
      )
      const hrefs = result.current.breadcrumbs.map((b) => b.href)
      const unique = new Set(hrefs)
      expect(hrefs.length).toBe(unique.size)
    })
  })

  // -----------------------------------------------------------------------
  // Non-dashboard routes with parent hierarchy
  // -----------------------------------------------------------------------

  describe('non-dashboard route hierarchy', () => {
    it('builds parent chain for /profile/general', () => {
      const { result } = renderBreadcrumbs('/profile/general', {
        autoGenerate: true,
      })
      const crumbs = result.current.breadcrumbs
      expect(crumbs.length).toBeGreaterThanOrEqual(2)
      expect(crumbs.some((b) => b.href === '/profile')).toBe(true)
      expect(crumbs.some((b) => b.href === '/profile/general')).toBe(true)
    })

    it('workers/map includes parent workers breadcrumb', () => {
      const { result } = renderBreadcrumbs('/workers/map', {
        autoGenerate: true,
      })
      const crumbs = result.current.breadcrumbs
      expect(crumbs.some((b) => b.href === '/workers')).toBe(true)
      expect(crumbs.some((b) => b.href === '/workers/map')).toBe(true)
    })

    it('parent breadcrumb comes before child in order', () => {
      const { result } = renderBreadcrumbs('/employers/create', {
        autoGenerate: true,
      })
      const crumbs = result.current.breadcrumbs
      const parentIdx = crumbs.findIndex((b) => b.href === '/employers')
      const childIdx = crumbs.findIndex((b) => b.href === '/employers/create')
      expect(parentIdx).toBeLessThan(childIdx)
    })
  })
})
