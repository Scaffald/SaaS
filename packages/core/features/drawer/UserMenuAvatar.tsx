import { useState, useCallback, useEffect, useRef } from 'react'
import { YStack, XStack, Text, Button, Popover, Separator, type GetThemeValueForKey } from 'tamagui'
import { Image } from 'expo-image'
import { User, Settings, Sun, Moon, LogOut, Eye, Pencil } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { useWindowDimensions } from 'tamagui'
import { useUser } from '@app/core/utils/useUser'
import { api } from '@app/core/utils/api'
import { getAvatarUrl } from '@app/core/utils/supabase/storage'
import { ROUTES, RouteBuilder } from '@app/core/constants/routes'
import { useThemeSetting } from '@app/core/provider/theme/UniversalThemeProvider'
import { supabase } from '@app/core/utils/supabase/client'

/**
 * Extract initials from a name
 */
// function getInitials(name: string): string {
//   if (!name || typeof name !== 'string') {
//     return '?'
//   }

//   const words = name.trim().split(/\s+/)

//   if (words.length === 1) {
//     // Single word: use first character
//     return words[0].charAt(0).toUpperCase()
//   }

//   // Multiple words: use first character of first two words
//   return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
// }

/**
 * UserMenuAvatar component
 * Displays user avatar in header with popover menu for profile and settings actions
 */
export function UserMenuAvatar() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isMobile = width < 768
  const triggerRef = useRef<{ focus?: () => void } | null>(null)

  const { user } = useUser()
  // const { profile } = useUser() // Will uncomment when we add avatar display

  // Fetch general profile data to get first_name and last_name
  const { data: generalProfile } = api.profile.getGeneral.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  // Construct display name from first_name and last_name, fallback to email
  const displayName = (() => {
    if (generalProfile?.first_name && generalProfile?.last_name) {
      return `${generalProfile.first_name} ${generalProfile.last_name}`.trim()
    }
    return user?.email || 'User'
  })()

  // Get avatar URL
  // const avatarUrl = getAvatarUrl(profile?.avatar_path || '')

  // Get user ID for profile viewing
  // const userId = user?.id || ''

  // Get initials for fallback
  // const initials = displayName ? getInitials(displayName) : '?'

  // Generate a consistent color based on the name
  // const getColorIndex = (str: string): number => {
  //   let hash = 0
  //   for (let i = 0; i < str.length; i++) {
  //     hash = str.charCodeAt(i) + ((hash << 5) - hash)
  //   }
  //   return Math.abs(hash) % 8
  // }

  // const colorIndex = getColorIndex(displayName)
  // const bgColors = [
  //   '$blue10',
  //   '$green10',
  //   '$blue10',
  //   '$red10',
  //   '$pink10',
  //   '$red10',
  //   '$yellow10',
  //   '$color10',
  // ]
  // const bgColor = bgColors[colorIndex] as GetThemeValueForKey<'backgroundColor'>

  // Handle escape key to close
  useEffect(() => {
    if (!open) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus?.()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  // Handle click outside to close
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen && triggerRef.current) {
      setTimeout(() => {
        triggerRef.current?.focus?.()
      }, 100)
    }
  }, [])

  // Handle menu item click
  const handleMenuItemClick = useCallback(
    (href?: string, action?: () => void) => {
      if (action) {
        action()
      }
      if (href) {
        // Biome-ignore lint/suspicious/noExplicitAny: expo-router requires dynamic route typing
        router.push(href as unknown as Parameters<typeof router.push>[0])
      }
      setOpen(false)
    },
    [router]
  )

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setOpen(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [])

  // Handle theme toggle
  const { resolvedTheme, set: setTheme } = useThemeSetting()
  const handleThemeToggle = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }, [resolvedTheme, setTheme])

  // Routes
  const userId = user?.id || ''
  const viewProfileHref = userId ? RouteBuilder.dashboardUser(userId) : undefined
  const editProfileHref = ROUTES.DASHBOARD_PROFILE_GENERAL.path

  // Avatar size (matches notification icon height)
  const avatarSize = 30

  return (
    <Popover
      placement={isMobile ? 'top' : 'bottom-end'}
      open={open}
      onOpenChange={handleOpenChange}
    >
      <Popover.Trigger asChild>
        <Button
          ref={triggerRef}
          borderStyle="unset"
          borderWidth={0}
          bg="transparent"
          height={avatarSize}
          width={avatarSize}
          p={0}
          aria-label="User menu"
          onPress={() => setOpen(!open)}
        >
          {/* Minimal avatar - just a colored box */}
          <YStack
            width={avatarSize}
            height={avatarSize}
            rounded="$2"
            bg="$blue10"
            items="center"
            justify="center"
            borderWidth={1}
            borderColor="$borderColor"
          >
            <Text color="white" fontSize={12} fontWeight="700">
              U
            </Text>
          </YStack>
        </Button>
      </Popover.Trigger>

      <Popover.Content
        role="menu"
        rounded="$4"
        p={0}
        w={isMobile ? 'calc(100vw - 32px)' : 240}
        elevate
        borderWidth={1}
        borderColor="$borderColor"
        bg="$background"
        animation="quick"
        enterStyle={{ opacity: 0, scale: 0.95, y: -10 }}
        exitStyle={{ opacity: 0, scale: 0.95, y: -10 }}
      >
        {/* Header */}
        <YStack p="$4" borderBottomWidth={1} borderBottomColor="$borderColor" gap="$2">
          <Text fontSize="$4" fontWeight="600" color="$color12">
            {displayName}
          </Text>
          {user?.email && (
            <Text fontSize="$2" color="$color11">
              {user.email}
            </Text>
          )}
        </YStack>

        {/* Menu Items */}
        <YStack>
          {/* View Public Profile */}
          {viewProfileHref && (
            <YStack
              role="menuitem"
              tabIndex={0}
              p="$3"
              bg="transparent"
              pressStyle={{ bg: '$color3' }}
              hoverStyle={{ bg: '$color3' }}
              onPress={() => handleMenuItemClick(viewProfileHref)}
              cursor="pointer"
              width="100%"
              aria-label="View public profile"
            >
              <XStack gap="$3" items="center">
                <Eye size={18} color="$color10" />
                <Text fontSize="$3" color="$color12">
                  View Public Profile
                </Text>
              </XStack>
            </YStack>
          )}

          {/* Edit Profile */}
          <YStack
            role="menuitem"
            tabIndex={0}
            p="$3"
            bg="transparent"
            pressStyle={{ bg: '$color3' }}
            hoverStyle={{ bg: '$color3' }}
            onPress={() => handleMenuItemClick(editProfileHref)}
            cursor="pointer"
            width="100%"
            aria-label="Edit profile"
          >
            <XStack gap="$3" items="center">
              <Pencil size={18} color="$color10" />
              <Text fontSize="$3" color="$color12">
                Edit Profile
              </Text>
            </XStack>
          </YStack>

          {/* Theme Toggle */}
          <YStack
            role="menuitem"
            tabIndex={0}
            p="$3"
            bg="transparent"
            pressStyle={{ bg: '$color3' }}
            hoverStyle={{ bg: '$color3' }}
            onPress={handleThemeToggle}
            cursor="pointer"
            width="100%"
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
          >
            <XStack gap="$3" items="center">
              {resolvedTheme === 'dark' ? (
                <Sun size={18} color="$color10" />
              ) : (
                <Moon size={18} color="$color10" />
              )}
              <Text fontSize="$3" color="$color12">
                Theme: {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
              </Text>
            </XStack>
          </YStack>

          {/* Separator */}
          <Separator bg="$borderColor" />

          {/* Logout */}
          <YStack
            role="menuitem"
            tabIndex={0}
            p="$3"
            bg="transparent"
            pressStyle={{ bg: '$color3' }}
            hoverStyle={{ bg: '$color3' }}
            onPress={handleLogout}
            cursor="pointer"
            width="100%"
            aria-label="Logout"
          >
            <XStack gap="$3" items="center">
              <LogOut size={18} color="$red10" />
              <Text fontSize="$3" color="$red10">
                Logout
              </Text>
            </XStack>
          </YStack>
        </YStack>
      </Popover.Content>
    </Popover>
  )
}
