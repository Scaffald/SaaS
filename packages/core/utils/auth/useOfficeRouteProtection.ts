import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useMedia } from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { ROUTES } from '@app/core/constants/routes'

export const useOfficeRouteProtection = () => {
  const router = useRouter()
  const media = useMedia()
  const toast = useToastController()

  // Use Tamagui breakpoint: $gtSm = minWidth: 801px (tablet/desktop)
  // Note: Original check was width >= 860, but $gtSm (801px) is close and aligns with design system
  const isTabletOrAbove = media.gtSm

  useEffect(() => {
    // Only redirect if on mobile
    if (!isTabletOrAbove) {
      toast.show('Office features unavailable', {
        message: 'Office features are only available on tablet and desktop devices',
        duration: 4000,
      })

      // Redirect to dashboard
      router.replace(ROUTES.DASHBOARD.path as Parameters<typeof router.replace>[0])
    }
  }, [isTabletOrAbove, router, toast])

  return { isTabletOrAbove }
}

