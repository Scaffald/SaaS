import { ROUTES } from '@scf/core/constants/routes'
import { useCreateWelcomeSlideMutation } from '@scf/core/utils/cms-sdk-hooks'
import type { CreateWelcomeSlideParams } from '@scaffald/sdk'
import { OfficeLayout } from '@scf/core/components/layouts'
import { useRouter } from 'expo-router'
import { Text, Stack } from '@scaffald/ui'
import { CMSSlideForm } from './cms-slide-form'

export function OfficeCMSCreate() {
  const router = useRouter()
  const createSlide = useCreateWelcomeSlideMutation()

  const handleSubmit = async (data: CreateWelcomeSlideParams) => {
    await createSlide.mutateAsync(data)
    router.push(ROUTES.OFFICE.CMS.WELCOME.path)
  }

  return (
    <OfficeLayout
      showBreadcrumb
      leftContent={
        <Stack gap={16}>
          <CMSSlideForm onSubmit={handleSubmit} isLoading={createSlide.isPending} />
        </Stack>
      }
      rightContent={
        <Stack gap={16}>
          <Text>Create New Slide</Text>
          <Text>Add a new welcome slide to be shown during user onboarding.</Text>
          <Text>
            Make sure to set the display order appropriately to control when this slide appears.
          </Text>
        </Stack>
      }
    />
  )
}
