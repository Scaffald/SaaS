import type { RouteConfig, RouteHierarchyNode, RouteKey } from '@app/core/constants/routes'
import { matchesRoute, ROUTE_HIERARCHY, ROUTES } from '@app/core/constants/routes'

type RouteMap = typeof ROUTES

type TraversalResult = {
  key: RouteKey
  node: RouteHierarchyNode
  depth: number
  ancestors: RouteKey[]
}

export type RouteHierarchyInfo = TraversalResult

export const MIN_QUICK_LINK_DEPTH = 3

const ROUTE_ENTRIES = Object.entries(ROUTES) as Array<[RouteKey, RouteConfig]>

const normalizePath = (path: string) => {
  if (!path) return '/'
  if (path === '/') return path
  return path.endsWith('/') ? path.slice(0, -1) : path
}

export const getRouteKeyForPath = (path: string): RouteKey | undefined => {
  const normalizedPath = normalizePath(path)

  for (const [key, route] of ROUTE_ENTRIES) {
    if (normalizePath(route.path) === normalizedPath) {
      return key
    }
  }

  for (const [key, route] of ROUTE_ENTRIES) {
    if (matchesRoute(normalizedPath, route)) {
      return key
    }
  }

  return undefined
}

const findHierarchyEntry = (
  targetKey: RouteKey,
  nodes: readonly RouteHierarchyNode[],
  ancestors: RouteKey[] = [],
  depth = 1
): TraversalResult | undefined => {
  for (const node of nodes) {
    if (node.key === targetKey) {
      return { key: targetKey, node, depth, ancestors }
    }

    if (node.children?.length) {
      const result = findHierarchyEntry(
        targetKey,
        node.children,
        [...ancestors, node.key as RouteKey],
        depth + 1
      )

      if (result) {
        return result
      }
    }
  }

  return undefined
}

export const getHierarchyInfo = (routeKey: RouteKey): RouteHierarchyInfo | undefined =>
  findHierarchyEntry(routeKey, ROUTE_HIERARCHY)

export const getHierarchyInfoForPath = (path: string): RouteHierarchyInfo | undefined => {
  const routeKey = getRouteKeyForPath(path)
  if (!routeKey) return undefined
  return getHierarchyInfo(routeKey)
}

const getAncestorKeyAtDepth = (
  info: TraversalResult,
  targetDepth: number
): RouteKey | undefined => {
  if (targetDepth === info.depth) {
    return info.key
  }

  return info.ancestors[targetDepth - 1]
}

const isDescendantOf = (info: TraversalResult, ancestorKey: RouteKey): boolean =>
  info.ancestors.includes(ancestorKey)

export const getRouteDepth = (path: string): number => {
  const routeKey = getRouteKeyForPath(path)
  if (!routeKey) return 0

  const hierarchyEntry = getHierarchyInfo(routeKey)
  return hierarchyEntry?.depth ?? 0
}

export const getChildRoutes = (parentPath: string, routeMap: RouteMap = ROUTES): RouteConfig[] => {
  const parentKey = getRouteKeyForPath(parentPath)
  if (!parentKey) return []

  const hierarchyEntry = getHierarchyInfo(parentKey)
  if (!hierarchyEntry?.node.children?.length) {
    return []
  }

  return hierarchyEntry.node.children.map((child) => routeMap[child.key]).filter(Boolean)
}

const collectNodesAtDepth = (
  node: RouteHierarchyNode,
  currentDepth: number,
  targetDepth: number,
  accumulator: RouteHierarchyNode[]
) => {
  if (currentDepth === targetDepth) {
    accumulator.push(node)
    return
  }

  if (!node.children?.length || currentDepth > targetDepth) {
    return
  }

  for (const child of node.children) {
    collectNodesAtDepth(child, currentDepth + 1, targetDepth, accumulator)
  }
}

export const getRoutesAtDepth = (
  basePath: string,
  depth: number,
  routeMap: RouteMap = ROUTES
): RouteConfig[] => {
  const baseKey = getRouteKeyForPath(basePath)
  if (!baseKey) return []

  const baseEntry = getHierarchyInfo(baseKey)
  if (!baseEntry) return []

  const nodes: RouteHierarchyNode[] = []
  const startingDepth = baseEntry.depth + 1

  if (!baseEntry.node.children?.length) {
    return []
  }

  for (const child of baseEntry.node.children) {
    collectNodesAtDepth(child, startingDepth, depth, nodes)
  }

  return nodes.map((node) => routeMap[node.key]).filter(Boolean)
}

export const shouldShowInQuickLinks = (routePath: string, currentPath: string): boolean => {
  const candidateKey = getRouteKeyForPath(routePath)
  const currentKey = getRouteKeyForPath(currentPath)

  if (!candidateKey || !currentKey) {
    return false
  }

  const candidateInfo = getHierarchyInfo(candidateKey)
  const currentInfo = getHierarchyInfo(currentKey)

  if (!candidateInfo || !currentInfo) {
    return false
  }

  if (currentInfo.depth < MIN_QUICK_LINK_DEPTH) {
    return candidateInfo.depth > currentInfo.depth && isDescendantOf(candidateInfo, currentInfo.key)
  }

  const anchorKey = getAncestorKeyAtDepth(currentInfo, MIN_QUICK_LINK_DEPTH) ?? currentInfo.key

  if (candidateInfo.key === anchorKey) {
    return true
  }

  if (candidateInfo.depth < MIN_QUICK_LINK_DEPTH) {
    return false
  }

  return isDescendantOf(candidateInfo, anchorKey)
}
