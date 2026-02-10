import { ScaffaldLogo } from '@scf/core/assets'
import { ROUTES } from '@scf/core/constants/routes'
import { useThemeSetting } from '@scf/core/provider/theme/UniversalThemeProvider'
import { useGeneralInfo } from '@scf/core/utils/profile-general-sdk-hooks'
import { api } from '@scf/core/utils/api'
import { usePathname } from '@scf/core/utils/usePathname'
import { supabase } from '@scf/core/utils/supabase/client'
import { getAvatarUrl } from '@scf/core/utils/supabase/storage'
import { useUserRoles } from '@scf/core/utils/auth/useUserRoles'
import { useUser } from '@scf/core/utils/useUser'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import {
  Building2,
  Moon,
  PanelLeftClose,
  PanelRightClose,
  Settings as SettingsIcon,
  Sun,
} from 'lucide-react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useCallback, type ReactNode } from 'react'
import { Pressable, type PressableStateCallbackType } from 'react-native'
import type { GestureResponderEvent } from 'react-native'
import { Text, useWindowDimensions, Row, Stack } from '@unicornlove/beyond-ui'
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

  return (
    <Stack
      flex={1}
      backgroundColor="$color3"
      paddingHorizontal={isCollapsed ? '$2' : '$6'}
      paddingVertical="$5"
      alignItems={isCollapsed ? 'center' : 'stretch'}
    >
      <Stack flex={1} justifyContent="space-between" gap="$5" width="100%">
        {!isSmall ? (
          <Row justifyContent="center" alignItems="center" gap="$3" paddingTop="$2" width="100%">
            <ScaffaldLogo
              height={isCollapsed ? 30 : 40}
              width={isCollapsed ? 30 : 120}
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
            onLogoutPress={handleLogoutPress}
          />
        ) : null}

        <Stack
          gap="$2"
          flex={1}
          marginTop="$2"
          width="100%"
          alignItems={isCollapsed ? 'center' : 'stretch'}
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
        </Stack>

        <Stack
          paddingTop="$4"
          borderTopWidth={1}
          borderColor="$color5"
          width="100%"
          alignItems={isCollapsed ? 'center' : 'stretch'}
        >
          {isCollapsed ? (
            <Stack gap="$3" alignItems="center">
              <FooterActionButton label="Settings" onPress={handleSettingsPress}>
                <SettingsIcon size={footerIconSize} color="$color11" />
              </FooterActionButton>
              <FooterActionButton label={themeToggleLabel} onPress={handleThemeToggle}>
                <ThemeToggleIcon size={footerIconSize} color="$color11" />
              </FooterActionButton>
              {canCollapse && onToggleCollapse ? (
                <FooterActionButton
                  label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
                  onPress={onToggleCollapse}
                >
                  {isCollapsed ? (
                    <PanelRightClose size={footerIconSize} color="$color11" />
                  ) : (
                    <PanelLeftClose size={footerIconSize} color="$color11" />
                  )}
                </FooterActionButton>
              ) : null}
            </Stack>
          ) : (
            <Row
              width="100%"
              justifyContent="space-between"
              alignItems="center"
              gap="$3"
              paddingHorizontal="$3"
            >
              <FooterActionButton label="Settings" onPress={handleSettingsPress}>
                <SettingsIcon size={footerIconSize} color="$color11" />
              </FooterActionButton>
              <FooterActionButton label={themeToggleLabel} onPress={handleThemeToggle}>
                <ThemeToggleIcon size={footerIconSize} color="$color11" />
              </FooterActionButton>
              {canCollapse && onToggleCollapse ? (
                <FooterActionButton
                  label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
                  onPress={onToggleCollapse}
                >
                  {isCollapsed ? (
                    <PanelRightClose size={footerIconSize} color="$color11" />
                  ) : (
                    <PanelLeftClose size={footerIconSize} color="$color11" />
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
  onLogoutPress: () => void
}

const DrawerProfileCard = ({
  displayName,
  avatarUri,
  fallbackInitial,
  onProfilePress,
  onLogoutPress,
}: DrawerProfileCardProps) => {
  const avatarSize = 40

  return (
    <Row
      width="100%"
      borderWidth={1}
      borderColor="$color4"
      padding="$3"
      gap="$3"
      alignItems="center"
      borderRadius="$4"
    >
      {avatarUri ? (
        <Stack
          width={avatarSize}
          height={avatarSize}
          overflow="hidden"
          borderWidth={1}
          borderColor="$borderColor"
          backgroundColor="$color2"
          alignItems="center"
          justifyContent="center"
          style={{ borderRadius: avatarSize / 2 }}
        >
          <Image
            source={{ uri: avatarUri }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        </Stack>
      ) : (
        <Stack
          width={avatarSize}
          height={avatarSize}
          backgroundColor="$blue10"
          alignItems="center"
          justifyContent="center"
          borderWidth={1}
          borderColor="$borderColor"
          style={{ borderRadius: avatarSize / 2 }}
        >
          <Text color="$color1" fontSize={16} fontWeight="700">
            {fallbackInitial}
          </Text>
        </Stack>
      )}

      <Stack flex={1} gap="$2">
        <Text fontSize="$4" fontWeight="600" color="$color12">
          {displayName}
        </Text>
        <Row gap="$4">
          <Text
            fontSize="$2"
            color="$blue10"
            textDecorationLine="underline"
            cursor="pointer"
            onPress={onProfilePress}
            pressStyle={{ opacity: 0.7 }}
          >
            My Profile
          </Text>
          <Text
            fontSize="$2"
            color="$red10"
            textDecorationLine="underline"
            cursor="pointer"
            onPress={onLogoutPress}
            pressStyle={{ opacity: 0.7 }}
          >
            Logout
          </Text>
        </Row>
      </Stack>
    </Row>
  )
}
