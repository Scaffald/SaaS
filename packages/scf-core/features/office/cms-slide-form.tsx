import type { WelcomeSlideCreate, WelcomeSlideUpdate } from '@scf/schemas'
import { IconSelector, ToggleSwitch } from '@unicornlove/beyond-ui'
import { ImageUpload } from '@scf/core/components/ui'
import { Save } from 'lucide-react-native'
import { useState } from 'react'
import { Button, Form, H4, Input, Label, Text, TextArea, Row, Stack } from '@unicornlove/beyond-ui'

interface CMSSlideFormProps {
  initialData?: WelcomeSlideUpdate
  onSubmit: (data: WelcomeSlideCreate | WelcomeSlideUpdate) => Promise<void>
  isLoading?: boolean
}

export function CMSSlideForm({ initialData, onSubmit, isLoading }: CMSSlideFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [iconName, setIconName] = useState(initialData?.icon_name || 'UserSearch')
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(
    initialData?.background_image_url || ''
  )
  const [displayOrder, setDisplayOrder] = useState(initialData?.display_order?.toString() || '1')
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true)

  const handleSubmit = async () => {
    if (initialData?.id) {
      // Edit mode - include id
      const data: WelcomeSlideUpdate = {
        id: initialData.id,
        title,
        description,
        icon_name: iconName,
        background_image_url: backgroundImageUrl,
        display_order: Number.parseInt(displayOrder, 10),
        is_active: isActive,
      }
      await onSubmit(data)
    } else {
      // Create mode - no id
      const data: WelcomeSlideCreate = {
        title,
        description,
        icon_name: iconName,
        background_image_url: backgroundImageUrl,
        display_order: Number.parseInt(displayOrder, 10),
        is_active: isActive,
      }
      await onSubmit(data)
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Stack gap={16}>
        <H4>{initialData?.id ? 'Edit' : 'Create'} Welcome Slide</H4>

        <Stack gap={8}>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChangeText={setTitle}
            placeholder="Enter slide title"
            disabled={isLoading}
          />
        </Stack>

        <Stack gap={8}>
          <Label htmlFor="description">Description *</Label>
          <TextArea
            id="description"
            value={description}
            onChangeText={setDescription}
            placeholder="Enter slide description"
            disabled={isLoading}
            numberOfLines={4}
          />
        </Stack>

        <IconSelector value={iconName} onChange={setIconName} disabled={isLoading} />

        <ImageUpload
          label="Background Image *"
          value={backgroundImageUrl || undefined}
          onChange={(url: string | null) => setBackgroundImageUrl(url || '')}
          bucket="cms-media"
          pathPrefix={initialData?.id ? `welcome-slides/${initialData.id}` : 'welcome-slides/new'}
          maxSizeMB={5}
          disabled={isLoading}
          helperText="Upload a high-quality background image for the slide"
        />

        <Stack gap={8}>
          <Label htmlFor="order">Display Order *</Label>
          <Input
            id="order"
            value={displayOrder}
            onChangeText={setDisplayOrder}
            placeholder="1"
            keyboardType="numeric"
            disabled={isLoading}
          />
          <Text opacity={0.6}>Slides are shown in ascending order (1, 2, 3...)</Text>
        </Stack>

        <Row gap={12} align="center">
          <ToggleSwitch
            checked={isActive}
            onCheckedChange={setIsActive}
            disabled={isLoading}
            aria-label="Slide active"
          />
          <Label>Active (visible to users)</Label>
        </Row>

        <Row gap={8} justify="flex-end">
          <Button onPress={handleSubmit} icon={Save} disabled={isLoading || !title || !description}>
            {isLoading ? 'Saving...' : 'Save Slide'}
          </Button>
        </Row>
      </Stack>
    </Form>
  )
}
