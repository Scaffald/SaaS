import { ROUTES } from '@scf/core/constants/routes'
import {
  useWelcomeSlide,
  useUpdateWelcomeSlideMutation,
} from '@scf/core/utils/cms-sdk-hooks'
import type { UpdateWelcomeSlideParams } from '@scaffald/sdk'
import { OfficeLayout } from '@scf/core/components/layouts'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Spinner, Text, Stack } from '@scaffald/ui'
import { CMSSlideForm } from './cms-slide-form'

export function OfficeCMSEdit() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data, isLoading } = useWelcomeSlide(id || undefined)
  const updateSlide = useUpdateWelcomeSlideMutation()

  const handleSubmit = async (formData: UpdateWelcomeSlideParams | Omit<UpdateWelcomeSlideParams, 'id'>) => {
    const payload: UpdateWelcomeSlideParams =
      'id' in formData
        ? formData
        : { ...formData, id: id as string }
    await updateSlide.mutateAsync(payload)
    router.push(ROUTES.OFFICE.CMS.WELCOME.path)
  }

  if (isLoading) {
    return (
      <OfficeLayout
        showBreadcrumb
        leftContent={
          <Stack align="center" justify="center" flex={1}>
            <Spinner size="lg" />
          </Stack>
        }
        rightContent={null}
      />
    )
  }

  if (!data?.slide) {
    return (
      <OfficeLayout
        showBreadcrumb
        leftContent={
          <Stack gap={16}>
            <Text>Slide not found</Text>
          </Stack>
        }
        rightContent={null}
      />
    )
  }

  return (
    <OfficeLayout
      showBreadcrumb
      leftContent={
        <Stack gap={16}>
          <CMSSlideForm
            initialData={data.slide}
            onSubmit={handleSubmit}
            isLoading={updateSlide.isPending}
          />
        </Stack>
      }
      rightContent={
        <Stack gap={16}>
          <Text>Edit Slide</Text>
          <Text>
            Update the slide information. Changes will be visible to users immediately if the slide
            is active.
          </Text>
        </Stack>
      }
    />
  )
}
