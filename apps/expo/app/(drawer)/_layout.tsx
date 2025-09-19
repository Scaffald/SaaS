import { DrawerMenu } from '@my/app/features/drawer-menu'
import { getTokens, useMedia } from '@my/ui'
import { Drawer } from 'expo-router/drawer'

export default function Layout() {
  const media = useMedia()
  const tokens = getTokens()
  const drawerWidth = media.gtSm ? tokens.size['$20'].val : tokens.size['$10'].val

  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerType: media.gtSm ? 'permanent' : 'front',
        swipeEnabled: !media.gtSm,
        overlayColor: 'rgba(10,10,10,0.15)',
        drawerStyle: {
          width: drawerWidth,
          backgroundColor: 'transparent',
        },
        sceneContainerStyle: {
          backgroundColor: 'transparent',
        },
        drawerContentStyle: {
          padding: 0,
        },
      }}
      drawerContent={(props) => <DrawerMenu {...props} />}
    />
  )
}
