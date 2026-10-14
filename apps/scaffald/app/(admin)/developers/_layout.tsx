import { scrollingScreenLayout } from '@scf/core/components/layouts/ScreenScroll'
import { DrawerLayout } from '@scf/core/features/drawer/DrawerLayout'
import { Stack } from 'expo-router'

/**
 * The app shell for developer self-service. `(admin)/_layout` only gates on
 * auth, so /developers/register rendered with no drawer at all, on white
 * (#1098). Registration is open to any signed-in user, so unlike Office there
 * is no role check here.
 */
export default function DevelopersLayout() {
  return (
    <DrawerLayout protectionComponent={null} screenLayout={scrollingScreenLayout}>
      <Stack.Screen name="register/index" options={{ title: 'Register an application' }} />
    </DrawerLayout>
  )
}
