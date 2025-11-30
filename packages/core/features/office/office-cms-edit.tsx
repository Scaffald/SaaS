import { ROUTES } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import type { WelcomeSlideCreate, WelcomeSlideUpdate } from '@app/schemas'
import { OfficeLayout } from '@app/core/components/layouts'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Spinner, Text, YStack } from 'tamagui'
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
          <YStack items="center" justify="center" flex={1}>
            <Spinner size="large" />
          </YStack>
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
          <YStack gap="$4">
            <Text>Slide not found</Text>
          </YStack>
        }
        rightContent={null}
      />
    )
  }

  return (
    <OfficeLayout
      showBreadcrumb
      leftContent={
        <YStack gap="$4">
          <CMSSlideForm
            initialData={data.slide}
            onSubmit={handleSubmit}
            isLoading={updateSlide.isPending}
          />
        </YStack>
      }
      rightContent={
        <YStack gap="$4">
          <Text fontSize="$5" fontWeight="bold">
            Edit Slide
          </Text>
          <Text>
            Update the slide information. Changes will be visible to users immediately if the slide
            is active.
          </Text>
        </YStack>
      }
    />
  )
}
