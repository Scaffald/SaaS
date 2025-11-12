import { useRouter } from 'expo-router'
import { YStack, Text } from 'tamagui'
import { api } from '@app/core/utils/api'
import { ROUTES } from '@app/core/constants/routes'
import { DashboardLayout } from '@app/ui'
import { CMSSlideForm } from './cms-slide-form'
import type { WelcomeSlideCreate } from '@app/schemas'

export function OfficeCMSCreate() {
  const router = useRouter()
  const createSlide = api.cms.createWelcomeSlide.useMutation()

  const handleSubmit = async (data: WelcomeSlideCreate) => {
    await createSlide.mutateAsync(data)
    router.push(ROUTES.OFFICE_CMS_WELCOME.path)
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
