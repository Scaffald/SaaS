import { useTranslation } from '@scf/core/utils/useTranslation'
import { Check, ChevronRight, Clock } from 'lucide-react-native'
import { Link } from 'expo-router'
import { useCallback, useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { Paragraph, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { DrawerLinkProps } from './types'
import { isActivePath } from './utils'

/**
 * Shared item style for all non-collapsed drawer links.
 * We apply these on a View wrapper INSIDE Pressable because
 * expo-router's `Link asChild` does not forward Pressable's
 * dynamic style function to the rendered `<a>` on web.
 */
const itemStyle = (
  active: boolean,
  _pressed: boolean,
  resolvedTheme: 'light' | 'dark',
  _activeBg: string,
  borderRadius = 12,
) => ({
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius,
  width: '100%' as const,
  alignSelf: 'stretch' as const,
  backgroundColor: active
    ? resolvedTheme === 'dark'
      ? 'rgba(80,73,64,0.6)'
      : 'rgba(200,195,188,0.6)'
    : 'transparent',
})

export const DrawerLink = ({
  item,
  pathname,
  depth = 0,
  onNavigate,
  expandedItems,
  onToggleExpanded,
  isCollapsed,
  isLastSubItem = false,
}: DrawerLinkProps) => {
  const collapsed = isCollapsed ?? false
  const active = isActivePath(pathname, item.href, item.exact)
  const Icon = item.icon
  const hasSubItems = Boolean(item.subItems?.length)
  // Show sub-items when they exist; gate behind route match when expandOnActive is set
  const isRouteActive = isActivePath(pathname, item.href)
  const shouldShowSubItems = hasSubItems && (!item.expandOnActive || isRouteActive)
  const isManualExpandable = item.isExpandable && !item.expandOnActive
  const isAutoExpandable = item.isExpandable && item.expandOnActive
  const { t } = useTranslation()
  const { theme } = useThemeContext()
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'

  const resolveTitle = useCallback(() => {
    if (item.titleKey) {
      return t(item.titleKey)
    }

    return item.title ?? item.key
  }, [item.key, item.title, item.titleKey, t])

  const title = useMemo(() => resolveTitle(), [resolveTitle])

  // Primary text/icon for active and hover; no background on parent items
  const activeFg = resolvedTheme === 'dark' ? colors.primary[300] : colors.primary[600]
  const activeBg = colors.bg[resolvedTheme].selected

  const renderIcon = useCallback((hovered = false) => {
    if (!Icon) return null
    const isHighlighted = active || hovered
    return (
      <Icon
        size={22}
        color={isHighlighted ? activeFg : colors.icon[resolvedTheme].default}
      />
    )
  }, [Icon, active, resolvedTheme, activeFg])

  const renderContent = useCallback((hovered = false) => {
    const isHighlighted = active || hovered

    const iconWrapper = (
      <Row
        align="center"
        justify="center"
        width={collapsed ? 48 : 24}
        height={collapsed ? 48 : 24}
        borderRadius={collapsed ? 32 : 0}
        style={{
          backgroundColor: collapsed && !active ? colors.bg[resolvedTheme].subtle : 'transparent',
        }}
      >
        {renderIcon(hovered)}
      </Row>
    )

    if (collapsed) {
      return iconWrapper
    }

    return (
      <Row align="center" gap={14} flex={1}>
        {iconWrapper}
        <Paragraph
          size="md"
          style={{
            color: isHighlighted ? activeFg : colors.text[resolvedTheme].primary,
            fontWeight: active ? '700' : '400',
            flex: 1,
          }}
        >
          {title}
        </Paragraph>
      </Row>
    )
  }, [active, collapsed, renderIcon, resolvedTheme, title, activeFg])

  const renderRightSide = useCallback(() => {
    if (collapsed) {
      return null
    }

    return (
      <Row align="center" gap={8}>
        {item.badge && (
          <Row
            paddingHorizontal={8}
            paddingVertical={2}
            borderRadius={999}
            style={{ backgroundColor: colors.primary[500] }}
            minWidth={20}
            align="center"
          >
            <Paragraph
              size="sm"
              style={{ color: colors.white, fontWeight: '700', fontSize: 10 }}
            >
              {item.badge}
            </Paragraph>
          </Row>
        )}
        {!item.isExpandable && item.hasChevron && (
          <ChevronRight size={18} color={active ? activeFg : colors.icon[resolvedTheme].subtle} />
        )}
      </Row>
    )
  }, [active, collapsed, item.badge, item.hasChevron, item.isExpandable, resolvedTheme, activeFg])

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
        <Pressable accessibilityLabel={title}>
          {({ pressed }) => (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 32,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? colors.bg[resolvedTheme].muted : 'transparent',
              }}
            >
              {renderIcon()}
            </View>
          )}
        </Pressable>
      </Link>
    )
  }

  // Depth > 0 and has subItems: render as expandable with indent so third-level (Teams, Logs) can nest
  if (depth > 0 && hasSubItems && (isAutoExpandable || isManualExpandable)) {
    const baseLeft = 54 + (depth - 1) * 20
    return (
      <Stack>
        <Link href={item.href} asChild>
          <Pressable accessibilityLabel={title}>
            {({ hovered }: { pressed: boolean; hovered?: boolean }) => {
              const isHighlighted = active || hovered
              return (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    columnGap: 8,
                    paddingVertical: 8,
                    paddingLeft: baseLeft,
                    paddingRight: 12,
                    position: 'relative',
                  }}
                >
                  <Paragraph
                    size="sm"
                    style={{
                      color: isHighlighted ? activeFg : colors.text[resolvedTheme].secondary,
                      fontWeight: active ? '700' : '400',
                      flex: 1,
                    }}
                  >
                    {title}
                  </Paragraph>
                </View>
              )
            }}
          </Pressable>
        </Link>
        {shouldShowSubItems && item.subItems && (
          <Stack marginTop={0}>
            {item.subItems.map((subItem, index) => (
              <DrawerLink
                key={subItem.key}
                item={subItem}
                pathname={pathname}
                depth={(depth ?? 0) + 1}
                onNavigate={onNavigate}
                expandedItems={expandedItems}
                onToggleExpanded={onToggleExpanded}
                isCollapsed={collapsed}
                isLastSubItem={index === (item.subItems?.length ?? 0) - 1}
              />
            ))}
          </Stack>
        )}
      </Stack>
    )
  }

  if (depth > 0) {
    return (
      <Link href={item.href} asChild>
        <Pressable accessibilityLabel={title}>
          {({ hovered }: { pressed: boolean; hovered?: boolean }) => {
            const isHighlighted = active || hovered
            const leftPad = 54 + (Math.max(0, depth - 1)) * 20
            return (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  columnGap: 8,
                  paddingVertical: 8,
                  paddingLeft: leftPad,
                  paddingRight: 12,
                  position: 'relative',
                }}
              >
                {/* Tree vertical line — full height for continuity, half for last item */}
                <View
                  style={{
                    position: 'absolute',
                    left: leftPad - 18,
                    top: 0,
                    bottom: isLastSubItem ? '50%' : 0,
                    width: 1,
                    backgroundColor: colors.border[resolvedTheme].muted,
                  }}
                />
                {/* Tree horizontal branch */}
                <View
                  style={{
                    position: 'absolute',
                    left: leftPad - 18,
                    top: '50%',
                    width: 10,
                    height: 1,
                    backgroundColor: colors.border[resolvedTheme].muted,
                  }}
                />
                <Paragraph
                  size="sm"
                  style={{
                    color: isHighlighted ? activeFg : colors.text[resolvedTheme].secondary,
                    fontWeight: active ? '700' : '400',
                    flex: 1,
                  }}
                >
                  {title}
                </Paragraph>
                {item.isOnCooldown ? (
                  <Clock size={16} color={active ? activeFg : colors.info[600]} />
                ) : item.isCompleted ? (
                  <Check size={16} color={active ? activeFg : colors.success[600]} />
                ) : null}
              </View>
            )
          }}
        </Pressable>
      </Link>
    )
  }

  // Helper to render a standard expandable item with sub-items
  const renderExpandableItem = () => (
    <Stack>
      <Link href={item.href} asChild>
        <Pressable accessibilityLabel={title}>
          {({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => (
            <View style={itemStyle(active, pressed, resolvedTheme, activeBg, 16)}>
              {renderContent(hovered)}
              {renderRightSide()}
            </View>
          )}
        </Pressable>
      </Link>
      {shouldShowSubItems && item.subItems && (
        <Stack marginTop={0}>
          {item.subItems.map((subItem, index) => (
            <DrawerLink
              key={subItem.key}
              item={subItem}
              pathname={pathname}
              depth={1}
              onNavigate={onNavigate}
              expandedItems={expandedItems}
              onToggleExpanded={onToggleExpanded}
              isCollapsed={collapsed}
              isLastSubItem={index === (item.subItems?.length ?? 0) - 1}
            />
          ))}
        </Stack>
      )}
    </Stack>
  )

  if (isManualExpandable) {
    return renderExpandableItem()
  }

  if (isAutoExpandable) {
    return renderExpandableItem()
  }

  if (item.subItems && item.subItems.length > 0) {
    return renderExpandableItem()
  }

  // Default: simple nav link
  return (
    <Link href={item.href} asChild>
      <Pressable accessibilityLabel={title}>
        {({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => (
          <View style={itemStyle(active, pressed, resolvedTheme, activeBg)}>
            {renderContent(hovered)}
            {renderRightSide()}
          </View>
        )}
      </Pressable>
    </Link>
  )
}
