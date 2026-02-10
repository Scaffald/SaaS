import { ROUTES } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import type { WelcomeSlideCreate, WelcomeSlideUpdate } from '@scf/schemas'
import { OfficeLayout } from '@scf/core/components/layouts'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Spinner, Text, Stack } from '@unicornlove/beyond-ui'
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
          <Stack alignItems="center" justifyContent="center" flex={1}>
            <Spinner size="large" />
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
          <Stack gap="$4">
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
        <Stack gap="$4">
          <CMSSlideForm
            initialData={data.slide}
            onSubmit={handleSubmit}
            isLoading={updateSlide.isPending}
          />
        </Stack>
      }
      rightContent={
        <Stack gap="$4">
          <Text fontSize="$5" fontWeight="bold">
            Edit Slide
          </Text>
          <Text>
            Update the slide information. Changes will be visible to users immediately if the slide
            is active.
          </Text>
        </Stack>
      }
    />
  )
}
