import { useTranslation } from '@scf/core/utils/useTranslation'
import { Check, ChevronRight, Clock } from 'lucide-react-native'
import { Link } from 'expo-router'
import { useCallback, useMemo } from 'react'
import { Pressable, View } from 'react-native'
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

  // Active: teal-tinted light bg + teal text (matches bento comp)
  const activeBg = colors.bg[theme].selected
  const activeFg = theme === 'dark' ? colors.primary[300] : colors.primary[600]

  const renderIcon = useCallback(() => {
    if (!Icon) return null
    return (
      <Icon
        size={22}
        color={active ? activeFg : colors.icon[theme].default}
      />
    )
  }, [Icon, active, theme, activeFg])

  const renderContent = useCallback(() => {
    const iconWrapper = (
      <Row
        align="center"
        justify="center"
        width={collapsed ? 48 : 24}
        height={collapsed ? 48 : 24}
        borderRadius={collapsed ? 32 : 0}
        style={{
          backgroundColor: collapsed
            ? active
              ? activeBg
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
      <Row align="center" gap={14} flex={1}>
        {iconWrapper}
        <Paragraph
          size="md"
          style={{
            color: active ? activeFg : colors.text[theme].primary,
            fontWeight: active ? '600' : '400',
            flex: 1,
          }}
        >
          {title}
        </Paragraph>
      </Row>
    )
  }, [active, activeBg, collapsed, renderIcon, theme, title, activeFg])

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
          <ChevronRight size="md" color={active ? activeFg : colors.icon[theme].subtle} />
        )}
      </Row>
    )
  }, [active, collapsed, item.badge, item.hasChevron, item.isExpandable, theme, activeFg])

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
              ? activeBg
              : pressed
                ? colors.bg[theme].muted
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
            paddingHorizontal: 16,
            paddingVertical: 10,
            paddingLeft: 40,
            position: 'relative',
            backgroundColor: active ? activeBg : pressed ? colors.gray[50] : undefined,
            flex: 1,
          })}
        >
          {/* Tree vertical line */}
          <View
            style={{
              position: 'absolute',
              left: 20,
              top: 0,
              height: 20,
              width: 1,
              backgroundColor: colors.border[theme].default,
            }}
          />
          {/* Tree horizontal line */}
          <View
            style={{
              position: 'absolute',
              left: 20,
              top: 19,
              width: 12,
              height: 1,
              backgroundColor: colors.border[theme].default,
            }}
          />
          <Paragraph
            size="md"
            style={{
              color: active ? activeFg : colors.text[theme].secondary,
              fontWeight: active ? '600' : '400',
              flex: 1,
            }}
          >
            {title}
          </Paragraph>
          {item.isOnCooldown ? (
            <Clock size="md" color={active ? activeFg : colors.info[600]} />
          ) : item.isCompleted ? (
            <Check size="md" color={active ? activeFg : colors.success[600]} />
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
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 16,
              width: '100%',
              alignSelf: 'stretch',
              backgroundColor: active
                ? activeBg
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
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 16,
              width: '100%',
              alignSelf: 'stretch',
              backgroundColor: active
                ? activeBg
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
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 16,
              width: '100%',
              alignSelf: 'stretch',
              backgroundColor: active
                ? activeBg
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
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 12,
          width: '100%',
          alignSelf: 'stretch',
          backgroundColor: active
            ? activeBg
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
