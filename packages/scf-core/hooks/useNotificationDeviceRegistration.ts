import {
  useRegisterDeviceMutation,
  useRemoveDeviceMutation,
} from '@scf/core/utils/notifications-sdk-hooks'
import Constants from 'expo-constants'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'

type ExpoNotificationsModule = typeof import('expo-notifications')

let notificationsModule: ExpoNotificationsModule | null = null

async function getNotificationsModule(): Promise<ExpoNotificationsModule> {
  if (!notificationsModule) {
    notificationsModule = await import('expo-notifications')
  }
  return notificationsModule
}

async function obtainPushToken() {
  const Notifications = await getNotificationsModule()
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const request = await Notifications.requestPermissionsAsync()
    finalStatus = request.status
  }

  if (finalStatus !== 'granted') {
    return null
  }

  const expoToken = await Notifications.getExpoPushTokenAsync()
  return expoToken.data
}

function getPlatform(): 'ios' | 'android' | 'web' {
  if (Platform.OS === 'ios') return 'ios'
  if (Platform.OS === 'android') return 'android'
  return 'web'
}

export function useNotificationDeviceRegistration(enabled = true) {
  const registerMutation = useRegisterDeviceMutation()
  const removeMutation = useRemoveDeviceMutation()
  const [registeredToken, setRegisteredToken] = useState<string | null>(null)

  useEffect(() => {
    if (Platform.OS === 'web') {
      return
    }

    let isMounted = true

    const syncToken = async () => {
      if (!enabled) {
        if (registeredToken) {
          removeMutation.mutate({ token: registeredToken })
          setRegisteredToken(null)
        }
        return
      }

      try {
        const token = await obtainPushToken()
        if (!token || !isMounted) return

        if (registeredToken === token) {
          return
        }

        registerMutation.mutate({
          token,
          platform: getPlatform(),
          metadata: {
            appVersion: Constants.expoConfig?.version,
            buildNumber: Constants.expoConfig?.runtimeVersion,
          },
        })
        setRegisteredToken(token)
      } catch (error) {
        console.warn('[notifications] Failed to register push token', error)
      }
    }

    void syncToken()

    return () => {
      isMounted = false
    }
  }, [enabled, registerMutation, removeMutation, registeredToken])
}
