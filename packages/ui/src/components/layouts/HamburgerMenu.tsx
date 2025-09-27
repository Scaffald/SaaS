import { YStack, XStack, Button, useMedia, useTheme } from '@app/ui'
import { Menu, X } from '@tamagui/lucide-icons'
import { useState, useEffect } from 'react'
import { DrawerMenu } from '@app/core/features/drawer-menu'
import { DrawerContentComponentProps } from '@react-navigation/drawer'

export type HamburgerMenuProps = {
  /**
   * Whether the menu is currently open
   */
  isOpen?: boolean
  /**
   * Callback when menu state changes
   */
  onToggle?: (isOpen: boolean) => void
  /**
   * Whether to show the hamburger button
   */
  showButton?: boolean
  /**
   * Custom drawer props for navigation
   */
  drawerProps?: Partial<DrawerContentComponentProps>
}

export const HamburgerMenu = ({
  isOpen: controlledIsOpen,
  onToggle,
  showButton = true,
  drawerProps = {},
}: HamburgerMenuProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const media = useMedia()
  const theme = useTheme()

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen

  const handleToggle = () => {
    const newIsOpen = !isOpen
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(newIsOpen)
    }
    onToggle?.(newIsOpen)
  }

  const handleClose = () => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(false)
    }
    onToggle?.(false)
  }

  // Close menu on escape key (web only)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Mock navigation object for DrawerMenu
  const mockNavigation = {
    closeDrawer: handleClose,
    navigate: () => {},
    goBack: () => {},
    canGoBack: () => false,
    isFocused: () => true,
    addListener: () => () => {},
    removeListener: () => {},
    dispatch: () => {},
    setParams: () => {},
    setOptions: () => {},
    reset: () => {},
    getParent: () => undefined,
    getState: () => ({ routes: [], index: 0 }),
    getId: () => 'hamburger-menu',
    getCurrentRoute: () => undefined,
  }

  const combinedDrawerProps: DrawerContentComponentProps = {
    navigation: mockNavigation as any,
    state: {
      routes: [],
      index: 0,
      history: [],
      type: 'drawer',
      stale: false,
      key: 'hamburger-menu',
      routeNames: [],
      preloadedRouteKeys: []
    } as any,
    descriptors: {},
    ...drawerProps,
  }

  return (
    <>
      {/* Hamburger Button */}
      {showButton && (
        <Button
          size="$4"
          chromeless
          icon={<Menu size={24} />}
          onPress={handleToggle}
          accessibilityLabel="Open menu"
          flexShrink={0}
        />
      )}

      {/* Overlay for web */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            backgroundColor="rgba(0, 0, 0, 0.5)"
            zIndex={1000}
            onPress={handleClose}
            animation="quick"
            opacity={1}
            animateOnly={['opacity']}
            $platform-web={{
              cursor: 'pointer',
              position: 'fixed',
            }}
          />

          {/* Menu Panel */}
          <YStack
            position="absolute"
            top={0}
            left={0}
            bottom={0}
            width={media.gtSm ? 320 : 300}
            backgroundColor="$color2"
            zIndex={1001}
            boxShadow="0 0 30px 0 rgba(0, 0, 0, 0.15)"
            animation="quick"
            x={0}
            animateOnly={['transform']}
            $platform-web={{
              transform: 'translateX(0)',
              position: 'fixed',
            }}
          >
            {/* Close Button */}
            <XStack ai="center" jc="flex-end" p="$3" borderBottomWidth={1} borderColor="$color4">
              <Button
                size="$3"
                circular
                chromeless
                icon={<X size={18} />}
                onPress={handleClose}
                accessibilityLabel="Close menu"
              />
            </XStack>

            {/* Drawer Content */}
            <YStack flex={1}>
              <DrawerMenu {...combinedDrawerProps} />
            </YStack>
          </YStack>
        </>
      )}
    </>
  )
}

export default HamburgerMenu
