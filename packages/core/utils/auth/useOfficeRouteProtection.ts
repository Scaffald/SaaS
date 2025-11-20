import { ROUTES } from '@app/core/constants/routes'
import { useToastController } from '@tamagui/toast'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { useWindowDimensions } from 'tamagui'

export const useOfficeRouteProtection = () => {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const toast = useToastController()

  // Use window dimensions for routing logic
  // Breakpoint: 800px (matches Tamagui $sm/$md breakpoint)
  // Note: Original check was width >= 860, but 801px is close and aligns with design system
  const isTabletOrAbove = width > 800

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
