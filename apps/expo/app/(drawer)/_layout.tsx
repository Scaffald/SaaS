import { DrawerMenu } from '@app/features/drawer-menu'
import { Button, useTheme } from '@app/ui'
import { DrawerActions } from '@react-navigation/native'
import { Map as MapIcon, Menu } from '@tamagui/lucide-icons'
import { router } from 'expo-router'
import { Drawer } from 'expo-router/drawer'
import { useMedia } from 'tamagui'

export default function Layout() {
  const media = useMedia()
  const { accentColor } = useTheme()

  const drawerWidth = media.gtSm ? 320 : 300
  const isDesktop = media.gtSm

  return (
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
            onPress={() => {
              router.navigate('/discover')
            }}
          >
            <MapIcon size={24} />
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
      <Drawer.Screen name="index" options={{ title: 'Home' }} />
      <Drawer.Screen name="discover" options={{ title: 'Discover' }} />
      <Drawer.Screen name="profile" options={{ title: 'Profile' }} />
    </Drawer>
  )
}
