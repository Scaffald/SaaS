import { ROUTES } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import type { WelcomeSlideCreate, WelcomeSlideUpdate } from '@scf/schemas'
import { OfficeLayout } from '@scf/core/components/layouts'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Spinner, Text, Stack } from '@scaffald/ui'
import { CMSSlideForm } from './cms-slide-form'

export function OfficeCMSEdit() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data, isLoading } = api.cms.getWelcomeSlide.useQuery({ id: id || '' })
  const updateSlide = api.cms.updateWelcomeSlide.useMutation()

  const handleSubmit = async (formData: WelcomeSlideCreate | WelcomeSlideUpdate) => {
    // In edit mode, we always have an id, so this is always WelcomeSlideUpdate
    await updateSlide.mutateAsync(formData as WelcomeSlideUpdate)
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
