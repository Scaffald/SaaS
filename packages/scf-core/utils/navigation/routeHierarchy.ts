import type { RouteConfig, RouteKey } from '@scf/core/constants/routes'
import { flattenRoutes, matchesRoute, ROUTES } from '@scf/core/constants/routes'

type RouteMap = typeof ROUTES

type RouteHierarchyNode = {
  key: RouteKey
  path: string
  children?: RouteHierarchyNode[]
}

type TraversalResult = {
  key: RouteKey
  path: string
  depth: number
  ancestors: string[]
  node: RouteHierarchyNode
}

export type RouteHierarchyInfo = TraversalResult

export const MIN_QUICK_LINK_DEPTH = 3

// Get all routes as flat array for iteration
const getAllRoutes = (): RouteConfig[] => flattenRoutes()

const normalizePath = (path: string) => {
  if (!path) return '/'
  if (path === '/') return path
  return path.endsWith('/') ? path.slice(0, -1) : path
}

export const getRouteKeyForPath = (path: string): RouteKey | undefined => {
  const normalizedPath = normalizePath(path)
  const allRoutes = getAllRoutes()

  // Try exact match first
  const exactMatch = allRoutes.find((route) => normalizePath(route.path) === normalizedPath)
  if (exactMatch) {
    // Find the key by searching the nested structure
    return findRouteKeyInNested(ROUTES, exactMatch.path) || undefined
  }

  // Try dynamic route match
  const dynamicMatch = allRoutes.find((route) => matchesRoute(normalizedPath, route))
  if (dynamicMatch) {
    return findRouteKeyInNested(ROUTES, dynamicMatch.path) || undefined
  }

  return undefined
}

// Helper to find route key in nested structure
function findRouteKeyInNested(
  routeNode: unknown,
  targetPath: string,
  currentPath: string[] = []
): RouteKey | null {
  if (!routeNode || typeof routeNode !== 'object') {
    return null
  }

  for (const [key, value] of Object.entries(routeNode)) {
    if (value && typeof value === 'object' && 'path' in value) {
      const routeConfig = value as RouteConfig
      if (routeConfig.path === targetPath) {
        // Return the full path as key (e.g., "DASHBOARD.PROFILE.GENERAL")
        return ((currentPath.length > 0 ? `${currentPath.join('.')}.` : '') + key) as RouteKey
      }
    } else if (typeof value === 'object' && value !== null) {
      const result = findRouteKeyInNested(value, targetPath, [...currentPath, key])
      if (result) {
        return result
      }
    }
  }

  return null
}

// Build node structure from route node
function buildRouteNode(
  routeNode: unknown,
  currentKey: string,
  currentPath: string[] = []
): RouteHierarchyNode | null {
  if (!routeNode || typeof routeNode !== 'object') {
    return null
  }

  const fullKey = ((currentPath.length > 0 ? `${currentPath.join('.')}.` : '') +
    currentKey) as RouteKey
  let path = ''
  const children: RouteHierarchyNode[] = []

  for (const [key, value] of Object.entries(routeNode)) {
    if (key === 'path' && typeof value === 'string') {
      path = value
    } else if (value && typeof value === 'object' && 'path' in value) {
      // This is a route config
      const routeConfig = value as RouteConfig
      const childKey = ((currentPath.length > 0 ? `${currentPath.join('.')}.` : '') +
        key) as RouteKey
      children.push({
        key: childKey,
        path: routeConfig.path,
      })
    } else if (typeof value === 'object' && value !== null) {
      // This is a nested route group
      const childNode = buildRouteNode(value, key, [...currentPath, currentKey])
      if (childNode) {
        children.push(childNode)
      }
    }
  }

  return {
    key: fullKey,
    path: path || '',
    children: children.length > 0 ? children : undefined,
  }
}

// Find hierarchy info by traversing nested structure
function findHierarchyInfoInNested(
  routeNode: unknown,
  targetPath: string,
  ancestors: string[] = [],
  depth = 1
): TraversalResult | undefined {
  if (!routeNode || typeof routeNode !== 'object') {
    return undefined
  }

  for (const [key, value] of Object.entries(routeNode)) {
    if (value && typeof value === 'object' && 'path' in value) {
      const routeConfig = value as RouteConfig
      if (routeConfig.path === targetPath) {
        const routeKey = ((ancestors.length > 0 ? `${ancestors.join('.')}.` : '') + key) as RouteKey
        const node = buildRouteNode(value, key, ancestors)
        if (!node) return undefined

        return {
          key: routeKey,
          path: routeConfig.path,
          depth,
          ancestors,
          node,
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      // Check if this node has a path (it's a navigable parent)
      const parentPath = (value as { path?: string }).path
      const newAncestors = parentPath ? [...ancestors, key] : ancestors

      const result = findHierarchyInfoInNested(value, targetPath, newAncestors, depth + 1)
      if (result) {
        return result
      }
    }
  }

  return undefined
}

export const getHierarchyInfo = (_routeKey: RouteKey): RouteHierarchyInfo | undefined => {
  // For nested routes, we need to find by path
  // This is a simplified version - in practice, we'd need to map keys to paths
  // Try to find route by key (this is approximate for now)
  return undefined
}

export const getHierarchyInfoForPath = (path: string): RouteHierarchyInfo | undefined => {
  return findHierarchyInfoInNested(ROUTES, path)
}

const _getAncestorKeyAtDepth = (
  _info: TraversalResult,
  _targetDepth: number
): RouteKey | undefined => {
  if (_targetDepth === _info.depth) {
    return _info.key
  }

  return _info.ancestors[_targetDepth - 1] as RouteKey | undefined
}

const _isDescendantOf = (_info: TraversalResult, _ancestorKey: RouteKey): boolean => false

export const getRouteDepth = (path: string): number => {
  const hierarchyEntry = getHierarchyInfoForPath(path)
  return hierarchyEntry?.depth ?? 0
}

export const getChildRoutes = (parentPath: string, _routeMap: RouteMap = ROUTES): RouteConfig[] => {
  // Find the route node itself (not its parent) in nested structure
  const routeNode = findRouteNodeInNested(ROUTES, parentPath)
  if (!routeNode) return []

  // Get all child routes from the route node
  const children: RouteConfig[] = []
  for (const [key, value] of Object.entries(routeNode)) {
    if (
      key === 'path' ||
      key === 'title' ||
      key === 'protected' ||
      key === 'exact' ||
      key === 'icon' ||
      key === 'hidden'
    ) {
      continue
    }
    if (value && typeof value === 'object' && 'path' in value) {
      children.push(value as RouteConfig)
    }
  }

  return children
}

// Helper to find the route node itself (not its parent) by path
function findRouteNodeInNested(
  routeNode: unknown,
  targetPath: string
): Record<string, unknown> | null {
  if (!routeNode || typeof routeNode !== 'object') {
    return null
  }

  // Check if this node itself matches
  if (
    'path' in (routeNode as Record<string, unknown>) &&
    (routeNode as { path?: string }).path === targetPath
  ) {
    return routeNode as Record<string, unknown>
  }

  // Recursively search children
  for (const [, value] of Object.entries(routeNode)) {
    if (value && typeof value === 'object') {
      if ('path' in value) {
        const routeConfig = value as RouteConfig
        if (routeConfig.path === targetPath) {
          // Found the matching route, return it
          return value as Record<string, unknown>
        }
        // Even if path doesn't match, recursively search children
        // (e.g., DASHBOARD has path '/dashboard' but we're looking for '/dashboard/profile')
        const result = findRouteNodeInNested(value, targetPath)
        if (result) {
          return result
        }
      } else if (value !== null) {
        // Recursively search nested objects
        const result = findRouteNodeInNested(value, targetPath)
        if (result) {
          return result
        }
      }
    }
  }

  return null
}

export const getRoutesAtDepth = (
  basePath: string,
  depth: number,
  _routeMap: RouteMap = ROUTES
): RouteConfig[] => {
  const baseEntry = getHierarchyInfoForPath(basePath)
  if (!baseEntry) return []

  const targetDepth = baseEntry.depth + (depth - baseEntry.depth)
  const allRoutes = getAllRoutes()

  // Filter routes at target depth that are descendants of basePath
  return allRoutes.filter((route) => {
    const routeInfo = getHierarchyInfoForPath(route.path)
    if (!routeInfo) return false

    // Check if route is at target depth and is a descendant
    return routeInfo.depth === targetDepth && route.path.startsWith(basePath.split(':')[0])
  })
}

const _getAncestorPathAtDepth = (
  info: TraversalResult,
  targetDepth: number
): string | undefined => {
  if (targetDepth === info.depth) {
    return info.path
  }

  // Find ancestor path at target depth by traversing up
  if (info.ancestors.length >= targetDepth) {
    // This is a simplified version - we'd need to map ancestor keys to paths
    // For now, calculate based on path segments
    const segments = info.path.split('/').filter(Boolean)
    if (segments.length >= targetDepth) {
      return `/${segments.slice(0, targetDepth).join('/')}`
    }
  }

  return undefined
}
