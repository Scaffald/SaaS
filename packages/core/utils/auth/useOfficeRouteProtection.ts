import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useWindowDimensions } from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { ROUTES } from '@app/core/constants/routes'

export const useOfficeRouteProtection = () => {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const toast = useToastController()

  // $gtSm breakpoint is 860px
  const isTabletOrAbove = width >= 860

  useEffect(() => {
    // Only redirect if on mobile
    if (!isTabletOrAbove) {
      toast.show('Office features are only available on tablet and desktop devices', {
        type: 'warning',
        duration: 4000,
      })

      // Redirect to dashboard
      router.replace(ROUTES.DASHBOARD.path as any)
    }
  }, [isTabletOrAbove, router, toast])

  return { isTabletOrAbove }
}

