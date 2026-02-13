import { ROUTES } from '@scf/core/constants/routes'
import { useToast } from '@scaffald/ui'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { useWindowDimensions } from 'react-native'

export const useOfficeRouteProtection = () => {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const toast = useToast()

  const isTabletOrAbove = width > 800

  useEffect(() => {
    if (!isTabletOrAbove) {
      toast.show({
        message: 'Office features are only available on tablet and desktop devices',
        duration: 4000,
      })

      router.replace(ROUTES.DASHBOARD.path as Parameters<typeof router.replace>[0])
    }
  }, [isTabletOrAbove, router, toast])

  return { isTabletOrAbove }
}
