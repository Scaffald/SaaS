import {
  usePortfolioItems,
  useCreatePortfolioItemMutation,
  useUpdatePortfolioItemMutation,
  useDeletePortfolioItemMutation,
  useUploadPortfolioImageMutation,
  useReorderPortfolioItemsMutation,
} from '@scf/core/utils/portfolio-sdk-hooks'
import { getStorageUrl } from '@scf/core/utils/supabase/storage'
import { Button, extractPlainText, plainTextToTipTap, RichTextEditor } from '@scaffald/ui'
import { ImageUpload } from '@scf/core/components/ui'
import { ArrowDown, ArrowUp, Edit3, Image as ImageIcon, Plus } from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
import type { JSONContent } from '@tiptap/core'
import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { H4, Image, Input, Text, Row, Stack } from '@scaffald/ui'
import { ProfileFormPanel, ProfileResultCard, ProfileResultsPanel } from '../components'
import type { ProfileWidgetProps } from './types'

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
  description: PortfolioDescription | unknown
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
export function PortfolioManager({ userId }: ProfileWidgetProps) {
  const toast = useToast()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState<PortfolioFormState>(() => createDefaultFormState())

  // Fetch portfolio items
  const queryClient = useQueryClient()
  const { data: rawPortfolioItems, isLoading } = usePortfolioItems(
    userId ? { userId } : undefined,
    { enabled: !!userId }
  )
  const portfolioItems = parsePortfolioItems(rawPortfolioItems)

  // Mutations
  const createMutation = useCreatePortfolioItemMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'portfolio', 'list'] })
      setIsAdding(false)
      setFormData(createDefaultFormState())
      toast.show({
        title: 'Portfolio Item Added',
        message: 'Your portfolio item has been added successfully.',
      })
    },
    onError: (error: unknown) => {
      toast.show({
        title: 'Error',
        message: getErrorMessage(error, 'Operation failed'),
        variant: 'error',
      })
    },
  })

  const updateMutation = useUpdatePortfolioItemMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'portfolio', 'list'] })
      setEditingId(null)
      setFormData(createDefaultFormState())
      toast.show({
        title: 'Portfolio Item Updated',
        message: 'Your portfolio item has been updated successfully.',
      })
    },
    onError: (error: unknown) => {
      toast.show({
        title: 'Error',
        message: getErrorMessage(error, 'Operation failed'),
        variant: 'error',
      })
    },
  })

  const deleteMutation = useDeletePortfolioItemMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'portfolio', 'list'] })
      toast.show({
        title: 'Portfolio Item Deleted',
        message: 'Your portfolio item has been removed.',
      })
    },
    onError: (error: unknown) => {
      toast.show({
        title: 'Error',
        message: getErrorMessage(error, 'Operation failed'),
        variant: 'error',
      })
    },
  })

  const uploadImageMutation = useUploadPortfolioImageMutation()

  const reorderMutation = useReorderPortfolioItemsMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'portfolio', 'list'] })
      toast.show({
        title: 'Portfolio Reordered',
        message: 'Your portfolio items have been reordered.',
      })
    },
    onError: (error: unknown) => {
      toast.show({
        title: 'Error',
        message: getErrorMessage(error, 'Operation failed'),
        variant: 'error',
      })
    },
  })

  // Handle edit
  const handleEdit = useCallback((item: PortfolioItem) => {
    setEditingId(item.id)
    setFormData({
      title: item.title,
      description: normalizeDescriptionForEditor(item.description),
      imageUrl: item.image_url || null,
      filePath: item.file_path || null,
    })
    setIsAdding(false)
  }, [])

  // Handle cancel
  const handleCancel = useCallback(() => {
    setEditingId(null)
    setIsAdding(false)
    setFormData(createDefaultFormState())
  }, [])

  // Handle save
  const handleSave = useCallback(() => {
    if (!formData.title.trim()) {
      toast.show({
        title: 'Error',
        message: 'Please enter a title for your portfolio item.',
        variant: 'error',
      })
      return
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        title: formData.title,
        description: formData.description ?? undefined,
        imageUrl: formData.imageUrl ?? undefined,
        filePath: formData.filePath ?? undefined,
      })
    } else {
      createMutation.mutate({
        title: formData.title,
        description: formData.description ?? undefined,
        imageUrl: formData.imageUrl ?? undefined,
        filePath: formData.filePath ?? undefined,
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
    [deleteMutation]
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
    [portfolioItems, reorderMutation]
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
    [portfolioItems, reorderMutation]
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
            toast.show({
              title: 'Error',
              message: getErrorMessage(error, 'Operation failed'),
              variant: 'error',
            })
          }
        }
        reader.readAsDataURL(blob)
      } catch (error) {
        console.error('Error processing image:', error)
        toast.show({
          title: 'Error',
          message: getErrorMessage(error, 'Operation failed'),
          variant: 'error',
        })
      }
    },
    [editingId, toast, uploadImageMutation]
  )

  const isEditing = editingId !== null || isAdding

  return (
    <>
      {/* Form Panel */}
      <ProfileFormPanel>
        <H4>Manage Portfolio</H4>

        {!isEditing ? (
          <Stack gap={12}>
            <Text color="$gray11">
              Add projects, work samples, or achievements to showcase your skills and experience.
            </Text>
            <Button
              iconStart={Plus}
              onPress={() => {
                setIsAdding(true)
                setEditingId(null)
                setFormData(createDefaultFormState())
              }}
            >
              Add Portfolio Item
            </Button>
          </Stack>
        ) : (
          <Stack gap={16}>
            <Row justify="space-between" align="center">
              <H4>{editingId ? 'Edit Portfolio Item' : 'Add Portfolio Item'}</H4>
              <Button size="xs" variant="outline" onPress={handleCancel}>
                Cancel
              </Button>
            </Row>

            {/* Title */}
            <Stack gap={8}>
              <Text>Title *</Text>
              <Input
                placeholder="e.g., Project Name, Work Sample..."
                value={formData.title}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, title: text }))}
              />
            </Stack>

            {/* Description */}
            <Stack gap={8}>
              <Text>Description</Text>
              <RichTextEditor
                value={formData.description}
                fieldType="EXPERIENCE_DESCRIPTION"
                onChange={(content) => setFormData((prev) => ({ ...prev, description: content }))}
                placeholder="Describe your project, work sample, or achievement..."
              />
            </Stack>

            {/* Image Upload */}
            <Stack gap={8}>
              <Text>Image</Text>
              <ImageUpload
                value={formData.imageUrl || ''}
                onChange={handleImageChange}
                bucket="portfolio"
                pathPrefix={userId ? `${userId}/portfolio` : undefined}
                maxSizeMB={5}
              />
            </Stack>

            {/* Save Button */}
            <Row gap={8} justify="flex-end">
              <Button variant="outline" onPress={handleCancel}>
                Cancel
              </Button>
              <Button
                variant="filled" color="primary"
                onPress={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingId ? 'Update' : 'Add'} Portfolio Item
              </Button>
            </Row>
          </Stack>
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
        <Stack gap={12}>
          {portfolioItems.map((item, index) => {
            const imageUrl = item.file_path
              ? getStorageUrl('portfolio', item.file_path)
              : item.image_url

            return (
              <ProfileResultCard
                key={item.id}
                onRemove={deleteMutation.isPending ? undefined : () => handleDelete(item.id)}
                removeDisabled={deleteMutation.isPending}
                actions={
                  <Row gap={8}>
                    {/* Reorder buttons */}
                    <Button
                      size="xs"
                      variant="outline"
                      iconStart={ArrowUp}
                      onPress={() => handleMoveUp(index)}
                      disabled={index === 0 || reorderMutation.isPending}
                    />
                    <Button
                      size="xs"
                      variant="outline"
                      iconStart={ArrowDown}
                      onPress={() => handleMoveDown(index)}
                      disabled={index === portfolioItems.length - 1 || reorderMutation.isPending}
                    />
                    {/* Edit button */}
                    <Button
                      size="xs"
                      variant="outline"
                      iconStart={Edit3}
                      onPress={() => handleEdit(item)}
                      disabled={isEditing}
                    />
                  </Row>
                }
              >
                <Stack gap={12}>
                  {imageUrl && (
                    <Image
                      source={{ uri: imageUrl }}
                      width="100%"
                      height={200}
                      objectFit="cover"
                      borderRadius={12}
                    />
                  )}
                  <Stack gap={8}>
                    <Text>{item.title}</Text>
                    {item.description && (
                      <Text color="$gray11">{getDescriptionPreview(item.description)}</Text>
                    )}
                  </Stack>
                </Stack>
              </ProfileResultCard>
            )
          })}
        </Stack>
      </ProfileResultsPanel>
    </>
  )
}
