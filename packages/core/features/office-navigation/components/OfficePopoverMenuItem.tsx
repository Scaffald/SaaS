import type { RouteConfig } from '@app/core/constants/routes'
import { isActivePath } from '@app/core/features/drawer/utils'
import { ChevronRight } from '@tamagui/lucide-icons'
import { Link } from 'expo-router'
import { type ComponentType, useCallback } from 'react'
import { Paragraph, XStack, YStack } from 'tamagui'

export interface OfficePopoverMenuItemProps {
  route: RouteConfig & { key: string }
  pathname: string
  depth?: number
  onNavigate?: () => void
  childRoutes?: RouteConfig[]
}

export const OfficePopoverMenuItem = ({
  route,
  pathname,
  depth = 0,
  onNavigate,
  childRoutes,
}: OfficePopoverMenuItemProps) => {
  const active = isActivePath(pathname, route.path)
  const Icon = route.menuIcon
  const hasChildren = Boolean(childRoutes?.length)

  // Calculate indent based on depth (max $8 after 2 levels)
  const indent = depth === 0 ? '$3' : depth === 1 ? '$6' : '$8'

  const renderIcon = useCallback(() => {
    if (!Icon) return null

    // Type assertion for lucide-icons components which accept size and color props
    const IconComponent = Icon as ComponentType<{ size?: number; color?: string }>

    return (
      <XStack items="center" justify="center" width={20} height={20}>
        <IconComponent size={16} color={active ? '$color1' : '$color11'} />
      </XStack>
    )
  }, [Icon, active])

  const handleClick = useCallback(() => {
    onNavigate?.()
  }, [onNavigate])

  return (
    <YStack>
      <Link href={route.path} asChild>
        <XStack
          items="center"
          justify="space-between"
          px={indent}
          py="$2.5"
          gap="$3"
          bg={active ? '$color9' : 'transparent'}
          hoverStyle={{ bg: active ? '$color9' : '$color3' }}
          pressStyle={{ bg: active ? '$color9' : '$color4' }}
          cursor="pointer"
          onPress={handleClick}
          role="menuitem"
          aria-current={active ? 'page' : undefined}
          animation="quick"
          enterStyle={{ opacity: 0, x: -10 }}
          exitStyle={{ opacity: 0, x: -10 }}
        >
          <XStack items="center" gap="$2" flex={1}>
            {depth === 0 && renderIcon()}
            {depth > 2 && (
              <XStack style={{ width: 2, height: '100%', marginRight: 8 }} bg="$color6" />
            )}
            <Paragraph
              size={depth === 0 ? '$4' : '$3'}
              fontWeight={active ? '700' : '500'}
              color={active ? '$color1' : '$color12'}
              numberOfLines={1}
            >
              {route.title}
            </Paragraph>
          </XStack>
          {hasChildren && <ChevronRight size={14} color={active ? '$color1' : '$color10'} />}
        </XStack>
      </Link>

      {/* Render nested children */}
      {hasChildren && childRoutes && (
        <YStack>
          {childRoutes.map((child, index) => (
            <OfficePopoverMenuItem
              key={(child as RouteConfig & { key?: string }).key || child.path || `child-${index}`}
              route={child as RouteConfig & { key: string }}
              pathname={pathname}
              depth={depth + 1}
              onNavigate={onNavigate}
              childRoutes={undefined}
            />
          ))}
        </YStack>
      )}
    </YStack>
  )
}

