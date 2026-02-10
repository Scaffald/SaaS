import { ROUTES } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import { OfficeLayout } from '@scf/core/components/layouts'
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react-native'
import { Link } from 'expo-router'
import { useState } from 'react'
import { Button, H2, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
    <OfficeLayout
      showBreadcrumb
      leftContent={
        <Stack flex={1} gap="$4">
          <Row justifyContent="space-between" alignItems="center">
            <H2>Welcome Slides CMS</H2>
            <Link href={ROUTES.OFFICE.CMS.WELCOME.CREATE.path} asChild>
              <Button icon={Plus}>Create Slide</Button>
            </Link>
          </Row>

          <Row gap="$2" alignItems="center">
            <Button
              size="$3"
              chromeless={!includeInactive}
              onPress={() => setIncludeInactive(!includeInactive)}
            >
              {includeInactive ? 'Hide' : 'Show'} Inactive
            </Button>
          </Row>

          {isLoading ? (
            <Stack alignItems="center" justifyContent="center" flex={1}>
              <Spinner size="large" />
            </Stack>
          ) : (
            <Stack gap="$2">
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
                  <Row
                    key={slide.id}
                    padding="$4"
                    gap="$3"
                    backgroundColor="$background"
                    borderRadius="$4"
                    borderWidth={1}
                    borderColor="$borderColor"
                    alignItems="center"
                  >
                    <Stack flex={1} gap="$2">
                      <Row gap="$2" alignItems="center">
                        <Text fontWeight="bold">{slide.title}</Text>
                        {!slide.is_active && (
                          <Text fontSize="$2" color="$red10">
                            (Inactive)
                          </Text>
                        )}
                      </Row>
                      <Text opacity={0.7}>{slide.description}</Text>
                      <Row gap="$2">
                        <Text fontSize="$2" opacity={0.5}>
                          Icon: {slide.icon_name}
                        </Text>
                        <Text fontSize="$2" opacity={0.5}>
                          • Order: {slide.display_order}
                        </Text>
                      </Row>
                    </Stack>

                    <Row gap="$2">
                      <Button
                        size="$3"
                        icon={slide.is_active ? EyeOff : Eye}
                        onPress={() => handleToggleActive(slide)}
                        chromeless
                      />
                      <Link
                        href={ROUTES.OFFICE.CMS.WELCOME.EDIT.path.replace(':id', slide.id)}
                        asChild
                      >
                        <Button size="$3" icon={Pencil} chromeless />
                      </Link>
                      <Button
                        size="$3"
                        icon={Trash2}
                        onPress={() => handleDelete(slide.id, slide.title)}
                        chromeless
                        theme="error"
                      />
                    </Row>
                  </Row>
                )
              )}

              {(!data?.slides || data.slides.length === 0) && (
                <Stack alignItems="center" justifyContent="center" gap="$4" paddingVertical="$8">
                  <Text opacity={0.5}>No slides found</Text>
                  <Link href={ROUTES.OFFICE.CMS.WELCOME.CREATE.path} asChild>
                    <Button icon={Plus}>Create First Slide</Button>
                  </Link>
                </Stack>
              )}
            </Stack>
          )}
        </Stack>
      }
      rightContent={
        <Stack gap="$4">
          <Text fontSize="$5" fontWeight="bold">
            About Welcome Slides
          </Text>
          <Text>Manage the onboarding slides shown to new users when they first sign in.</Text>
          <Text>Slides are displayed in order based on the &quot;display_order&quot; value.</Text>
          <Text>Only active slides are shown to users.</Text>
        </Stack>
      }
    />
  )
}
