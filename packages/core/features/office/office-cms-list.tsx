import { useState } from 'react'
import { Button, H2, Spinner, XStack, YStack, Text } from 'tamagui'
import { Plus, Pencil, Trash2, Eye, EyeOff } from '@tamagui/lucide-icons'
import { Link, useRouter } from 'expo-router'
import { api } from '@app/core/utils/api'
import { ROUTES } from '@app/core/constants/routes'
import { DashboardLayout } from '@app/ui'

export function OfficeCMSList() {
  const [includeInactive, setIncludeInactive] = useState(false)

  const { data, isLoading, refetch } = api.cms.listWelcomeSlides.useQuery({
    include_inactive: includeInactive,
  })

  const deleteSlide = api.cms.deleteWelcomeSlide.useMutation({
    onSuccess: () => {
      refetch()
    },
  })

  const toggleActive = api.cms.updateWelcomeSlide.useMutation({
    onSuccess: () => {
      refetch()
    },
  })

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteSlide.mutateAsync({ id })
    }
  }

  const handleToggleActive = async (slide: {
    id: string
    title: string
    description: string
    icon_name: string
    background_image_url: string
    display_order: number
    is_active: boolean
  }) => {
    await toggleActive.mutateAsync({
      id: slide.id,
      title: slide.title,
      description: slide.description,
      icon_name: slide.icon_name,
      background_image_url: slide.background_image_url,
      display_order: slide.display_order,
      is_active: !slide.is_active,
    })
  }

  return (
    <DashboardLayout
      leftContent={
        <YStack flex={1} gap="$4">
          <XStack justify="space-between" items="center">
            <H2>Welcome Slides CMS</H2>
            <Link href={ROUTES.OFFICE_CMS_CREATE.path} asChild>
              <Button icon={Plus}>Create Slide</Button>
            </Link>
          </XStack>

          <XStack gap="$2" items="center">
            <Button
              size="$3"
              chromeless={!includeInactive}
              onPress={() => setIncludeInactive(!includeInactive)}
            >
              {includeInactive ? 'Hide' : 'Show'} Inactive
            </Button>
          </XStack>

          {isLoading ? (
            <YStack items="center" justify="center" flex={1}>
              <Spinner size="large" />
            </YStack>
          ) : (
            <YStack gap="$2">
              {data?.slides.map(
                (slide: {
                  id: string
                  title: string
                  description: string
                  icon_name: string
                  background_image_url: string
                  display_order: number
                  is_active: boolean
                }) => (
                  <XStack
                    key={slide.id}
                    p="$4"
                    gap="$3"
                    bg="$background"
                    rounded="$4"
                    borderWidth={1}
                    borderColor="$borderColor"
                    items="center"
                  >
                    <YStack flex={1} gap="$2">
                      <XStack gap="$2" items="center">
                        <Text fontWeight="bold">{slide.title}</Text>
                        {!slide.is_active && (
                          <Text fontSize="$2" color="$red10">
                            (Inactive)
                          </Text>
                        )}
                      </XStack>
                      <Text opacity={0.7}>{slide.description}</Text>
                      <XStack gap="$2">
                        <Text fontSize="$2" opacity={0.5}>
                          Icon: {slide.icon_name}
                        </Text>
                        <Text fontSize="$2" opacity={0.5}>
                          • Order: {slide.display_order}
                        </Text>
                      </XStack>
                    </YStack>

                    <XStack gap="$2">
                      <Button
                        size="$3"
                        icon={slide.is_active ? EyeOff : Eye}
                        onPress={() => handleToggleActive(slide)}
                        chromeless
                      />
                      <Link href={ROUTES.OFFICE_CMS_EDIT.path.replace(':id', slide.id)} asChild>
                        <Button size="$3" icon={Pencil} chromeless />
                      </Link>
                      <Button
                        size="$3"
                        icon={Trash2}
                        onPress={() => handleDelete(slide.id, slide.title)}
                        chromeless
                        theme="error"
                      />
                    </XStack>
                  </XStack>
                )
              )}

              {(!data?.slides || data.slides.length === 0) && (
                <YStack items="center" justify="center" gap="$4" py="$8">
                  <Text opacity={0.5}>No slides found</Text>
                  <Link href={ROUTES.OFFICE_CMS_CREATE.path} asChild>
                    <Button icon={Plus}>Create First Slide</Button>
                  </Link>
                </YStack>
              )}
            </YStack>
          )}
        </YStack>
      }
      rightContent={
        <YStack gap="$4">
          <Text fontSize="$5" fontWeight="bold">
            About Welcome Slides
          </Text>
          <Text>Manage the onboarding slides shown to new users when they first sign in.</Text>
          <Text>Slides are displayed in order based on the "display_order" value.</Text>
          <Text>Only active slides are shown to users.</Text>
        </YStack>
      }
    />
  )
}
