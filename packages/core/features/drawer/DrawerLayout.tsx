import { type ReactNode, useState } from 'react'
import { Button, useTheme, YStack, Text } from 'tamagui'
import { DrawerActions } from '@react-navigation/native'
import { Bell, Menu } from '@tamagui/lucide-icons'
import { Drawer } from 'expo-router/drawer'
import { useWindowDimensions } from 'tamagui'
import { NotificationsActionSheet } from '@app/ui'
import { DrawerMenu } from './index'

interface DrawerLayoutProps {
  /**
   * Protection component to render while checking auth/permissions
   * Should return null if not authorized, or children if authorized
   */
  protectionComponent: ReactNode
  /**
   * Child Drawer.Screen components
   */
  children: ReactNode
}

/**
 * Shared drawer layout component used by both dashboard and office sections
 * Provides consistent drawer behavior, styling, and responsive design
 */
export function DrawerLayout({ protectionComponent, children }: DrawerLayoutProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { width } = useWindowDimensions()
  const theme = useTheme()
  const isSmall = width < 1400

  return (
    <>
      {protectionComponent}

      <Drawer
        screenOptions={({ navigation }) => ({
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.color2.val,
          },
          headerLeftContainerStyle: {},
          headerTitleStyle: {
            color: theme.color12.val,
            marginLeft: isSmall ? 0 : 35,
          },
          headerLeft: () => (
            <Button
              borderStyle="unset"
              borderWidth={0}
              bg="transparent"
              display={isSmall ? 'flex' : 'none'}
              ml="$5"
              px="$4"
              height={30}
              onPress={() => {
                navigation.dispatch(DrawerActions.toggleDrawer())
              }}
            >
              <Menu size={24} />
            </Button>
          ),
          headerRight: () => (
            <Button
              borderStyle="unset"
              borderWidth={0}
              mr="$5"
              bg="transparent"
              height={30}
              onPress={() => setNotificationsOpen(true)}
            >
              <Bell size={20} />
            </Button>
          ),
          drawerType: isSmall ? 'front' : 'permanent',
          swipeEnabled: isSmall,
          overlayColor: 'rgba(0, 0, 0, 0.15)',
          drawerStyle: {
            width: 300,
          },
        })}
        drawerContent={(props) => <DrawerMenu {...props} />}
      >
        {children}
      </Drawer>

      <NotificationsActionSheet open={notificationsOpen} onOpenChange={setNotificationsOpen} />
    </>
  )
}
