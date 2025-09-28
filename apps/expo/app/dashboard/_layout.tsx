import { DrawerMenu } from '@app/core/features/drawer'
import { Button, useTheme, NotificationsActionSheet } from '@app/ui'
import { DrawerActions } from '@react-navigation/native'
import { Bell, Menu } from '@tamagui/lucide-icons'
import { Drawer } from 'expo-router/drawer'
import { useMedia } from 'tamagui'
import { useState } from 'react'

export default function Layout() {
  const media = useMedia()
  const { accentColor } = useTheme()
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const drawerWidth = media.gtSm ? 320 : 300
  const isDesktop = media.gtSm

  return (
    <>
      <Drawer
        screenOptions={({ navigation }) => ({
          headerShown: true,
          headerTintColor: accentColor.val,
          headerLeft: isDesktop
            ? undefined
            : () => (
                <Button
                  borderStyle="unset"
                  borderWidth={0}
                  backgroundColor="transparent"
                  marginLeft="$-1"
                  paddingHorizontal="$4"
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
              marginRight="$-1"
              backgroundColor="transparent"
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
        <Drawer.Screen name="settings/index" options={{ title: 'Settings' }} />
      </Drawer>

      <NotificationsActionSheet open={notificationsOpen} onOpenChange={setNotificationsOpen} />
    </>
  )
}
