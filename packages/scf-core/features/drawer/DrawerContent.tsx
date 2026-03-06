import { ScaffaldLogo } from '@scf/core/assets'
import { ROUTES } from '@scf/core/constants/routes'
import { useThemeSetting } from '@scf/core/provider/theme/UniversalThemeProvider'
import { useGeneralInfo } from '@scf/core/utils/profile-general-sdk-hooks'
import { usePathname } from '@scf/core/utils/usePathname'
import { supabase } from '@scf/core/utils/supabase/client'
import { getAvatarUrl } from '@scf/core/utils/supabase/storage'
import { useUserRoles } from '@scf/core/utils/auth/useUserRoles'
import { useUser } from '@scf/core/utils/useUser'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import {
  Building2,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelRightClose,
  Settings as SettingsIcon,
  Sun,
} from 'lucide-react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useCallback, useState, type ReactNode } from 'react'
import { Platform, Pressable, ScrollView, type PressableStateCallbackType } from 'react-native'
import type { GestureResponderEvent } from 'react-native'
import { Text, useWindowDimensions, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { DrawerLink } from './DrawerLink'
import { getDrawerItems } from './config'
import type { DrawerItemConfig } from './types'
import { normalizePath } from './utils'

const OFFICE_DRAWER_ITEM: DrawerItemConfig = {
  key: 'office',
  title: 'Office',
  href: ROUTES.OFFICE.path,
  icon: Building2,
}

export type DrawerContentProps = DrawerContentComponentProps & {
  /**
   * Callback when navigation occurs (for closing drawer on web)
   */
  onNavigate?: () => void
  /**
   * Whether the drawer is collapsed (icon-only)
   */
  isCollapsed?: boolean
  /**
   * Whether collapsing is available (md and larger)
   */
  canCollapse?: boolean
  /**
   * Toggle collapse handler
   */
  onToggleCollapse?: () => void
}

/**
 * DrawerContent component renders the main content area of the drawer
 * Handles state management, navigation logic, and renders the UI
 * Works for both mobile (React Navigation) and web use cases
 */
export const DrawerContent = ({
  navigation,
  onNavigate,
  isCollapsed = false,
  canCollapse = false,
  onToggleCollapse,
}: DrawerContentProps) => {
  const { width } = useWindowDimensions()
  const { theme } = useThemeContext()
  const pathname = normalizePath(usePathname())
  const router = useRouter()
  const { resolvedTheme, set: setTheme } = useThemeSetting()
  const { user, profile } = useUser()
  const { hasOfficeRole } = useUserRoles()
  const { data: generalProfile } = useGeneralInfo({
    staleTime: 5 * 60 * 1000,
  })
  const isSmall = width < 1024

  const displayName =
    generalProfile?.first_name && generalProfile?.last_name
      ? `${generalProfile.first_name} ${generalProfile.last_name}`.trim()
      : (user?.email ?? 'User')
  const avatarUri =
    getAvatarUrl(profile?.avatar_path) ??
    (typeof user?.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null)
  const fallbackInitial =
    displayName && displayName.trim().length > 0 ? displayName.trim().charAt(0).toUpperCase() : 'U'

  const handleNavigate = useCallback(
    (_href: string, _event?: GestureResponderEvent) => {
      // Close drawer on mobile, call onNavigate callback on web
      if (navigation) {
        navigation.closeDrawer()
      } else {
        onNavigate?.()
      }
    },
    [navigation, onNavigate]
  )

  const handleSettingsPress = useCallback(() => {
    router.push(ROUTES.DASHBOARD.SETTINGS.path)
    handleNavigate(ROUTES.DASHBOARD.SETTINGS.path)
  }, [router, handleNavigate])

  const handleThemeToggle = useCallback(() => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }, [resolvedTheme, setTheme])

  const profilePath = ROUTES.DASHBOARD.PROFILE.path
  const handleProfilePress = useCallback(() => {
    router.push(profilePath)
    handleNavigate(profilePath)
  }, [router, handleNavigate, profilePath])

  const handleLogoutPress = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      handleNavigate(pathname)
    } catch (error) {
      console.error('Error signing out from drawer:', error)
    }
  }, [handleNavigate, pathname])

  const drawerItems = getDrawerItems()
  const ThemeToggleIcon = resolvedTheme === 'dark' ? Sun : Moon
  const themeToggleLabel =
    resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
  const footerIconSize = 22

  const FooterActionButton = ({
    label,
    onPress,
    children,
  }: {
    label: string
    onPress: () => void
    children: ReactNode
  }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={12}
      style={({ pressed }: PressableStateCallbackType) => ({
        opacity: pressed ? 0.6 : 1,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      {children}
    </Pressable>
  )

  const glassStyle = {
    backgroundColor: theme === 'dark'
      ? 'rgba(30, 25, 20, 0.92)'
      : 'rgba(251, 248, 243, 0.88)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(14px)' } as object : {}),
  }

  return (
    <Stack
      flex={1}
      style={glassStyle}
      paddingHorizontal={isCollapsed ? 8 : 24}
      paddingVertical={20}
      align={isCollapsed ? 'center' : 'stretch'}
    >
      <Stack flex={1} gap={0} width="100%">
        {!isSmall ? (
          <Row justify="center" align="center" gap={12} paddingTop={16} paddingBottom={8} width="100%">
            <ScaffaldLogo
              height={isCollapsed ? 30 : 40}
              width={isCollapsed ? 30 : 160}
              showWordmark={!isCollapsed}
            />
          </Row>
        ) : null}

        {!isCollapsed ? (
          <DrawerProfileCard
            displayName={displayName}
            avatarUri={avatarUri}
            fallbackInitial={fallbackInitial}
            onProfilePress={handleProfilePress}
          />
        ) : null}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            gap: 6,
            paddingTop: 12,
            paddingBottom: 8,
            alignItems: isCollapsed ? 'center' : 'stretch',
          }}
          showsVerticalScrollIndicator={false}
        >
          {hasOfficeRole ? (
            <DrawerLink
              item={OFFICE_DRAWER_ITEM}
              pathname={pathname}
              onNavigate={handleNavigate}
              isCollapsed={isCollapsed}
            />
          ) : null}
          {drawerItems.map((item) => (
            <DrawerLink
              key={item.key}
              item={item}
              pathname={pathname}
              onNavigate={handleNavigate}
              isCollapsed={isCollapsed}
            />
          ))}
        </ScrollView>

        <Stack
          style={{
            paddingTop: 16,
            paddingBottom: 4,
            borderTopWidth: 1,
            borderTopColor: colors.border[theme].default,
            width: '100%',
            backgroundColor: theme === 'dark'
              ? 'rgba(30, 25, 20, 0.97)'
              : 'rgba(251, 248, 243, 0.97)',
          }}
          align={isCollapsed ? 'center' : 'stretch'}
        >
          {isCollapsed ? (
            <Stack gap={12} align="center">
              <FooterActionButton label="Settings" onPress={handleSettingsPress}>
                <SettingsIcon size={footerIconSize} color={colors.icon[theme].default} />
              </FooterActionButton>
              <FooterActionButton label={themeToggleLabel} onPress={handleThemeToggle}>
                <ThemeToggleIcon size={footerIconSize} color={colors.icon[theme].default} />
              </FooterActionButton>
              <FooterActionButton label="Sign out" onPress={handleLogoutPress}>
                <LogOut size={footerIconSize} color={colors.error[500]} />
              </FooterActionButton>
              {canCollapse && onToggleCollapse ? (
                <FooterActionButton
                  label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
                  onPress={onToggleCollapse}
                >
                  {isCollapsed ? (
                    <PanelRightClose size={footerIconSize} color={colors.icon[theme].default} />
                  ) : (
                    <PanelLeftClose size={footerIconSize} color={colors.icon[theme].default} />
                  )}
                </FooterActionButton>
              ) : null}
            </Stack>
          ) : (
            <Row
              width="100%"
              justify="space-between"
              align="center"
              gap={12}
              paddingHorizontal={12}
            >
              <FooterActionButton label="Settings" onPress={handleSettingsPress}>
                <SettingsIcon size={footerIconSize} color={colors.icon[theme].default} />
              </FooterActionButton>
              <FooterActionButton label={themeToggleLabel} onPress={handleThemeToggle}>
                <ThemeToggleIcon size={footerIconSize} color={colors.icon[theme].default} />
              </FooterActionButton>
              <FooterActionButton label="Sign out" onPress={handleLogoutPress}>
                <LogOut size={footerIconSize} color={colors.error[500]} />
              </FooterActionButton>
              {canCollapse && onToggleCollapse ? (
                <FooterActionButton
                  label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
                  onPress={onToggleCollapse}
                >
                  {isCollapsed ? (
                    <PanelRightClose size={footerIconSize} color={colors.icon[theme].default} />
                  ) : (
                    <PanelLeftClose size={footerIconSize} color={colors.icon[theme].default} />
                  )}
                </FooterActionButton>
              ) : null}
            </Row>
          )}
        </Stack>
      </Stack>
    </Stack>
  )
}

type DrawerProfileCardProps = {
  displayName: string
  avatarUri: string | null
  fallbackInitial: string
  onProfilePress: () => void
}

const DrawerProfileCard = ({
  displayName,
  avatarUri,
  fallbackInitial,
  onProfilePress,
}: DrawerProfileCardProps) => {
  const { theme } = useThemeContext()
  const [isHovered, setIsHovered] = useState(false)
  const avatarSize = 48

  return (
    <Pressable
      onPress={onProfilePress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 20,
        backgroundColor: isHovered
          ? theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.85)'
          : theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.5)',
        borderWidth: 1,
        borderColor: isHovered
          ? theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.9)'
          : theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {avatarUri ? (
        <Stack
          style={{
            width: avatarSize,
            height: avatarSize,
            overflow: 'hidden',
            backgroundColor: colors.gray[100],
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image source={{ uri: avatarUri }} contentFit="cover" style={{ width: avatarSize, height: avatarSize }} />
        </Stack>
      ) : (
        <Stack
          width={avatarSize}
          height={avatarSize}
          align="center"
          justify="center"
          style={{
            backgroundColor: colors.primary[600],
            borderRadius: 14,
          }}
        >
          <Text style={{ color: colors.white, fontWeight: '700', fontSize: 18 }}>{fallbackInitial}</Text>
        </Stack>
      )}

      <Stack flex={1} gap={2}>
        <Text
          style={{
            color: theme === 'dark' ? colors.gray[100] : colors.gray[900],
            fontWeight: '700',
            fontSize: 15,
            letterSpacing: -0.3,
          }}
        >
          {displayName}
        </Text>
        <Text
          style={{
            color: colors.primary[500],
            fontWeight: '600',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
          }}
        >
          View Profile
        </Text>
      </Stack>
    </Pressable>
  )
}
