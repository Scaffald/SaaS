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
        <Stack flex={1} gap={16}>
          <Row justify="space-between" align="center">
            <H2>Welcome Slides CMS</H2>
            <Link href={ROUTES.OFFICE.CMS.WELCOME.CREATE.path} asChild>
              <Button icon={Plus}>Create Slide</Button>
            </Link>
          </Row>

          <Row gap={8} align="center">
            <Button
              size={12}
              chromeless={!includeInactive}
              onPress={() => setIncludeInactive(!includeInactive)}
            >
              {includeInactive ? 'Hide' : 'Show'} Inactive
            </Button>
          </Row>

          {isLoading ? (
            <Stack align="center" justify="center" flex={1}>
              <Spinner size="lg" />
            </Stack>
          ) : (
            <Stack gap={8}>
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
                    padding={16}
                    gap={12}
                    backgroundColor="$background"
                    borderRadius={16}
                    borderWidth={1}
                    borderColor="$borderColor"
                    align="center"
                  >
                    <Stack flex={1} gap={8}>
                      <Row gap={8} align="center">
                        <Text>{slide.title}</Text>
                        {!slide.is_active && <Text color="$red10">(Inactive)</Text>}
                      </Row>
                      <Text opacity={0.7}>{slide.description}</Text>
                      <Row gap={8}>
                        <Text opacity={0.5}>Icon: {slide.icon_name}</Text>
                        <Text opacity={0.5}>• Order: {slide.display_order}</Text>
                      </Row>
                    </Stack>

                    <Row gap={8}>
                      <Button
                        size={12}
                        icon={slide.is_active ? EyeOff : Eye}
                        onPress={() => handleToggleActive(slide)}
                        chromeless
                      />
                      <Link
                        href={ROUTES.OFFICE.CMS.WELCOME.EDIT.path.replace(':id', slide.id)}
                        asChild
                      >
                        <Button size={12} icon={Pencil} chromeless />
                      </Link>
                      <Button
                        size={12}
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
                <Stack align="center" justify="center" gap={16} paddingVertical={32}>
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
        <Stack gap={16}>
          <Text>About Welcome Slides</Text>
          <Text>Manage the onboarding slides shown to new users when they first sign in.</Text>
          <Text>Slides are displayed in order based on the &quot;display_order&quot; value.</Text>
          <Text>Only active slides are shown to users.</Text>
        </Stack>
      }
    />
  )
}
