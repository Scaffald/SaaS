import { ScaffaldLogo } from '@scf/core/assets'
import { ROUTES } from '@scf/core/constants/routes'
import { useGeneralInfoWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'
import { usePathname } from '@scf/core/utils/usePathname'
import { openPublicProfileInNewTab } from '@scf/core/utils/publicProfileUrl'
import { supabase } from '@scf/core/utils/supabase/client'
import { getAvatarUrl } from '@scf/core/utils/supabase/storage'
import { useUserRoles } from '@scf/core/utils/auth/useUserRoles'
import { useUser } from '@scf/core/utils/useUser'
import {
  ExternalLink,
  PanelLeftClose,
  PanelRightClose,
  Settings as SettingsIcon,
} from 'lucide-react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useCallback, type ReactNode } from 'react'
import { Pressable, ScrollView, View, type PressableStateCallbackType } from 'react-native'
import type { GestureResponderEvent } from 'react-native'
import { Text, useWindowDimensions, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors, glassVibrantColors } from '@scaffald/ui/tokens'
import { useOrganizations } from '@scf/core/utils/useOrganizations'
import { DrawerLink } from './DrawerLink'
import { getDrawerItems, generateOfficeDrawerItem } from './config'
import { MobileDrawerSections } from './MobileDrawerSections'
import { normalizePath } from './utils'

const OFFICE_DRAWER_ITEM = generateOfficeDrawerItem()

export type DrawerContentProps = {
  /** Called when the drawer should close (after navigating to a link). */
  onClose?: () => void
  /** Whether the drawer is collapsed (icon-only). */
  isCollapsed?: boolean
  /** Whether collapsing is available (md and larger). */
  canCollapse?: boolean
  /** Toggle collapse handler. */
  onToggleCollapse?: () => void
}

/**
 * DrawerContent renders the main content area of the drawer.
 * Used by both the mobile overlay drawer and the desktop permanent sidebar.
 */
export const DrawerContent = ({
  onClose,
  isCollapsed = false,
  canCollapse = false,
  onToggleCollapse,
}: DrawerContentProps) => {
  const { width } = useWindowDimensions()
  const { theme } = useThemeContext()
  const pathname = normalizePath(usePathname())
  const router = useRouter()
  const { user, profile } = useUser()
  const { hasOfficeRole } = useUserRoles()
  const { data: generalInfo } = useGeneralInfoWidget(undefined, {
    staleTime: 5 * 60 * 1000,
  })
  const { data: orgMemberships } = useOrganizations()
  const drawerItems = getDrawerItems(orgMemberships ?? undefined)
  const isSmall = width < 1024

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
  const fallbackInitial =
    displayName && displayName.trim().length > 0 ? displayName.trim().charAt(0).toUpperCase() : 'U'

  const handleNavigate = useCallback(
    (_href: string, _event?: GestureResponderEvent) => {
      onClose?.()
    },
    [onClose]
  )

  const handleSettingsPress = useCallback(() => {
    router.push(ROUTES.DASHBOARD.SETTINGS.path)
    handleNavigate(ROUTES.DASHBOARD.SETTINGS.path)
  }, [router, handleNavigate])

  const profilePath = ROUTES.PROFILE.path
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

  const glassTheme: 'light' | 'dark' = theme === 'dark' ? 'dark' : 'light'

  return (
    <View
      style={{
        flex: 1,
        width: '100%',
        paddingHorizontal: isCollapsed ? 8 : 24,
        paddingVertical: 20,
        alignItems: isCollapsed ? 'center' : 'stretch',
        borderRightWidth: isSmall ? 0 : 1,
        borderRightColor: colors.border[theme].subtle,
      }}
    >
      <Stack flex={1} justify="space-between" gap={20} width="100%">
        {!isSmall ? (
          <Row
            justify="center"
            align="center"
            gap={12}
            paddingTop={16}
            paddingBottom={8}
            width="100%"
          >
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
            slug={generalInfo?.slug ?? undefined}
            onEditProfilePress={handleProfilePress}
            onLogoutPress={handleLogoutPress}
          />
        ) : null}

        <ScrollView
          style={{ flex: 1, marginTop: 8 }}
          contentContainerStyle={{
            gap: isSmall ? 0 : 4,
            width: '100%',
            alignItems: isCollapsed ? 'center' : 'stretch',
            paddingBottom: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {isSmall && !isCollapsed ? (
            <MobileDrawerSections
              organizations={orgMemberships ?? null}
              onNavigate={() => onClose?.()}
              onSettingsPress={handleSettingsPress}
              onLogoutPress={handleLogoutPress}
            />
          ) : (
            <>
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
            </>
          )}
        </ScrollView>

        {/* Footer controls — pill container (desktop only; mobile has settings inline). */}
        {!isSmall ? (
          <Row
            justify={isCollapsed ? 'center' : 'space-between'}
            align="center"
            style={{
              backgroundColor:
                glassTheme === 'dark' ? 'rgba(80,73,64,0.4)' : 'rgba(200,195,188,0.4)',
              borderRadius: 16,
              padding: 8,
              width: '100%',
            }}
          >
            <FooterActionButton label="Settings" onPress={handleSettingsPress}>
              <SettingsIcon size={footerIconSize} color={colors.icon[glassTheme].default} />
            </FooterActionButton>
            {canCollapse && onToggleCollapse ? (
              <FooterActionButton
                label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
                onPress={onToggleCollapse}
              >
                {isCollapsed ? (
                  <PanelRightClose size={footerIconSize} color={colors.icon[glassTheme].default} />
                ) : (
                  <PanelLeftClose size={footerIconSize} color={colors.icon[glassTheme].default} />
                )}
              </FooterActionButton>
            ) : null}
          </Row>
        ) : null}
      </Stack>
    </View>
  )
}

type DrawerProfileCardProps = {
  displayName: string
  avatarUri: string | null
  fallbackInitial: string
  slug?: string | null
  onEditProfilePress: () => void
  onLogoutPress: () => void
}

const nameTextStyle = (theme: 'light' | 'dark') => ({
  color: theme === 'dark' ? colors.gray[100] : colors.gray[900],
  fontWeight: '700' as const,
  fontSize: 15,
  letterSpacing: -0.3,
})

const linkTextStyle = {
  fontWeight: '600' as const,
  fontSize: 12,
}

const DrawerProfileCard = ({
  displayName,
  avatarUri,
  fallbackInitial,
  slug,
  onEditProfilePress,
  onLogoutPress,
}: DrawerProfileCardProps) => {
  const { theme } = useThemeContext()
  const avatarSize = 48

  const handlePublicProfilePress = useCallback(() => {
    if (slug) openPublicProfileInNewTab(slug)
  }, [slug])

  const nameContent = slug ? (
    <Pressable
      onPress={handlePublicProfilePress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.8 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      })}
      accessibilityRole="link"
      accessibilityLabel="View public profile"
    >
      <Text style={nameTextStyle(theme)}>{displayName}</Text>
      <ExternalLink size={14} color={colors.primary[500]} />
    </Pressable>
  ) : (
    <Text style={nameTextStyle(theme)}>{displayName}</Text>
  )

  return (
    <Row
      align="center"
      gap={12}
      style={{
        padding: 12,
        borderRadius: 20,
        backgroundColor: glassVibrantColors[theme === 'dark' ? 'dark' : 'light'].tertiaryFill,
        borderWidth: 1,
        borderColor: glassVibrantColors[theme === 'dark' ? 'dark' : 'light'].separator,
      }}
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
          <Image
            source={{ uri: avatarUri }}
            contentFit="cover"
            style={{ width: avatarSize, height: avatarSize }}
          />
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
          <Text style={{ color: colors.white, fontWeight: '700', fontSize: 18 }}>
            {fallbackInitial}
          </Text>
        </Stack>
      )}
      <Stack flex={1} gap={6}>
        {nameContent}
        <Row align="center" gap={4}>
          <Pressable
            onPress={onEditProfilePress}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <Text style={{ ...linkTextStyle, color: colors.primary[500] }}>Edit profile</Text>
          </Pressable>
          <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>|</Text>
          <Pressable
            onPress={onLogoutPress}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            accessibilityRole="button"
            accessibilityLabel="Log out"
          >
            <Text style={{ ...linkTextStyle, color: colors.error[500] }}>Logout</Text>
          </Pressable>
        </Row>
      </Stack>
    </Row>
  )
}
