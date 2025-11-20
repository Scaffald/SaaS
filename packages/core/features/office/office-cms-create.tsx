import { ROUTES } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import type { WelcomeSlideCreate } from '@app/schemas'
import { DashboardLayout } from '@app/ui'
import { useRouter } from 'expo-router'
import { Text, YStack } from 'tamagui'
import { CMSSlideForm } from './cms-slide-form'

export function OfficeCMSCreate() {
  const router = useRouter()
  const createSlide = api.cms.createWelcomeSlide.useMutation()

  const handleSubmit = async (data: WelcomeSlideCreate) => {
    await createSlide.mutateAsync(data)
    router.push(ROUTES.OFFICE.CMS.WELCOME.path)
  }

  return (
    <DashboardLayout
      leftContent={
        <YStack gap="$4">
          <CMSSlideForm onSubmit={handleSubmit} isLoading={createSlide.isPending} />
        </YStack>
      }
      rightContent={
        <YStack gap="$4">
          <Text fontSize="$5" fontWeight="bold">
            Create New Slide
          </Text>
          <Text>Add a new welcome slide to be shown during user onboarding.</Text>
          <Text>
            Make sure to set the display order appropriately to control when this slide appears.
          </Text>
        </YStack>
      }
    />
  )
}
