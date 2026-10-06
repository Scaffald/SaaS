import { ScaffaldLogo } from '@scf/core/assets'
import { ROUTES } from '@scf/core/constants/routes'
import { getInitials } from '@scf/core/features/discover/utils/getInitials'
import { useUserRoles } from '@scf/core/utils/auth/useUserRoles'
import { useGeneralInfoWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'
import { supabase } from '@scf/core/utils/supabase/client'
import { getAvatarUrl } from '@scf/core/utils/supabase/storage'
import { useOrganizations } from '@scf/core/utils/useOrganizations'
import { usePathname } from '@scf/core/utils/usePathname'
import { useUser } from '@scf/core/utils/useUser'
import { useRouter } from 'expo-router'
import { Bell, Check, ChevronLeft, ChevronRight, ChevronUp, LogOut } from 'lucide-react-native'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type PressableStateCallbackType,
} from 'react-native'
import { Avatar, Chip, Text, useResponsive, useThemeContext } from '@scaffald/ui'
import { borderRadius, boxShadows, colors, fontSize, lineHeight } from '@scaffald/ui/tokens'
import { AppearanceControl } from './AppearanceControl'
import { DrawerLink } from './DrawerLink'
import { getNavItems } from './config'
import { MobileDrawerSections } from './MobileDrawerSections'
import { useAccountContexts, type AccountContext } from './useAccountContexts'
import { isActivePath, normalizePath } from './utils'

export type DrawerContentProps = {
  /** Called when the drawer should close (after navigating to a link). */
  onClose?: () => void
  /** Whether the drawer is collapsed (icon-only). */
  isCollapsed?: boolean
  /** Whether collapsing is available (md and larger). */
  canCollapse?: boolean
  /** Toggle collapse handler. */
  onToggleCollapse?: () => void
  /** Unread notifications, for the footer row's count. */
  unreadCount?: number
}

const COLLAPSE_ICON = 14
const FOOTER_ICON = 16

type ResolvedTheme = 'light' | 'dark'

/**
 * The drawer's body — the permanent sidebar on desktop, the sheet behind
 * "More" on a phone.
 *
 * Desktop follows the prototype's column: logo and collapse control on top,
 * then the sections as a flat list with a rule marking the one you are in,
 * then Notifications with its count, then the account row — who you are,
 * which role you are using Scaffald as, and sign out. Nothing nests: a
 * section's children are its tab strip, drawn by `SectionTabs` across the
 * top of its screens. Role switching lives in the account row's menu so the
 * nav owns the whole column.
 *
 * The phone keeps its identity-first sheet (notifications feed, mode,
 * organisations, account), since the bottom bar carries navigation there.
 */
export const DrawerContent = ({
  onClose,
  isCollapsed = false,
  canCollapse = false,
  onToggleCollapse,
  unreadCount = 0,
}: DrawerContentProps) => {
  const { width } = useResponsive()
  const { theme } = useThemeContext()
  const resolvedTheme: ResolvedTheme = theme === 'dark' ? 'dark' : 'light'
  const pathname = normalizePath(usePathname())
  const router = useRouter()
  const { user, profile } = useUser()
  const { hasOfficeRole } = useUserRoles()
  const { data: generalInfo } = useGeneralInfoWidget(undefined, {
    staleTime: 5 * 60 * 1000,
  })
  const { data: orgMemberships } = useOrganizations()
  const isSmall = width < 1024
  const collapsed = !isSmall && isCollapsed

  const items = useMemo(
    () => getNavItems(orgMemberships ?? undefined, hasOfficeRole),
    [orgMemberships, hasOfficeRole]
  )

  const displayName =
    generalInfo?.display_name?.trim() ||
    (generalInfo?.privateData?.first_name && generalInfo?.privateData?.last_name
      ? `${generalInfo.privateData.first_name} ${generalInfo.privateData.last_name}`.trim()
      : '') ||
    user?.email ||
    'User'
  const avatarUri =
    getAvatarUrl(profile?.avatar_path) ??
    (typeof user?.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null)
  // charAt(0) showed a single "M" for "Marcus Rivera" while the header showed
  // "MR" — use the shared helper so all surfaces agree (#384).
  const initials = displayName.trim().length > 0 ? getInitials(displayName) : 'U'

  const handleNavigate = useCallback(() => {
    onClose?.()
  }, [onClose])

  const handleSettingsPress = useCallback(() => {
    router.push(ROUTES.DASHBOARD.SETTINGS.path)
    handleNavigate()
  }, [router, handleNavigate])

  const handleProfilePress = useCallback(() => {
    router.push(ROUTES.PROFILE.path)
    handleNavigate()
  }, [router, handleNavigate])

  const handleNotificationsPress = useCallback(() => {
    router.push(ROUTES.DASHBOARD.NOTIFICATIONS.path)
    handleNavigate()
  }, [router, handleNavigate])

  const handleLogoutPress = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      // Land returning users on the login screen, not the 3-slide marketing
      // carousel + cookie banner (#387).
      router.replace(ROUTES.AUTH.LOGIN.path)
    } catch (error) {
      console.error('Error signing out from drawer:', error)
    }
  }, [router])

  const hairline = colors.border[resolvedTheme].subtle

  if (isSmall) {
    return (
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          <MobileIdentityRow
            theme={resolvedTheme}
            name={displayName}
            avatarUri={avatarUri}
            initials={initials}
            onProfilePress={handleProfilePress}
          />
          <MobileDrawerSections
            organizations={orgMemberships ?? null}
            hasOfficeRole={hasOfficeRole}
            onNavigate={handleNavigate}
            onSettingsPress={handleSettingsPress}
            onLogoutPress={handleLogoutPress}
          />
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={[styles.root, { borderRightWidth: 1, borderRightColor: hairline }]}>
      <View
        style={[
          styles.header,
          collapsed && styles.headerCollapsed,
          { borderBottomColor: hairline },
        ]}
      >
        <Pressable
          onPress={() => router.push(ROUTES.DASHBOARD.path)}
          accessibilityRole="link"
          accessibilityLabel="Scaffald home"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <ScaffaldLogo
            height={collapsed ? 26 : 22}
            width={collapsed ? 26 : 132}
            showWordmark={!collapsed}
          />
        </Pressable>
        {canCollapse && onToggleCollapse ? (
          <SquareIconButton
            theme={resolvedTheme}
            label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            onPress={onToggleCollapse}
          >
            {collapsed ? (
              <ChevronRight size={COLLAPSE_ICON} color={colors.icon[resolvedTheme].default} />
            ) : (
              <ChevronLeft size={COLLAPSE_ICON} color={colors.icon[resolvedTheme].default} />
            )}
          </SquareIconButton>
        ) : null}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.navContent}
        showsVerticalScrollIndicator={false}
        accessibilityRole="menu"
      >
        {items.map((item) => (
          <DrawerLink
            key={item.key}
            item={item}
            pathname={pathname}
            onNavigate={handleNavigate}
            isCollapsed={collapsed}
          />
        ))}
      </ScrollView>

      <NotificationsRow
        theme={resolvedTheme}
        collapsed={collapsed}
        count={unreadCount}
        active={isActivePath(pathname, ROUTES.DASHBOARD.NOTIFICATIONS.path)}
        onPress={handleNotificationsPress}
      />

      <AccountRow
        theme={resolvedTheme}
        collapsed={collapsed}
        name={displayName}
        avatarUri={avatarUri}
        initials={initials}
        onExpand={onToggleCollapse}
        onSettingsPress={handleSettingsPress}
        onLogoutPress={handleLogoutPress}
      />
    </View>
  )
}

// ── Pieces ───────────────────────────────────────────────────────────────────

function SquareIconButton({
  theme,
  label,
  onPress,
  children,
}: {
  theme: ResolvedTheme
  label: string
  onPress: () => void
  children: ReactNode
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.squareButton,
        {
          borderColor: hovered || pressed ? colors.primary[500] : colors.border[theme].default,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {children}
    </Pressable>
  )
}

function CountTag({ label }: { theme: ResolvedTheme; label: string }) {
  return (
    <Chip tone="accent" size="sm">
      {label}
    </Chip>
  )
}

function NotificationsRow({
  theme,
  collapsed,
  count,
  active,
  onPress,
}: {
  theme: ResolvedTheme
  collapsed: boolean
  count: number
  active: boolean
  onPress: () => void
}) {
  const label = count > 0 ? `Notifications, ${count} unread` : 'Notifications'
  const fg = active ? colors.text[theme].emphasis : colors.text[theme].secondary
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.footerRow,
        collapsed && styles.footerRowCollapsed,
        {
          borderTopColor: colors.border[theme].subtle,
          backgroundColor: hovered || pressed ? colors.bg[theme].subtle : 'transparent',
        },
      ]}
    >
      {collapsed ? (
        count > 0 ? (
          <CountTag theme={theme} label={String(count)} />
        ) : (
          <Bell size={FOOTER_ICON} color={fg} />
        )
      ) : (
        <>
          <Text style={StyleSheet.flatten([styles.footerLabel, { color: fg }])}>Notifications</Text>
          {count > 0 ? <CountTag theme={theme} label={`${count} new`} /> : null}
        </>
      )}
    </Pressable>
  )
}

function AccountRow({
  theme,
  collapsed,
  name,
  avatarUri,
  initials,
  onExpand,
  onSettingsPress,
  onLogoutPress,
}: {
  theme: ResolvedTheme
  collapsed: boolean
  name: string
  avatarUri: string | null
  initials: string
  onExpand?: () => void
  onSettingsPress: () => void
  onLogoutPress: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { contexts, current, pick } = useAccountContexts()
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), [])

  const pickContext = useCallback(
    (row: AccountContext) => {
      closeMenu()
      pick(row)
    },
    [closeMenu, pick]
  )

  const openSettings = useCallback(() => {
    closeMenu()
    onSettingsPress()
  }, [closeMenu, onSettingsPress])

  if (collapsed) {
    return (
      <Pressable
        onPress={onExpand}
        accessibilityRole="button"
        accessibilityLabel={`Signed in as ${name}, using as ${current.label}. Expand navigation to switch.`}
        style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
          styles.footerRow,
          styles.footerRowCollapsed,
          {
            borderTopColor: colors.border[theme].subtle,
            backgroundColor: hovered || pressed ? colors.bg[theme].subtle : 'transparent',
          },
        ]}
      >
        <Avatar size={32} src={avatarUri ?? undefined} initials={initials} alt={name} />
      </Pressable>
    )
  }

  return (
    <View style={[styles.accountRow, { borderTopColor: colors.border[theme].subtle }]}>
      {menuOpen ? (
        <>
          <Pressable
            onPress={closeMenu}
            accessibilityLabel="Close role menu"
            style={styles.menuBackdrop}
          />
          <View
            style={[
              styles.menu,
              {
                backgroundColor: colors.bg[theme].default,
                borderColor: colors.border[theme].default,
                boxShadow: boxShadows.l,
              } as object,
            ]}
            accessibilityRole="menu"
          >
            <Text
              style={StyleSheet.flatten([
                styles.menuKicker,
                { color: colors.text[theme].tertiary },
              ])}
            >
              Using Scaffald as
            </Text>
            {contexts.map((row) => {
              const selected = row.mode === current.mode
              return (
                <MenuRow
                  key={row.mode}
                  theme={theme}
                  label={row.label}
                  selected={selected}
                  onPress={() => pickContext(row)}
                  trailing={
                    selected ? <Check size={COLLAPSE_ICON} color={colors.primary[700]} /> : null
                  }
                />
              )
            })}
            <View style={[styles.menuSection, { borderTopColor: colors.border[theme].subtle }]}>
              <AppearanceControl />
            </View>
            <View style={[styles.menuDivider, { borderTopColor: colors.border[theme].subtle }]}>
              <MenuRow
                theme={theme}
                label="Account & settings"
                onPress={openSettings}
                trailing={<ChevronRight size={COLLAPSE_ICON} color={colors.icon[theme].muted} />}
              />
            </View>
          </View>
        </>
      ) : null}

      <Avatar size={36} src={avatarUri ?? undefined} initials={initials} alt={name} />
      <Pressable
        onPress={toggleMenu}
        accessibilityRole="button"
        accessibilityLabel={`${name}, using as ${current.label}. Switch role`}
        accessibilityState={{ expanded: menuOpen }}
        style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
          styles.accountIdentity,
          { opacity: pressed ? 0.7 : 1 },
          hovered && { backgroundColor: colors.bg[theme].subtle },
        ]}
      >
        <View style={styles.accountText}>
          <Text
            numberOfLines={1}
            style={StyleSheet.flatten([styles.accountName, { color: colors.text[theme].primary }])}
          >
            {name}
          </Text>
          <Text
            numberOfLines={1}
            style={StyleSheet.flatten([
              styles.accountMode,
              { color: colors.text[theme].secondary },
            ])}
          >
            Using as {current.label}
          </Text>
        </View>
        <ChevronUp size={COLLAPSE_ICON} color={colors.icon[theme].muted} />
      </Pressable>
      <Pressable
        onPress={onLogoutPress}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        hitSlop={8}
        style={({ pressed }) => [styles.signOut, { opacity: pressed ? 0.6 : 1 }]}
      >
        {({ hovered }: PressableStateCallbackType & { hovered?: boolean }) => (
          <LogOut
            size={FOOTER_ICON}
            color={hovered ? colors.primary[600] : colors.icon[theme].muted}
          />
        )}
      </Pressable>
    </View>
  )
}

function MenuRow({
  theme,
  label,
  selected = false,
  onPress,
  trailing,
}: {
  theme: ResolvedTheme
  label: string
  selected?: boolean
  onPress: () => void
  trailing?: ReactNode
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.menuRow,
        (hovered || pressed) && { backgroundColor: colors.bg[theme].subtle },
      ]}
    >
      <Text
        style={StyleSheet.flatten([
          styles.menuRowText,
          {
            color: selected ? colors.primary[700] : colors.text[theme].primary,
            fontWeight: selected ? '600' : '400',
          },
        ])}
      >
        {label}
      </Text>
      {trailing}
    </Pressable>
  )
}

function MobileIdentityRow({
  theme,
  name,
  avatarUri,
  initials,
  onProfilePress,
}: {
  theme: ResolvedTheme
  name: string
  avatarUri: string | null
  initials: string
  onProfilePress: () => void
}) {
  return (
    <View style={[styles.identityRow, { borderBottomColor: colors.border[theme].subtle }]}>
      <Avatar size={40} src={avatarUri ?? undefined} initials={initials} alt={name} />
      <View style={styles.accountText}>
        <Text
          numberOfLines={1}
          style={StyleSheet.flatten([styles.accountName, { color: colors.text[theme].primary }])}
        >
          {name}
        </Text>
        <Pressable
          onPress={onProfilePress}
          accessibilityRole="link"
          accessibilityLabel="Edit profile"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, alignSelf: 'flex-start' })}
        >
          <Text
            style={StyleSheet.flatten([
              styles.accountMode,
              { color: colors.primary[600], fontWeight: '600' },
            ])}
          >
            Edit profile
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 22,
    paddingBottom: 18,
    paddingLeft: 24,
    paddingRight: 18,
    borderBottomWidth: 1,
  },
  headerCollapsed: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 20,
    paddingBottom: 14,
    paddingLeft: 0,
    paddingRight: 0,
  },
  squareButton: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.xs,
  },
  navContent: {
    paddingVertical: 12,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderTopWidth: 1,
  },
  footerRowCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  footerLabel: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
  },
  accountRow: {
    position: 'relative',
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingLeft: 20,
    paddingRight: 14,
    borderTopWidth: 1,
  },
  accountIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: borderRadius.xs,
  },
  accountText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  accountName: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: '600',
  },
  accountMode: {
    fontSize: fontSize.xxs,
    lineHeight: lineHeight.xxs,
  },
  signOut: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBackdrop: {
    position: 'absolute',
    left: -1000,
    right: -1000,
    top: -4000,
    bottom: 0,
  },
  menu: {
    position: 'absolute',
    bottom: '100%',
    left: 12,
    right: 12,
    marginBottom: 4,
    padding: 6,
    borderWidth: 1,
    borderRadius: borderRadius.l,
  },
  menuKicker: {
    fontSize: fontSize.h6,
    lineHeight: lineHeight.h6,
    fontWeight: '500',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    paddingTop: 8,
    paddingHorizontal: 10,
    paddingBottom: 6,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: borderRadius.xs,
  },
  menuRowText: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
  },
  menuSection: {
    marginTop: 6,
    paddingTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 4,
    borderTopWidth: 1,
  },
  menuDivider: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
})
