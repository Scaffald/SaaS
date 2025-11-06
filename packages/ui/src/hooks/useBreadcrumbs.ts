import { useState, useCallback, useMemo } from 'react'
import { usePathname } from 'expo-router'
import { ROUTES, matchesRoute, type RouteConfig } from '@app/core/constants/routes'
import type { BreadcrumbItem, BreadcrumbSibling } from '../components/Breadcrumb'

export interface UseBreadcrumbsOptions {
  /** Whether to auto-generate breadcrumbs from route (default: false) */
  autoGenerate?: boolean
  /** Manual breadcrumb items to override auto-generation */
  customItems?: BreadcrumbItem[]
}

export interface UseBreadcrumbsReturn {
  /** Array of breadcrumb items */
  breadcrumbs: BreadcrumbItem[]
  /** Update a specific breadcrumb item by index */
  updateBreadcrumb: (index: number, updates: Partial<BreadcrumbItem>) => void
  /** Reset breadcrumbs to auto-generated state (if autoGenerate is true) */
  resetBreadcrumbs: () => void
}

/**
 * Hook for managing breadcrumb navigation items
 *
 * Supports both auto-generation from routes and manual override.
 * When autoGenerate is true, breadcrumbs are generated from the current pathname.
 * When customItems are provided, they take precedence over auto-generated items.
 *
 * @example
 * ```tsx
 * const { breadcrumbs } = useBreadcrumbs({ autoGenerate: true })
 * ```
 *
 * @example
 * ```tsx
 * const { breadcrumbs, updateBreadcrumb } = useBreadcrumbs({
 *   customItems: [
 *     { label: 'Home', href: '/' },
 *     { label: 'Page', href: '/page' }
 *   ]
 * })
 *
 * // Update a specific breadcrumb
 * updateBreadcrumb(1, { label: 'Updated Page' })
 * ```
 */
export function useBreadcrumbs(options: UseBreadcrumbsOptions = {}): UseBreadcrumbsReturn {
  const { autoGenerate = false, customItems } = options
  const pathname = usePathname()
  const [manualItems, setManualItems] = useState<BreadcrumbItem[] | null>(null)

  // Find matching route for a given path
  const findMatchingRoute = useCallback((path: string): RouteConfig | null => {
    // Try exact match first
    const exactMatch = Object.values(ROUTES).find((route) => route.path === path)
    if (exactMatch) {
      return exactMatch
    }

    // Try dynamic route match
    const dynamicMatch = Object.values(ROUTES).find((route) => matchesRoute(path, route))
    if (dynamicMatch) {
      return dynamicMatch
    }

    return null
  }, [])

  // Find parent route for a given path
  const findParentRoute = useCallback(
    (path: string): RouteConfig | null => {
      const segments = path.split('/').filter(Boolean)
      if (segments.length === 0) {
        return null
      }

      // For dashboard routes, prefer Dashboard over Home
      if (segments[0] === 'dashboard' && segments.length > 1) {
        // Try to find Dashboard route first
        const dashboardRoute = findMatchingRoute('/dashboard')
        if (dashboardRoute) {
          return dashboardRoute
        }
      }

      // Try progressively shorter paths
      for (let i = segments.length - 1; i > 0; i--) {
        const parentPath = `/${segments.slice(0, i).join('/')}`
        const parentRoute = findMatchingRoute(parentPath)
        if (parentRoute) {
          return parentRoute
        }
      }

      // For dashboard routes, return Dashboard instead of Home
      if (segments[0] === 'dashboard') {
        const dashboardRoute = findMatchingRoute('/dashboard')
        if (dashboardRoute) {
          return dashboardRoute
        }
      }

      // Check root path (Home) only as last resort
      const rootRoute = findMatchingRoute('/')
      return rootRoute
    },
    [findMatchingRoute]
  )

  // Get sibling routes for a given path
  const getSiblingRoutes = useCallback(
    (path: string, currentRoute: RouteConfig | null): BreadcrumbSibling[] => {
      if (!currentRoute) {
        return []
      }

      const pathSegments = path.split('/').filter(Boolean)
      const routeSegments = currentRoute.path.split('/').filter(Boolean)
      const depth = routeSegments.length

      // Find all routes at the same depth with matching parent path
      const siblings: BreadcrumbSibling[] = []
      const parentPath = pathSegments.slice(0, -1).join('/')

      for (const route of Object.values(ROUTES)) {
        // Skip dynamic routes with parameters (they're not true siblings)
        if (route.path.includes(':')) {
          continue
        }

        const routePathSegments = route.path.split('/').filter(Boolean)

        // Must be at same depth
        if (routePathSegments.length !== depth) {
          continue
        }

        // Must have same parent path
        const routeParentPath = routePathSegments.slice(0, -1).join('/')
        if (routeParentPath !== parentPath) {
          continue
        }

        // Skip current route
        if (route.path === currentRoute.path) {
          continue
        }

        siblings.push({
          label: route.title,
          href: route.path,
          isActive: false,
        })
      }

      return siblings
    },
    [findMatchingRoute]
  )

  // Find all routes sharing a common parent path (for intermediate segments)
  const findRoutesAtPath = useCallback((parentPath: string): RouteConfig[] => {
    return Object.values(ROUTES).filter((route) => {
      // Skip dynamic routes
      if (route.path.includes(':')) {
        return false
      }
      // Check if route starts with parent path and is one level deeper
      const routeSegments = route.path.split('/').filter(Boolean)
      const parentSegments = parentPath.split('/').filter(Boolean)
      return (
        route.path.startsWith(`${parentPath}/`) &&
        routeSegments.length === parentSegments.length + 1
      )
    })
  }, [])

  // Generate breadcrumbs from pathname (fallback when no route match)
  // Define this first so it can be used in generateBreadcrumbsFromRoute
  const generateBreadcrumbsFromPath = useCallback(
    (path: string): BreadcrumbItem[] => {
      if (path === '/') {
        // Check if dashboard route exists
        const dashboardRoute = findMatchingRoute('/dashboard')
        if (dashboardRoute) {
          return [{ label: dashboardRoute.title, href: dashboardRoute.path, isActive: true }]
        }
        return [{ label: 'Dashboard', href: '/dashboard', isActive: true }]
      }

      const segments = path.split('/').filter(Boolean)
      const items: BreadcrumbItem[] = []

      // For dashboard routes, start with Dashboard instead of Home
      if (segments[0] === 'dashboard') {
        const dashboardRoute = findMatchingRoute('/dashboard')
        if (dashboardRoute) {
          items.push({
            label: dashboardRoute.title,
            href: dashboardRoute.path,
          })
        } else {
          items.push({ label: 'Dashboard', href: '/dashboard' })
        }
      }
      // Note: We don't add Home for dashboard routes - Dashboard is the apex

      // Build breadcrumbs from path segments
      let currentPath = ''
      segments.forEach((segment, index) => {
        currentPath += `/${segment}`
        const isLast = index === segments.length - 1

        // Capitalize first letter and replace hyphens with spaces
        const label = segment
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')

        // Add segment (no siblings - simplified breadcrumbs)
        items.push({
          label,
          href: currentPath,
          isActive: isLast,
          siblings: undefined,
        })
      })

      return items
    },
    [findMatchingRoute]
  )

  // Generate breadcrumbs from route configuration
  const generateBreadcrumbsFromRoute = useCallback(
    (path: string): BreadcrumbItem[] => {
      const items: BreadcrumbItem[] = []
      const visitedPaths = new Set<string>()
      const isDashboardRoute = path.startsWith('/dashboard')

      // Recursively build breadcrumb hierarchy
      const buildHierarchy = (currentPath: string, depth = 0): void => {
        // Prevent infinite loops
        if (visitedPaths.has(currentPath) || depth > 10) {
          return
        }
        visitedPaths.add(currentPath)

        const route = findMatchingRoute(currentPath)
        const isLast = currentPath === path

        if (route) {
          // Find parent route
          const parentRoute = findParentRoute(currentPath)

          // If parent exists, check for intermediate segments between parent and current
          if (parentRoute) {
            if (!visitedPaths.has(parentRoute.path)) {
              buildHierarchy(parentRoute.path, depth + 1)
            }

            // Check for intermediate path segments between parent and current route
            const currentSegments = currentPath.split('/').filter(Boolean)
            const parentSegments = parentRoute.path.split('/').filter(Boolean)

            // If there are intermediate segments (e.g., /dashboard/discover between /dashboard and /dashboard/discover/employers)
            if (currentSegments.length > parentSegments.length + 1) {
              // Build intermediate path segments
              for (let i = parentSegments.length + 1; i < currentSegments.length; i++) {
                const intermediatePath = `/${currentSegments.slice(0, i).join('/')}`
                if (!visitedPaths.has(intermediatePath)) {
                  const intermediateRoute = findMatchingRoute(intermediatePath)
                  if (!intermediateRoute) {
                    // Create intermediate breadcrumb from path segments
                    const intermediateSegment = currentSegments[i - 1]
                    const intermediateLabel = intermediateSegment
                      .split('-')
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')

                    // Find siblings at this intermediate level
                    const siblingRoutes = findRoutesAtPath(intermediatePath)
                    const siblings: BreadcrumbSibling[] = siblingRoutes.map((r) => ({
                      label: r.title,
                      href: r.path,
                      isActive: false,
                    }))

                    // Add intermediate breadcrumb
                    items.push({
                      label: intermediateLabel,
                      href: intermediatePath,
                      isActive: false,
                      siblings: siblings.length > 0 ? siblings : undefined,
                    })
                    visitedPaths.add(intermediatePath)
                  } else {
                    buildHierarchy(intermediatePath, depth + 1)
                  }
                }
              }
            }
          } else if (!parentRoute && currentPath !== '/dashboard') {
            // No explicit parent route found - check for intermediate path segments
            const segments = currentPath.split('/').filter(Boolean)
            if (segments.length > 1) {
              // Try to build intermediate segments
              const parentPath = `/${segments.slice(0, -1).join('/')}`
              if (parentPath !== '/' && !visitedPaths.has(parentPath)) {
                const intermediateRoute = findMatchingRoute(parentPath)
                if (!intermediateRoute) {
                  // Create intermediate breadcrumb from path segments
                  const intermediateSegments = parentPath.split('/').filter(Boolean)
                  const intermediateLabel = intermediateSegments[intermediateSegments.length - 1]
                    .split('-')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')

                  // Add intermediate breadcrumb (no siblings - simplified breadcrumbs)
                  items.push({
                    label: intermediateLabel,
                    href: parentPath,
                    isActive: false,
                    siblings: undefined,
                  })
                  visitedPaths.add(parentPath)
                } else {
                  buildHierarchy(parentPath, depth + 1)
                }
              }
            }
          }

          // Add current route (no siblings - simplified breadcrumbs)
          items.push({
            label: route.title,
            href: currentPath,
            isActive: isLast,
            siblings: undefined,
          })
        } else {
          // Fallback: generate from path segments
          const segments = currentPath.split('/').filter(Boolean)
          if (segments.length === 0) {
            // Root path - use Dashboard as apex
            const dashboardRoute = findMatchingRoute('/dashboard')
            if (dashboardRoute) {
              items.push({
                label: dashboardRoute.title,
                href: dashboardRoute.path,
                isActive: path === '/',
              })
            } else {
              items.push({ label: 'Dashboard', href: '/dashboard', isActive: path === '/' })
            }
            return
          }

          // For dashboard routes, use Dashboard as apex instead of Home
          if (segments[0] === 'dashboard') {
            const dashboardRoute = findMatchingRoute('/dashboard')
            if (dashboardRoute && !visitedPaths.has('/dashboard')) {
              items.push({
                label: dashboardRoute.title,
                href: dashboardRoute.path,
              })
              visitedPaths.add('/dashboard')
            }
          }

          // Build parent path
          const parentPath = `/${segments.slice(0, segments.length - 1).join('/')}`
          if (parentPath !== '/' && !visitedPaths.has(parentPath)) {
            buildHierarchy(parentPath || '/', depth + 1)
          }

          // Add current segment - check if it's terminal
          const segment = segments[segments.length - 1]
          const label = segment
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')

          // For intermediate segments (not terminal), find siblings
          let segmentSiblings: BreadcrumbSibling[] | undefined = undefined
          if (!isLast) {
            const siblingRoutes = findRoutesAtPath(currentPath)
            segmentSiblings =
              siblingRoutes.length > 0
                ? siblingRoutes.map((r) => ({
                    label: r.title,
                    href: r.path,
                    isActive: false,
                  }))
                : undefined
          }

          items.push({
            label,
            href: currentPath,
            isActive: isLast,
            siblings: segmentSiblings,
          })
        }
      }

      buildHierarchy(path)

      // If no items generated, fallback to simple path-based
      if (items.length === 0) {
        return generateBreadcrumbsFromPath(path)
      }

      // For dashboard routes, ensure Dashboard is always first and Home is never included
      if (isDashboardRoute && items.length > 0) {
        // Remove any Home breadcrumbs
        const homeIndex = items.findIndex((item) => item.href === '/' || item.label === 'Home')
        if (homeIndex !== -1) {
          items.splice(homeIndex, 1)
        }

        const dashboardRoute = findMatchingRoute('/dashboard')
        const hasDashboard = items.some((item) => item.href === '/dashboard')

        if (!hasDashboard && dashboardRoute) {
          // Insert Dashboard at the beginning
          items.unshift({
            label: dashboardRoute.title,
            href: dashboardRoute.path,
          })
        } else if (!hasDashboard) {
          // Fallback if route not found
          items.unshift({ label: 'Dashboard', href: '/dashboard' })
        }

        // Ensure Dashboard is not active unless we're on the dashboard page
        const dashboardItem = items.find((item) => item.href === '/dashboard')
        if (dashboardItem && path !== '/dashboard') {
          dashboardItem.isActive = false
        }
      }

      return items
    },
    [
      findMatchingRoute,
      findParentRoute,
      getSiblingRoutes,
      generateBreadcrumbsFromPath,
      findRoutesAtPath,
    ]
  )

  // Generate breadcrumbs based on options
  const autoGeneratedBreadcrumbs = useMemo(() => {
    if (!autoGenerate) {
      return []
    }
    // Use route-based generation, fallback to path-based
    return generateBreadcrumbsFromRoute(pathname)
  }, [autoGenerate, pathname, generateBreadcrumbsFromRoute])

  // Determine which breadcrumbs to use
  const breadcrumbs = useMemo(() => {
    // Priority: manualItems > customItems > auto-generated
    if (manualItems !== null) {
      return manualItems
    }
    if (customItems) {
      return customItems
    }
    if (autoGenerate) {
      return autoGeneratedBreadcrumbs
    }
    return []
  }, [manualItems, customItems, autoGenerate, autoGeneratedBreadcrumbs])

  // Update a specific breadcrumb item
  const updateBreadcrumb = useCallback(
    (index: number, updates: Partial<BreadcrumbItem>) => {
      setManualItems((prev) => {
        const baseItems = prev ?? customItems ?? autoGeneratedBreadcrumbs
        const newItems = [...baseItems]
        newItems[index] = { ...newItems[index], ...updates }
        return newItems
      })
    },
    [customItems, autoGeneratedBreadcrumbs]
  )

  // Reset to auto-generated state
  const resetBreadcrumbs = useCallback(() => {
    setManualItems(null)
  }, [])

  return {
    breadcrumbs,
    updateBreadcrumb,
    resetBreadcrumbs,
  }
}
