import { ROUTES } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import type { WelcomeSlideCreate } from '@scf/schemas'
import { OfficeLayout } from '@scf/core/components/layouts'
import { useRouter } from 'expo-router'
import { Text, Stack } from '@unicornlove/beyond-ui'
import { CMSSlideForm } from './cms-slide-form'

export function OfficeCMSCreate() {
  const router = useRouter()
  const createSlide = api.cms.createWelcomeSlide.useMutation()

  const handleSubmit = async (data: WelcomeSlideCreate) => {
    await createSlide.mutateAsync(data)
    router.push(ROUTES.OFFICE.CMS.WELCOME.path)
  }

  return (
    <OfficeLayout
      showBreadcrumb
      leftContent={
        <Stack gap="$4">
          <CMSSlideForm onSubmit={handleSubmit} isLoading={createSlide.isPending} />
        </Stack>
      }
      rightContent={
        <Stack gap="$4">
          <Text fontSize="$5" fontWeight="bold">
            Create New Slide
          </Text>
          <Text>Add a new welcome slide to be shown during user onboarding.</Text>
          <Text>
            Make sure to set the display order appropriately to control when this slide appears.
          </Text>
        </Stack>
      }
    />
  )
}
