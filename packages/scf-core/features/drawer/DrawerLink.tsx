import { useTranslation } from '@scf/core/utils/useTranslation'
import { ChevronRight } from 'lucide-react-native'
import { Link } from 'expo-router'
import { Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native'
import { Text, useThemeContext } from '@scaffald/ui'
import { colors, fontSize, lineHeight, borderRadius } from '@scaffald/ui/tokens'
import type { DrawerLinkProps } from './types'
import { isActivePath } from './utils'

const ICON_SIZE = 18
const RULE_WIDTH = 2

/**
 * One section in the drawer: an icon, a label, and a 2px rule down the left
 * edge when the section owns the current route. Nothing nests under it — a
 * section's children are its tab strip, not an indented tree.
 *
 * The rule is always drawn, transparent when inactive, so the label does not
 * shift when the route changes. The row is square-cornered and runs the full
 * width of the drawer, so the rule sits flush on the panel's edge the way the
 * prototype's does.
 */
export const DrawerLink = ({ item, pathname, onNavigate, isCollapsed }: DrawerLinkProps) => {
  const collapsed = isCollapsed ?? false
  const active = isActivePath(pathname, item.href, item.exact)
  const Icon = item.icon
  const { t } = useTranslation()
  const { theme } = useThemeContext()
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'
  const title = item.titleKey ? t(item.titleKey) : (item.title ?? item.key)

  const activeFg = resolvedTheme === 'dark' ? colors.primary[300] : colors.primary[600]
  const restFg = colors.text[resolvedTheme].primary
  const restIcon = colors.icon[resolvedTheme].default

  if (item.disabled) {
    return (
      <View
        style={[styles.row, collapsed && styles.rowCollapsed, styles.rowDisabled]}
        accessibilityState={{ disabled: true }}
      >
        <View style={styles.rule} />
        {Icon ? <Icon size={ICON_SIZE} color={colors.icon[resolvedTheme].muted} /> : null}
        {!collapsed ? (
          <Text
            style={StyleSheet.flatten([
              styles.label,
              { color: colors.text[resolvedTheme].tertiary },
            ])}
          >
            {title}
          </Text>
        ) : null}
      </View>
    )
  }

  return (
    <Link href={item.href} asChild>
      <Pressable
        accessibilityLabel={title}
        accessibilityState={{ selected: active }}
        aria-current={active ? 'page' : undefined}
        onPress={(event: GestureResponderEvent) => onNavigate?.(item.href, event)}
      >
        {({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => {
          const lit = active || hovered
          return (
            <View
              style={[
                styles.row,
                collapsed && styles.rowCollapsed,
                (hovered || pressed) && { backgroundColor: colors.bg[resolvedTheme].subtle },
              ]}
            >
              <View style={[styles.rule, { backgroundColor: active ? activeFg : 'transparent' }]} />
              {Icon ? <Icon size={ICON_SIZE} color={lit ? activeFg : restIcon} /> : null}
              {!collapsed ? (
                <Text
                  numberOfLines={1}
                  style={StyleSheet.flatten([
                    styles.label,
                    { color: lit ? activeFg : restFg, fontWeight: active ? '600' : '500' },
                  ])}
                >
                  {title}
                </Text>
              ) : null}
              {!collapsed && item.badge ? (
                <View style={[styles.badge, { backgroundColor: colors.primary[500] }]}>
                  <Text style={StyleSheet.flatten([styles.badgeText, { color: colors.white }])}>
                    {item.badge}
                  </Text>
                </View>
              ) : null}
              {!collapsed && item.hasChevron ? (
                <ChevronRight
                  size={ICON_SIZE}
                  color={active ? activeFg : colors.icon[resolvedTheme].subtle}
                />
              ) : null}
            </View>
          )
        }}
      </Pressable>
    </Link>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 11,
    paddingLeft: 24,
    paddingRight: 20,
    width: '100%',
    position: 'relative',
  },
  rowCollapsed: {
    justifyContent: 'center',
    gap: 0,
    paddingVertical: 13,
    paddingLeft: 0,
    paddingRight: 0,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rule: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: RULE_WIDTH,
  },
  label: {
    flex: 1,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
  },
  badge: {
    minWidth: 20,
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.max,
  },
  badgeText: {
    fontSize: fontSize.xxs,
    lineHeight: lineHeight.xxs,
    fontWeight: '700',
  },
})
