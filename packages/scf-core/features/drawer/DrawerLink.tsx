import { useTranslation } from '@scf/core/utils/useTranslation'
import { Check, ChevronRight, Clock } from 'lucide-react-native'
import { Link } from 'expo-router'
import { useCallback, useMemo } from 'react'
import { Pressable } from 'react-native'
import { Paragraph, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { DrawerLinkProps } from './types'
import { isActivePath } from './utils'

export const DrawerLink = ({
  item,
  pathname,
  depth = 0,
  onNavigate,
  expandedItems,
  onToggleExpanded,
  isCollapsed,
}: DrawerLinkProps) => {
  const collapsed = isCollapsed ?? false
  const active = isActivePath(pathname, item.href)
  const Icon = item.icon
  const hasSubItems = Boolean(item.subItems?.length)
  // Always show sub-items when they exist
  const shouldShowSubItems = hasSubItems
  const isManualExpandable = item.isExpandable && !item.expandOnActive
  const isAutoExpandable = item.isExpandable && item.expandOnActive
  const { t } = useTranslation()
  const { theme } = useThemeContext()

  const resolveTitle = useCallback(() => {
    if (item.titleKey) {
      return t(item.titleKey)
    }

    return item.title ?? item.key
  }, [item.key, item.title, item.titleKey, t])

  const title = useMemo(() => resolveTitle(), [resolveTitle])

  const renderIcon = useCallback(() => {
    if (!Icon) return null
    return (
      <Icon size="lg" color={active ? colors.icon[theme].active : colors.icon[theme].default} />
    )
  }, [Icon, active, theme])

  const renderContent = useCallback(() => {
    const iconWrapper = (
      <Row
        align="center"
        justify="center"
        width={collapsed ? 48 : 32}
        height={collapsed ? 48 : 32}
        borderRadius={32}
        style={{
          backgroundColor: collapsed
            ? active
              ? colors.bg[theme].selected
              : colors.bg[theme].subtle
            : 'transparent',
        }}
      >
        {renderIcon()}
      </Row>
    )

    if (collapsed) {
      return iconWrapper
    }

    return (
      <Row align="center" gap={12}>
        {iconWrapper}
        <Paragraph
          size="md"
          style={{
            color: active ? colors.info[500] : colors.text[theme].primary,
          }}
        >
          {title}
        </Paragraph>
      </Row>
    )
  }, [active, collapsed, renderIcon, title, theme])

  const renderRightSide = useCallback(() => {
    if (collapsed) {
      return null
    }

    return (
      <Row align="center" gap={8}>
        {item.badge && (
          <Row
            paddingHorizontal={8}
            paddingVertical={4}
            borderRadius={8}
            style={{ backgroundColor: theme === "light" ? colors.error[50] : colors.error[900] }}
            minWidth={20}
            align="center"
          >
            <Paragraph
              size="sm"
              style={{
                color: active ? colors.info[500] : colors.text[theme].primary,
              }}
            >
              {item.badge}
            </Paragraph>
          </Row>
        )}
        {!item.isExpandable && item.hasChevron && (
          <ChevronRight size="md" color={colors.icon[theme].subtle} />
        )}
      </Row>
    )
  }, [active, collapsed, item.badge, item.hasChevron, item.isExpandable, theme])

  if (collapsed && depth > 0) {
    return null
  }

  if (item.disabled) {
    if (collapsed) {
      return (
        <Row
          align="center"
          justify="center"
          width={56}
          height={56}
          borderRadius={32}
          style={{ opacity: 0.4, backgroundColor: colors.gray[100] }}
        >
          {renderIcon()}
        </Row>
      )
    }

    return (
      <Row
        align="center"
        gap={12}
        paddingHorizontal={12}
        paddingVertical={8}
        style={{ opacity: 0.5, flex: 1 }}
      >
        {Icon && <Icon size={18} color={colors.gray[500]} />}
        <Paragraph size="sm" style={{ color: colors.gray[500] }}>
          {title}
        </Paragraph>
      </Row>
    )
  }

  if (collapsed && depth === 0) {
    return (
      <Link href={item.href} asChild>
        <Pressable
          style={({ pressed }) => ({
            width: 56,
            height: 56,
            borderRadius: 32,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: active
              ? colors.info[900]
              : pressed
                ? colors.info[100]
                : 'transparent',
          })}
        >
          {renderIcon()}
        </Pressable>
      </Link>
    )
  }

  if (depth > 0) {
    return (
      <Link href={item.href} asChild>
        <Pressable
          style={({ pressed }: { pressed: boolean }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 16,
            columnGap: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
            paddingLeft: 36,
            backgroundColor: pressed ? colors.gray[50] : undefined,
            flex: 1,
          })}
        >
          <Paragraph
            size="md"
            style={{ color: active ? colors.info[900] : colors.gray[900], flex: 1 }}
          >
            {title}
          </Paragraph>
          {item.isOnCooldown ? (
            <Clock size="md" color={colors.info[900]} />
          ) : item.isCompleted ? (
            <Check size="md" color={colors.success[600]} />
          ) : null}
        </Pressable>
      </Link>
    )
  }

  if (isManualExpandable) {
    return (
      <Stack flex={1}>
        <Link href={item.href} asChild>
          <Pressable
            style={({ pressed }: { pressed: boolean }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 16,
              marginVertical: 4,
              backgroundColor: active
                ? colors.info[900]
                : pressed
                  ? colors.gray[200]
                  : 'transparent',
            })}
          >
            {renderContent()}
            {renderRightSide()}
          </Pressable>
        </Link>
        {shouldShowSubItems && item.subItems && (
          <Stack borderRadius={16} marginVertical={8} gap={8} flex={1}>
            {item.subItems.map((subItem) => (
              <DrawerLink
                key={subItem.key}
                item={subItem}
                pathname={pathname}
                depth={1}
                onNavigate={onNavigate}
                expandedItems={expandedItems}
                onToggleExpanded={onToggleExpanded}
                isCollapsed={collapsed}
              />
            ))}
          </Stack>
        )}
      </Stack>
    )
  }

  if (isAutoExpandable) {
    return (
      <Stack flex={1}>
        <Link href={item.href} asChild>
          <Pressable
            style={({ pressed }: { pressed: boolean }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 16,
              marginVertical: 4,
              backgroundColor: active
                ? colors.info[900]
                : pressed
                  ? colors.gray[200]
                  : 'transparent',
            })}
          >
            {renderContent()}
            {renderRightSide()}
          </Pressable>
        </Link>
        {shouldShowSubItems && item.subItems && (
          <Stack borderRadius={16} marginVertical={8} gap={8} flex={1}>
            {item.subItems.map((subItem) => (
              <DrawerLink
                key={subItem.key}
                item={subItem}
                pathname={pathname}
                depth={1}
                onNavigate={onNavigate}
                expandedItems={expandedItems}
                onToggleExpanded={onToggleExpanded}
                isCollapsed={collapsed}
              />
            ))}
          </Stack>
        )}
      </Stack>
    )
  }

  if (item.subItems && item.subItems.length > 0) {
    return (
      <Stack flex={1}>
        <Link href={item.href} asChild>
          <Pressable
            style={({ pressed }: { pressed: boolean }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 16,
              marginVertical: 4,
              backgroundColor: active
                ? colors.info[900]
                : pressed
                  ? colors.gray[200]
                  : 'transparent',
            })}
          >
            {renderContent()}
            {renderRightSide()}
          </Pressable>
        </Link>
        <Stack borderRadius={16} marginVertical={8} gap={8} flex={1}>
          {item.subItems.map((subItem) => (
            <DrawerLink
              key={subItem.key}
              item={subItem}
              pathname={pathname}
              depth={1}
              onNavigate={onNavigate}
              expandedItems={expandedItems}
              onToggleExpanded={onToggleExpanded}
              isCollapsed={collapsed}
            />
          ))}
        </Stack>
      </Stack>
    )
  }

  return (
    <Link href={item.href} asChild>
      <Pressable
        style={({ pressed }: { pressed: boolean }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingVertical: 12,
          borderRadius: 8,
          marginVertical: 4,
          backgroundColor: active
            ? colors.info[900]
            : pressed
              ? colors.gray[200]
              : 'transparent',
        })}
      >
        {renderContent()}
        {renderRightSide()}
      </Pressable>
    </Link>
  )
}
