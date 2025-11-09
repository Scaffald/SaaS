import { useState, useCallback } from 'react'
import { YStack, XStack, Text, Input, Image, H4 } from 'tamagui'
import { Plus, Edit3, ArrowUp, ArrowDown, Image as ImageIcon } from '@tamagui/lucide-icons'
import {
  UIButton,
  ImageUpload,
  RichTextEditor,
  extractPlainText,
  plainTextToTipTap,
} from '@app/ui'
import { ProfileFormPanel, ProfileResultsPanel, ProfileResultCard } from '../components'
import { api } from '@app/core/utils/api'
import { useToastController } from '@tamagui/toast'
import type { ProfileWidgetProps } from './types'
import { getStorageUrl } from '@app/core/utils/supabase/storage'
import type { JSONContent } from '@tiptap/core'

type PortfolioDescription = JSONContent | string | null

interface PortfolioItem {
  id: string
  title: string
  description: PortfolioDescription // JSONB for rich text
  image_url: string | null
  file_path: string | null
  display_order: number
}

interface PortfolioFormState {
  title: string
  description: JSONContent | null
  imageUrl: string | null
  filePath: string | null
}

interface UploadImageResponse {
  imageUrl: string
  filePath: string
}

const createDefaultFormState = (): PortfolioFormState => ({
  title: '',
  description: null,
  imageUrl: null,
  filePath: null,
})

const PortfolioEmptyStateIcon = ({ size }: { size?: number; color?: string }) => (
  <ImageIcon size={size} />
)

const isJsonContent = (value: unknown): value is JSONContent =>
  typeof value === 'object' && value !== null && 'type' in value

const normalizeDescriptionForEditor = (description: PortfolioDescription): JSONContent | null => {
  if (!description) {
    return null
  }

  if (typeof description === 'string') {
    return plainTextToTipTap(description)
  }

  return isJsonContent(description) ? description : null
}

const getDescriptionPreview = (description: PortfolioDescription): string => {
  if (!description) {
    return ''
  }

  if (typeof description === 'string') {
    return description
  }

  return extractPlainText(description)
}

const isUploadImageResponse = (value: unknown): value is UploadImageResponse =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as UploadImageResponse).imageUrl === 'string' &&
  typeof (value as UploadImageResponse).filePath === 'string'

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error
  }

  return fallback
}

const normalizePortfolioDescription = (
  description: PortfolioDescription | unknown,
): PortfolioDescription => {
  if (typeof description === 'string' || description === null) {
    return description
  }

  if (isJsonContent(description)) {
    return description
  }

  return null
}

const parsePortfolioItems = (data: unknown): PortfolioItem[] => {
  if (!Array.isArray(data)) {
    return []
  }

  const normalized: PortfolioItem[] = []

  for (const item of data) {
    if (!item || typeof item !== 'object') {
      continue
    }

    const candidate = item as Record<string, unknown>

    if (
      typeof candidate.id !== 'string' ||
      typeof candidate.title !== 'string' ||
      typeof candidate.display_order !== 'number'
    ) {
      continue
    }

    normalized.push({
      id: candidate.id,
      title: candidate.title,
      description: normalizePortfolioDescription(candidate.description),
      image_url: typeof candidate.image_url === 'string' ? candidate.image_url : null,
      file_path: typeof candidate.file_path === 'string' ? candidate.file_path : null,
      display_order: candidate.display_order,
    })
  }

  return normalized
}

/**
 * PortfolioManager Component
 *
 * Component for managing portfolio items in edit mode.
 * Supports add, edit, delete, and reorder operations.
 *
 * @param userId - User ID (optional, defaults to current user)
 * @param showEdit - Whether to show edit actions (always true for manager)
 * @param variant - Display variant (always 'full' for manager)
 */
export function PortfolioManager({
  userId,
}: ProfileWidgetProps) {
  const toast = useToastController()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState<PortfolioFormState>(() => createDefaultFormState())

  // Fetch portfolio items
  const utils = api.useUtils()
  const { data: rawPortfolioItems, isLoading } = api.portfolio.list.useQuery(
    userId ? { userId } : undefined,
    { enabled: !!userId },
  )
  const portfolioItems = parsePortfolioItems(rawPortfolioItems)

  // Mutations
  const createMutation = api.portfolio.create.useMutation({
    onSuccess: () => {
      utils.portfolio.list.invalidate()
      setIsAdding(false)
      setFormData(createDefaultFormState())
      toast.show('Portfolio Item Added', {
        message: 'Your portfolio item has been added successfully.',
      })
    },
    onError: (error: unknown) => {
      toast.show('Error', {
        message: getErrorMessage(error, 'Failed to add portfolio item'),
      })
    },
  })

  const updateMutation = api.portfolio.update.useMutation({
    onSuccess: () => {
      utils.portfolio.list.invalidate()
      setEditingId(null)
      setFormData(createDefaultFormState())
      toast.show('Portfolio Item Updated', {
        message: 'Your portfolio item has been updated successfully.',
      })
    },
    onError: (error: unknown) => {
      toast.show('Error', {
        message: getErrorMessage(error, 'Failed to update portfolio item'),
      })
    },
  })

  const deleteMutation = api.portfolio.delete.useMutation({
    onSuccess: () => {
      utils.portfolio.list.invalidate()
      toast.show('Portfolio Item Deleted', {
        message: 'Your portfolio item has been removed.',
      })
    },
    onError: (error: unknown) => {
      toast.show('Error', {
        message: getErrorMessage(error, 'Failed to delete portfolio item'),
      })
    },
  })

  const uploadImageMutation = api.portfolio.uploadImage.useMutation()

  const reorderMutation = api.portfolio.reorder.useMutation({
    onSuccess: () => {
      utils.portfolio.list.invalidate()
      toast.show('Portfolio Reordered', {
        message: 'Your portfolio items have been reordered.',
      })
    },
    onError: (error: unknown) => {
      toast.show('Error', {
        message: getErrorMessage(error, 'Failed to reorder portfolio items'),
      })
    },
  })

  // Handle edit
  const handleEdit = useCallback(
    (item: PortfolioItem) => {
      setEditingId(item.id)
      setFormData({
        title: item.title,
        description: normalizeDescriptionForEditor(item.description),
        imageUrl: item.image_url || null,
        filePath: item.file_path || null,
      })
      setIsAdding(false)
    },
    [],
  )

  // Handle cancel
  const handleCancel = useCallback(() => {
    setEditingId(null)
    setIsAdding(false)
    setFormData(createDefaultFormState())
  }, [])

  // Handle save
  const handleSave = useCallback(() => {
    if (!formData.title.trim()) {
      toast.show('Error', {
        message: 'Please enter a title for your portfolio item.',
      })
      return
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl,
        filePath: formData.filePath,
      })
    } else {
      createMutation.mutate({
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl,
        filePath: formData.filePath,
        displayOrder: portfolioItems.length,
      })
    }
  }, [editingId, formData, portfolioItems.length, updateMutation, createMutation, toast])

  // Handle delete
  const handleDelete = useCallback(
    (id: string) => {
      if (confirm('Are you sure you want to delete this portfolio item?')) {
        deleteMutation.mutate({ id })
      }
    },
    [deleteMutation],
  )

  // Handle reorder
  const handleMoveUp = useCallback(
    (index: number) => {
      if (index === 0) return
      const items = portfolioItems.map((item, i) => ({
        id: item.id,
        displayOrder: i === index ? index - 1 : i === index - 1 ? index : i,
      }))
      reorderMutation.mutate({ items })
    },
    [portfolioItems, reorderMutation],
  )

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index === portfolioItems.length - 1) return
      const items = portfolioItems.map((item, i) => ({
        id: item.id,
        displayOrder: i === index ? index + 1 : i === index + 1 ? index : i,
      }))
      reorderMutation.mutate({ items })
    },
    [portfolioItems, reorderMutation],
  )

  // Handle image upload via ImageUpload component
  const handleImageChange = useCallback(
    async (imageUri: string | null) => {
      if (!imageUri) {
        setFormData((prev) => ({
          ...prev,
          imageUrl: null,
          filePath: null,
        }))
        return
      }

      try {
        // Convert image to base64 for upload
        const response = await fetch(imageUri)
        const blob = await response.blob()
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64data = reader.result as string
          try {
            // Upload image via portfolio.uploadImage
            const uploadResult = await uploadImageMutation.mutateAsync({
              portfolioItemId: editingId || undefined,
              file: base64data,
              fileName: `portfolio-${Date.now()}.jpg`,
              contentType: blob.type || 'image/jpeg',
            })

            if (!isUploadImageResponse(uploadResult)) {
              throw new Error('Unexpected response from image upload')
            }

            setFormData((prev) => ({
              ...prev,
              imageUrl: uploadResult.imageUrl,
              filePath: uploadResult.filePath,
            }))
          } catch (error) {
            console.error('Error uploading image:', error)
            toast.show('Error', {
              message: getErrorMessage(error, 'Failed to upload image. Please try again.'),
            })
          }
        }
        reader.readAsDataURL(blob)
      } catch (error) {
        console.error('Error processing image:', error)
        toast.show('Error', {
          message: getErrorMessage(error, 'Failed to process image. Please try again.'),
        })
      }
    },
    [editingId, toast, uploadImageMutation],
  )

  const isEditing = editingId !== null || isAdding

  return (
    <>
      {/* Form Panel */}
      <ProfileFormPanel>
        <H4>Manage Portfolio</H4>

        {!isEditing ? (
          <YStack gap="$3">
            <Text fontSize="$3" color="$color11">
              Add projects, work samples, or achievements to showcase your skills and experience.
            </Text>
            <UIButton
              icon={Plus}
              onPress={() => {
                setIsAdding(true)
                setEditingId(null)
                setFormData(createDefaultFormState())
              }}
            >
              Add Portfolio Item
            </UIButton>
          </YStack>
        ) : (
          <YStack gap="$4">
            <XStack justify="space-between" items="center">
              <H4>{editingId ? 'Edit Portfolio Item' : 'Add Portfolio Item'}</H4>
              <UIButton size="$2" variant="outlined" onPress={handleCancel}>
                Cancel
              </UIButton>
            </XStack>

            {/* Title */}
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="600">
                Title *
              </Text>
              <Input
                placeholder="e.g., Project Name, Work Sample..."
                value={formData.title}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, title: text }))}
              />
            </YStack>

            {/* Description */}
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="600">
                Description
              </Text>
              <RichTextEditor
                value={formData.description}
                fieldType="EXPERIENCE_DESCRIPTION"
                onChange={(content) => setFormData((prev) => ({ ...prev, description: content }))}
                placeholder="Describe your project, work sample, or achievement..."
              />
            </YStack>

            {/* Image Upload */}
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="600">
                Image
              </Text>
              <ImageUpload
                value={formData.imageUrl || ''}
                onChange={handleImageChange}
                bucket="portfolio"
                pathPrefix={userId ? `${userId}/portfolio` : undefined}
                maxSizeMB={5}
              />
            </YStack>

            {/* Save Button */}
            <XStack gap="$2" justify="flex-end">
              <UIButton variant="outlined" onPress={handleCancel}>
                Cancel
              </UIButton>
              <UIButton
                onPress={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingId ? 'Update' : 'Add'} Portfolio Item
              </UIButton>
            </XStack>
          </YStack>
        )}
      </ProfileFormPanel>

      {/* Results Panel */}
      <ProfileResultsPanel
        title="Your Portfolio"
        isLoading={isLoading}
        isEmpty={portfolioItems.length === 0}
        emptyIcon={PortfolioEmptyStateIcon}
        emptyMessage="No portfolio items yet. Add your first item to showcase your work."
      >
        <YStack gap="$3">
          {portfolioItems.map((item, index) => {
            const imageUrl = item.file_path
              ? getStorageUrl('portfolio', item.file_path)
              : item.image_url

            return (
              <ProfileResultCard
                key={item.id}
                onRemove={
                  deleteMutation.isPending
                    ? undefined
                    : () => handleDelete(item.id)
                }
                removeDisabled={deleteMutation.isPending}
                actions={
                  <XStack gap="$2">
                    {/* Reorder buttons */}
                    <UIButton
                      size="$2"
                      variant="outlined"
                      icon={ArrowUp}
                      onPress={() => handleMoveUp(index)}
                      disabled={index === 0 || reorderMutation.isPending}
                    />
                    <UIButton
                      size="$2"
                      variant="outlined"
                      icon={ArrowDown}
                      onPress={() => handleMoveDown(index)}
                      disabled={index === portfolioItems.length - 1 || reorderMutation.isPending}
                    />
                    {/* Edit button */}
                    <UIButton
                      size="$2"
                      variant="outlined"
                      icon={Edit3}
                      onPress={() => handleEdit(item)}
                      disabled={isEditing}
                    />
                  </XStack>
                }
              >
                <YStack gap="$3">
                  {imageUrl && (
                    <Image
                      source={{ uri: imageUrl }}
                      width="100%"
                      height={200}
                      objectFit="cover"
                      borderRadius="$3"
                    />
                  )}
                  <YStack gap="$2">
                    <Text fontSize="$4" fontWeight="600">
                      {item.title}
                    </Text>
                    {item.description && (
                      <Text fontSize="$3" color="$color11" numberOfLines={3}>
                        {getDescriptionPreview(item.description)}
                      </Text>
                    )}
                  </YStack>
                </YStack>
              </ProfileResultCard>
            )
          })}
        </YStack>
      </ProfileResultsPanel>
    </>
  )
}

