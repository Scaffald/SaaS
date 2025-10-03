import { Button, useTheme, YStack, Text, Spinner } from 'tamagui'
import { useRoleProtectedRoute } from '@app/core/utils/auth/useRoleProtectedRoute'
import { DrawerActions } from '@react-navigation/native'
import { Bell, Menu } from '@tamagui/lucide-icons'
import { Drawer } from 'expo-router/drawer'
import { useWindowDimensions } from 'tamagui'
import { useState } from 'react'
import { NotificationsActionSheet } from '@app/ui/src/components/NotificationsActionSheet'
import { OfficeDrawerMenuMobile } from '@app/core/features/drawer/OfficeDrawerMenu'

export default function OfficeLayout() {
  const { isAuthorized, isLoading } = useRoleProtectedRoute(['super_admin'])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { width } = useWindowDimensions()
  const theme = useTheme()
  const isSmall = width < 1400

  if (isLoading) {
    return (
      <YStack flex={1} justify="center" items="center">
        <Spinner size="large" />
        <Text mt="$4">Loading...</Text>
      </YStack>
    )
  }

  if (!isAuthorized) return null

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
        drawerContent={(props) => <OfficeDrawerMenuMobile {...props} />}
      >
        <Drawer.Screen name="index" options={{ title: 'Office' }} />
      </Drawer>

      <NotificationsActionSheet open={notificationsOpen} onOpenChange={setNotificationsOpen} />
    </>
  )
}
