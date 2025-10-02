import { DrawerMenu } from '@app/core/features/drawer'
import { Button, useTheme, NotificationsActionSheet } from '@app/ui'
import { useProtectedRoute } from '@app/core/utils/auth/useProtectedRoute'
import { DrawerActions } from '@react-navigation/native'
import { Bell, Menu } from '@tamagui/lucide-icons'
import { Drawer } from 'expo-router/drawer'
import { useMedia, YStack, Text, useWindowDimensions } from 'tamagui'
import { useState } from 'react'

export default function Layout() {
  const { isLoading } = useProtectedRoute()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { width } = useWindowDimensions()
  const theme = useTheme()
  const isSmall = width < 1400

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <YStack flex={1} justify="center" items="center">
        <Text>Loading...</Text>
      </YStack>
    )
  }

  return (
    <>
      <Drawer
        screenOptions={({ navigation }) => ({
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.color2.val,
          },
          headerLeftContainerStyle: {},
          headerTitleStyle: {
            color: theme.color12.val,
            marginLeft: isSmall ? '0' : '35px',
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
        <Drawer.Screen name="index" options={{ title: 'Dashboard' }} />
        <Drawer.Screen name="discover/index" options={{ title: 'Discover' }} />
        <Drawer.Screen name="profile/general/index" options={{ title: 'General Information' }} />
        <Drawer.Screen name="profile/education/index" options={{ title: 'Education' }} />
        <Drawer.Screen name="profile/employment/index" options={{ title: 'Employment' }} />
        <Drawer.Screen name="profile/experience/index" options={{ title: 'Experience' }} />
        <Drawer.Screen name="profile/skills/index" options={{ title: 'Skills' }} />
        <Drawer.Screen name="profile/certifications/index" options={{ title: 'Certifications' }} />
      </Drawer>

      <NotificationsActionSheet open={notificationsOpen} onOpenChange={setNotificationsOpen} />
    </>
  )
}
