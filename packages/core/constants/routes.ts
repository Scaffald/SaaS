/**
 * Evolved Application Route Configuration
 *
 * Features:
 * - Hierarchical nested route structure matching Expo app structure
 * - Inline parameter conversion functions
 * - Convenient methods (.map(), .filter(), etc.)
 * - Type-safe route generation
 * - Centralized route management
 * - Only auth and dashboard routes (all dashboard routes are protected)
 */

// Base types for route configuration
export type RouteParams = Record<string, string | number>
export type RouteFunction = (params?: RouteParams) => string

export interface RouteConfig {
  path: string
  title?: string
  description?: string
  isAuth?: boolean
  isProtected?: boolean
  children?: Record<string, RouteConfig>
  dynamic?: boolean
  params?: string[]
}

export interface RouteNode extends RouteConfig {
  // Flattened path for easy access
  fullPath: string
  // Parent reference for navigation
  parent?: RouteNode
  // Children as an array for iteration
  childrenArray?: RouteNode[]
  // Methods for convenience
  map: <T>(fn: (route: RouteNode) => T) => T[]
  filter: (fn: (route: RouteNode) => boolean) => RouteNode[]
  find: (fn: (route: RouteNode) => boolean) => RouteNode | undefined
  findByPath: (path: string) => RouteNode | undefined
  getProtectedRoutes: () => RouteNode[]
  getAuthRoutes: () => RouteNode[]
  toPath: RouteFunction
  isActive: (currentPath: string) => boolean
  isParentOf: (path: string) => boolean
}

// Dynamic route builder
const buildDynamicRoute = (template: string, params: RouteParams = {}): string => {
  let result = template

  // Replace parameter placeholders
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, String(value))
  })

  // Remove any remaining unused parameters
  result = result.replace(/\/:[^/]+/g, '')

  // Clean up double slashes and trailing slashes
  result = result.replace(/\/+/g, '/').replace(/\/$/, '') || '/'

  return result
}

// Route node factory
const createRouteNode = (config: RouteConfig, fullPath: string, parent?: RouteNode): RouteNode => {
  const node: RouteNode = {
    ...config,
    fullPath,
    parent,
    childrenArray: [],

    // Convenience methods
    map: <T>(fn: (route: RouteNode) => T): T[] => {
      const results: T[] = [fn(node)]
      node.childrenArray?.forEach((child) => {
        results.push(...child.map(fn))
      })
      return results
    },

    filter: (fn: (route: RouteNode) => boolean): RouteNode[] => {
      const results: RouteNode[] = []
      if (fn(node)) results.push(node)
      node.childrenArray?.forEach((child) => {
        results.push(...child.filter(fn))
      })
      return results
    },

    find: (fn: (route: RouteNode) => boolean): RouteNode | undefined => {
      if (fn(node)) return node
      for (const child of node.childrenArray || []) {
        const found = child.find(fn)
        if (found) return found
      }
      return undefined
    },

    findByPath: (path: string): RouteNode | undefined => {
      return node.find((route) => route.fullPath === path)
    },

    getProtectedRoutes: (): RouteNode[] => {
      return node.filter((route) => route.isProtected === true)
    },

    getAuthRoutes: (): RouteNode[] => {
      return node.filter((route) => route.isAuth === true)
    },

    toPath: (params?: RouteParams): string => {
      return buildDynamicRoute(fullPath, params)
    },

    isActive: (currentPath: string): boolean => {
      if (currentPath === fullPath) return true
      return node.isParentOf(currentPath)
    },

    isParentOf: (path: string): boolean => {
      return path.startsWith(fullPath + '/')
    },
  }

  // Process children
  if (config.children) {
    node.childrenArray = Object.entries(config.children).map(([_key, childConfig]) => {
      const childPath = childConfig.path.startsWith('/')
        ? childConfig.path
        : `${fullPath}/${childConfig.path}`

      return createRouteNode(childConfig, childPath, node)
    })
  }

  return node
}

// Core route configuration - matches Expo app structure exactly
const routeConfig: Record<string, RouteConfig> = {
  // Root route
  home: {
    path: '/',
    title: 'Home',
  },

  // Authentication routes
  auth: {
    path: '/auth',
    title: 'Authentication',
    isAuth: true,
    children: {
      index: {
        path: '/auth',
        title: 'Sign In',
      },
      welcome: {
        path: '/auth/welcome',
        title: 'Welcome',
      },
      confirm: {
        path: '/auth/confirm',
        title: 'Confirm Account',
      },
    },
  },

  // Dashboard routes (all protected)
  dashboard: {
    path: '/dashboard',
    title: 'Dashboard',
    isProtected: true,
    children: {
      index: {
        path: '/dashboard',
        title: 'Dashboard Home',
      },

      // Dashboard Profile routes
      profile: {
        path: '/dashboard/profile',
        title: 'Profile',
        children: {
          index: {
            path: '/dashboard/profile',
            title: 'Profile',
          },
          overview: {
            path: '/dashboard/profile/overview',
            title: 'Profile Overview',
          },
          general: {
            path: '/dashboard/profile/general',
            title: 'General Settings',
          },
          skills: {
            path: '/dashboard/profile/skills',
            title: 'Skills',
          },
          preferences: {
            path: '/dashboard/profile/preferences',
            title: 'Preferences',
          },
          contact: {
            path: '/dashboard/profile/contact',
            title: 'Contact Info',
          },
          edit: {
            path: '/dashboard/profile/edit',
            title: 'Edit Profile',
          },
        },
      },

      // Dashboard Settings routes
      settings: {
        path: '/dashboard/settings',
        title: 'Settings',
        children: {
          index: {
            path: '/dashboard/settings',
            title: 'Settings',
          },
          general: {
            path: '/dashboard/settings/general',
            title: 'General Settings',
          },
          security: {
            path: '/dashboard/settings/security',
            title: 'Security Settings',
          },
          authentication: {
            path: '/dashboard/settings/authentication',
            title: 'Authentication Settings',
          },
        },
      },

      // Dashboard Workers routes
      workers: {
        path: '/dashboard/workers',
        title: 'Workers',
        children: {
          index: {
            path: '/dashboard/workers',
            title: 'Workers',
          },
        },
      },
    },
  },
}

// Create the route tree
export const ROUTES = Object.fromEntries(
  Object.entries(routeConfig).map(([key, config]) => [key, createRouteNode(config, config.path)])
) as Record<string, RouteNode>

// Convenience accessors for common routes
export const AUTH_ROUTES = {
  INDEX: ROUTES.auth.childrenArray?.find((r) => r.path === '/auth'),
  WELCOME: ROUTES.auth.childrenArray?.find((r) => r.path === '/auth/welcome'),
  CONFIRM: ROUTES.auth.childrenArray?.find((r) => r.path === '/auth/confirm'),
}

export const DASHBOARD_ROUTES = {
  INDEX: ROUTES.dashboard,
  PROFILE: ROUTES.dashboard.childrenArray?.find((r) => r.path === '/dashboard/profile'),
  SETTINGS: ROUTES.dashboard.childrenArray?.find((r) => r.path === '/dashboard/settings'),
  WORKERS: ROUTES.dashboard.childrenArray?.find((r) => r.path === '/dashboard/workers'),
}

// Route type for TypeScript safety
export type AppRoute = RouteNode

// Helper functions
export const buildRoute = (route: RouteNode | string, params?: RouteParams): string => {
  if (typeof route === 'string') {
    return buildDynamicRoute(route, params)
  }
  return route.toPath(params)
}

export const findRouteByPath = (path: string): RouteNode | undefined => {
  return Object.values(ROUTES).find((route) => route.findByPath(path))
}

export const getProtectedRoutes = (): RouteNode[] => {
  return Object.values(ROUTES).flatMap((route) => route.getProtectedRoutes())
}

export const getAuthRoutes = (): RouteNode[] => {
  return Object.values(ROUTES).flatMap((route) => route.getAuthRoutes())
}

// Navigation helpers
export const isProtectedPath = (path: string): boolean => {
  return getProtectedRoutes().some((route) => path === route.fullPath || route.isParentOf(path))
}

export const isAuthPath = (path: string): boolean => {
  return getAuthRoutes().some((route) => path === route.fullPath || route.isParentOf(path))
}

// Export the main routes object for easy access
export { ROUTES as default }
