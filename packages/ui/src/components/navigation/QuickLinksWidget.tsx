import { useMemo } from 'react'
import { Link } from 'expo-router'
import { ChevronRight } from '@tamagui/lucide-icons'
import { Text, XStack, YStack, type GetThemeValueForKey } from 'tamagui'

import { ROUTES, matchesRoute, type RouteConfig, type RouteKey } from '@app/core/constants/routes'
import {
  MIN_QUICK_LINK_DEPTH,
  getHierarchyInfo,
  getHierarchyInfoForPath,
  getRouteKeyForPath,
  type RouteHierarchyInfo,
} from '@app/core/utils/navigation/routeHierarchy'

type RouteMap = typeof ROUTES

export interface QuickLinksWidgetProps {
  currentPath: string
  routes?: RouteMap
  maxDepth?: number
  title?: string
  emptyStateText?: string
}

type QuickLinkEntry = {
  key: RouteKey
  route: RouteConfig
  depth: number
  relativeDepth: number
  href?: string
  isActive: boolean
}

const normalizePath = (value: string) => {
  if (!value) return '/'
  if (value === '/') return value
  return value.replace(/\/+$/, '')
}

const splitSegments = (path: string) => normalizePath(path).split('/').filter(Boolean)

const resolveHref = (
  route: RouteConfig,
  currentSegments: string[],
  normalizedCurrentPath: string
): string | undefined => {
  if (!route.path.includes(':')) {
    return route.path
  }

  const routeSegments = splitSegments(route.path)
  const builtSegments: string[] = []

  for (let index = 0; index < routeSegments.length; index += 1) {
    const segment = routeSegments[index]

    if (segment.startsWith(':')) {
      const value = currentSegments[index]

      if (!value) {
        return matchesRoute(normalizedCurrentPath, route) ? normalizedCurrentPath : undefined
      }

      builtSegments.push(value)
    } else {
      builtSegments.push(segment)
    }
  }

  const candidate = `/${builtSegments.join('/')}`

  return candidate.replace(/\/+$/, '') || '/'
}

const getPaddingToken = (relativeDepth: number): GetThemeValueForKey<'paddingLeft'> => {
  if (relativeDepth <= 0) {
    return '$0'
  }

  const tokenIndex = Math.min(relativeDepth + 1, 6)
  return `$${tokenIndex}` as GetThemeValueForKey<'paddingLeft'>
}

export const QuickLinksWidget = ({
  currentPath,
  routes = ROUTES,
  maxDepth,
  title = 'Quick Links',
  emptyStateText = 'No quick links available.',
}: QuickLinksWidgetProps) => {
  const quickLinks = useMemo<QuickLinkEntry[]>(() => {
    const normalizedCurrentPath = normalizePath(currentPath)
    const currentSegments = splitSegments(normalizedCurrentPath)

    const currentInfo = getHierarchyInfoForPath(normalizedCurrentPath)
    if (!currentInfo) return []

    const routeMap = routes

    const entries: QuickLinkEntry[] = []

    const traverse = (
      node: RouteHierarchyInfo['node'],
      absoluteDepth: number,
      anchorDepth: number,
      depthLimit: number
    ) => {
      if (absoluteDepth > depthLimit) {
        return
      }

      const route = routeMap[node.key as RouteKey]
      if (!route) return

      const href = resolveHref(route, currentSegments, normalizedCurrentPath)
      const isActive = matchesRoute(normalizedCurrentPath, route)

      if (!href && !isActive) {
        return
      }

      entries.push({
        key: node.key as RouteKey,
        route,
        depth: absoluteDepth,
        relativeDepth: absoluteDepth - anchorDepth,
        href: href ?? normalizedCurrentPath,
        isActive,
      })

      if (!node.children?.length) {
        return
      }

      if (absoluteDepth === depthLimit) {
        return
      }

      for (const child of node.children) {
        traverse(child, absoluteDepth + 1, anchorDepth, depthLimit)
      }
    }

    if (currentInfo.depth < MIN_QUICK_LINK_DEPTH) {
      const baseDepth = currentInfo.depth
      const defaultLimit = baseDepth + 1
      const depthLimit = Math.max(maxDepth ?? defaultLimit, defaultLimit)

      if (!currentInfo.node.children?.length) {
        return []
      }

      for (const child of currentInfo.node.children) {
        traverse(child, baseDepth + 1, baseDepth, depthLimit)
      }

      return entries
    }

    let anchorKey: RouteKey | undefined = currentInfo.key as RouteKey

    if (!currentInfo.node.children?.length && currentInfo.depth > 1) {
      const targetDepth = Math.max(MIN_QUICK_LINK_DEPTH, currentInfo.depth - 1)

      anchorKey = (currentInfo.ancestors[targetDepth - 1] as RouteKey | undefined) ?? anchorKey
    }

    const anchorInfo = anchorKey ? getHierarchyInfo(anchorKey) : undefined

    if (!anchorInfo) return []

    const requiredDepth = currentInfo.node.children?.length
      ? currentInfo.depth + 1
      : currentInfo.depth
    const defaultLimit = Math.max(anchorInfo.depth + 1, requiredDepth)
    const depthLimit = Math.max(maxDepth ?? defaultLimit, anchorInfo.depth)

    traverse(anchorInfo.node, anchorInfo.depth, anchorInfo.depth, depthLimit)

    return entries
  }, [currentPath, maxDepth, routes])

  if (!quickLinks.length) {
    return (
      <YStack
        data-testid="quick-links-widget"
        bg="$background"
        borderColor="$borderColor"
        borderWidth={1}
        rounded="$4"
        p="$4"
        gap="$3"
      >
        <Text fontSize="$5" fontWeight="700">
          {title}
        </Text>
        <Text color="$color11" opacity={0.6}>
          {emptyStateText}
        </Text>
      </YStack>
    )
  }

  return (
    <YStack
      data-testid="quick-links-widget"
      bg="$background"
      borderColor="$borderColor"
      borderWidth={1}
      rounded="$4"
      p="$4"
      gap="$3"
    >
      <Text fontSize="$5" fontWeight="700">
        {title}
      </Text>

      <YStack gap="$2">
        {quickLinks.map((entry) => {
          const paddingToken = getPaddingToken(entry.relativeDepth)
          const itemContent = (
            <XStack
              key={entry.key}
              data-route-key={entry.key}
              data-active={entry.isActive ? 'true' : 'false'}
              bg={entry.isActive ? '$color3' : 'transparent'}
              borderColor={entry.isActive ? '$color6' : 'transparent'}
              borderWidth={entry.isActive ? 1 : 0}
              rounded="$3"
              py="$2"
              px="$3"
              gap="$3"
              items="center"
              hoverStyle={{
                bg: entry.isActive ? '$color3' : '$color2',
              }}
              pressStyle={{
                bg: entry.isActive ? '$color3' : '$color3',
              }}
              cursor={entry.href ? 'pointer' : 'default'}
            >
              <XStack flex={1} gap="$2" items="center" pl={paddingToken}>
                <Text
                  color={entry.isActive ? '$color11' : '$color10'}
                  fontWeight={entry.isActive ? '700' : '500'}
                >
                  {entry.route.title}
                </Text>
              </XStack>
              <ChevronRight size={16} color={entry.isActive ? 'var(--color11)' : 'var(--color9)'} />
            </XStack>
          )

          if (!entry.href) {
            return (
              <YStack key={entry.key} opacity={entry.isActive ? 1 : 0.6}>
                {itemContent}
              </YStack>
            )
          }

          return (
            <Link key={entry.key} href={entry.href} asChild>
              {itemContent}
            </Link>
          )
        })}
      </YStack>
    </YStack>
  )
}
