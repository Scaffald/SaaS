import { DrawerMenu } from '@app/core/features/drawer'
import { Button, useTheme, NotificationsActionSheet } from '@app/ui'
import { useProtectedRoute } from '@app/core/utils/auth/useProtectedRoute'
import { DrawerActions } from '@react-navigation/native'
import { Bell, Menu } from '@tamagui/lucide-icons'
import { Drawer } from 'expo-router/drawer'
import { useMedia, YStack, Text } from 'tamagui'
import { useState } from 'react'

export default function Layout() {
  const { isLoading } = useProtectedRoute()
  const media = useMedia()
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <YStack flex={1} justify="center" items="center">
        <Text>Loading...</Text>
      </YStack>
    )
  }

  const drawerWidth = media.sm ? 320 : 300
  const isDesktop = media.sm

  return (
    <>
      <Drawer
        screenOptions={({ navigation }) => ({
          headerShown: true,
          headerStyle: {
            backgroundColor: '$color2',
            borderWidth: 0,
          },
          headerLeft: isDesktop
            ? undefined
            : () => (
                <Button
                  borderStyle="unset"
                  borderWidth={0}
                  bg="transparent"
                  ml="$3"
                  px="$4"
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
              mr="$3"
              bg="transparent"
              onPress={() => setNotificationsOpen(true)}
            >
              <Bell size={24} />
            </Button>
          ),
          drawerType: isDesktop ? 'permanent' : 'front',
          swipeEnabled: !isDesktop,
          overlayColor: isDesktop ? 'transparent' : 'rgba(10,10,10,0.15)',
          drawerStyle: {
            width: drawerWidth,
            backgroundColor: 'transparent',
          },
          sceneContainerStyle: {
            backgroundColor: 'transparent',
          },
          drawerContentStyle: {
            padding: 0,
            backgroundColor: 'transparent',
          },
        })}
        drawerContent={(props) => <DrawerMenu {...props} />}
      >
        <Drawer.Screen name="index" options={{ title: 'Dashboard' }} />
        <Drawer.Screen name="workers/index" options={{ title: 'Workers' }} />
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
