import { useMemo, useState } from 'react'
import { Popover, YStack, ScrollView, Separator, Text, useWindowDimensions } from 'tamagui'
import { ROUTES } from '@app/core/constants/routes'
import { OfficeFlyoutMenuItem } from './OfficeFlyoutMenuItem'
import type { RouteConfig } from '@app/core/constants/routes'

export interface OfficeFlyoutMenuProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  pathname: string
  onNavigate: () => void
  triggerRef: React.RefObject<HTMLElement | null>
}

type OrganizedRoutes = {
  content: (RouteConfig & { key: string; children?: RouteConfig[] })[]
  recruitment: (RouteConfig & { key: string; children?: RouteConfig[] })[]
  management: (RouteConfig & { key: string; children?: RouteConfig[] })[]
  system: (RouteConfig & { key: string; children?: RouteConfig[] })[]
}

const useOrganizedRoutes = (): OrganizedRoutes => {
  return useMemo(() => {
    // Filter Office routes with menu metadata
    const officeRoutes = Object.entries(ROUTES)
      .filter(([key, route]) => key.startsWith('OFFICE_') && route.menuCategory)
      .map(([key, route]) => ({ ...route, key })) as (RouteConfig & { key: string })[]

    // Also include STYLEGUIDE if it has menuCategory
    const styleguideRoute = ROUTES.STYLEGUIDE
    if (styleguideRoute.menuCategory) {
      officeRoutes.push({ ...styleguideRoute, key: 'STYLEGUIDE' })
    }

    // Group by category
    const categories = {
      content: officeRoutes.filter((r) => r.menuCategory === 'content'),
      recruitment: officeRoutes.filter((r) => r.menuCategory === 'recruitment'),
      management: officeRoutes.filter((r) => r.menuCategory === 'management'),
      system: officeRoutes.filter((r) => r.menuCategory === 'system'),
    }

    // Sort by menuOrder within each category
    for (const cat of Object.keys(categories)) {
      categories[cat as keyof typeof categories].sort(
        (a, b) => (a.menuOrder || 0) - (b.menuOrder || 0),
      )
    }

    // Build hierarchical structure using menuParent
    const buildHierarchy = (
      routes: (RouteConfig & { key: string })[],
    ): (RouteConfig & { key: string; children?: RouteConfig[] })[] => {
      const topLevel = routes.filter((r) => !r.menuParent)
      const children = routes.filter((r) => r.menuParent)

      return topLevel.map((route) => {
        const routeChildren = children
          .filter((c) => c.menuParent === route.key)
          .sort((a, b) => (a.menuOrder || 0) - (b.menuOrder || 0))

        // Recursively build nested children (for 4+ levels)
        const nestedChildren =
          routeChildren.length > 0 ? buildHierarchy(routeChildren) : undefined

        return {
          ...route,
          children: nestedChildren,
        }
      })
    }

    return {
      content: buildHierarchy(categories.content),
      recruitment: buildHierarchy(categories.recruitment),
      management: buildHierarchy(categories.management),
      system: buildHierarchy(categories.system),
    }
  }, [])
}

export const OfficeFlyoutMenu = ({
  isOpen,
  onOpenChange,
  pathname,
  onNavigate,
  triggerRef: _triggerRef,
}: OfficeFlyoutMenuProps) => {
  const { width } = useWindowDimensions()
  const routes = useOrganizedRoutes()
  const [showTopShadow, setShowTopShadow] = useState(false)
  const [showBottomShadow, setShowBottomShadow] = useState(true)

  // Calculate responsive width
  const menuWidth = width < 768 ? Math.min(width - 32, 400) : 360

  const categoryLabels: Record<keyof OrganizedRoutes, string> = {
    content: 'Content Management',
    recruitment: 'Recruitment',
    management: 'Management',
    system: 'System',
  }

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget
    setShowTopShadow(scrollTop > 0)
    setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 5)
  }

  return (
    <Popover placement="bottom-end" open={isOpen} onOpenChange={onOpenChange}>
      <Popover.Content
        role="menu"
        aria-label="Office navigation menu"
        rounded="$4"
        p={0}
        maxH="calc(100vh - 80px)"
        elevate
        borderWidth={1}
        borderColor="$borderColor"
        bg="$color2"
        animation="quick"
        enterStyle={{ opacity: 0, scale: 0.95, y: -10 }}
        exitStyle={{ opacity: 0, scale: 0.95, y: -10 }}
        style={{ width: menuWidth, minWidth: 280, maxWidth: 400 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={{ maxHeight: 'calc(100vh - 80px)' }}
        >
          <YStack py="$2" position="relative">
            {/* Top shadow overlay */}
            {showTopShadow && (
              <YStack
                position="absolute"
                top={0}
                left={0}
                right={0}
                height={20}
                bg="linear-gradient(to bottom, $color2, transparent)"
                pointerEvents="none"
                zIndex={1}
              />
            )}

            {Object.entries(routes).map(([category, items], idx) => {
              if (items.length === 0) return null

              return (
                <YStack key={category}>
                  {idx > 0 && <Separator my="$2" />}

                  {/* Category Header */}
                  <Text
                    px="$3"
                    py="$2"
                    fontSize="$2"
                    fontWeight="600"
                    color="$color10"
                    textTransform="uppercase"
                    letterSpacing={0.5}
                  >
                    {categoryLabels[category as keyof OrganizedRoutes]}
                  </Text>

                  {/* Category Items */}
                  <YStack>
                    {items.map((route) => (
                      // biome-ignore lint/correctness/noChildrenProp: children here is route config data, not React children
                      <OfficeFlyoutMenuItem
                        key={route.key}
                        route={route}
                        pathname={pathname}
                        onNavigate={onNavigate}
                        children={route.children}
                      />
                    ))}
                  </YStack>
                </YStack>
              )
            })}

            {/* Bottom shadow overlay */}
            {showBottomShadow && (
              <YStack
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                height={20}
                bg="linear-gradient(to top, $color2, transparent)"
                pointerEvents="none"
                zIndex={1}
              />
            )}
          </YStack>
        </ScrollView>
      </Popover.Content>
    </Popover>
  )
}

