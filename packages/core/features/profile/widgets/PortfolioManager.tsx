import { useState, useCallback } from 'react'
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  Card,
  Image,
  H4,
  Separator,
} from 'tamagui'
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, Image as ImageIcon } from '@tamagui/lucide-icons'
import { DashboardWidget } from '@app/ui'
import { ProfileFormPanel, ProfileResultsPanel, ProfileResultCard } from '../components'
import { api } from '@app/core/utils/api'
import { useToastController } from '@tamagui/toast'
import { ImageUpload } from '@app/ui'
import { RichTextEditor } from '@app/ui'
import type { ProfileWidgetProps } from './types'
import { getStorageUrl } from '@app/core/utils/supabase/storage'

interface PortfolioItem {
  id: string
  title: string
  description: unknown | null // JSONB for rich text
  image_url: string | null
  file_path: string | null
  display_order: number
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
  const [formData, setFormData] = useState<{
    title: string
    description: unknown | null
    imageUrl: string | null
    filePath: string | null
  }>({
    title: '',
    description: null,
    imageUrl: null,
    filePath: null,
  })

  // Fetch portfolio items
  const utils = api.useUtils()
  const { data: portfolioItems = [], isLoading } = api.portfolio.list.useQuery(
    userId ? { userId } : undefined,
    { enabled: !!userId },
  )

  // Mutations
  const createMutation = api.portfolio.create.useMutation({
    onSuccess: () => {
      utils.portfolio.list.invalidate()
      setIsAdding(false)
      setFormData({ title: '', description: null, imageUrl: null, filePath: null })
      toast.show('Portfolio Item Added', {
        message: 'Your portfolio item has been added successfully.',
      })
    },
    onError: (error) => {
      toast.show('Error', {
        message: error.message || 'Failed to add portfolio item',
      })
    },
  })

  const updateMutation = api.portfolio.update.useMutation({
    onSuccess: () => {
      utils.portfolio.list.invalidate()
      setEditingId(null)
      setFormData({ title: '', description: null, imageUrl: null, filePath: null })
      toast.show('Portfolio Item Updated', {
        message: 'Your portfolio item has been updated successfully.',
      })
    },
    onError: (error) => {
      toast.show('Error', {
        message: error.message || 'Failed to update portfolio item',
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
    onError: (error) => {
      toast.show('Error', {
        message: error.message || 'Failed to delete portfolio item',
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
    onError: (error) => {
      toast.show('Error', {
        message: error.message || 'Failed to reorder portfolio items',
      })
    },
  })

  // Handle edit
  const handleEdit = useCallback(
    (item: PortfolioItem) => {
      setEditingId(item.id)
      setFormData({
        title: item.title,
        description: item.description,
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
    setFormData({ title: '', description: null, imageUrl: null, filePath: null })
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

            setFormData((prev) => ({
              ...prev,
              imageUrl: uploadResult.imageUrl,
              filePath: uploadResult.filePath,
            }))
          } catch (error) {
            console.error('Error uploading image:', error)
            toast.show('Error', {
              message: 'Failed to upload image. Please try again.',
            })
          }
        }
        reader.readAsDataURL(blob)
      } catch (error) {
        console.error('Error processing image:', error)
        toast.show('Error', {
          message: 'Failed to process image. Please try again.',
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
            <Button
              theme="info"
              icon={Plus}
              onPress={() => {
                setIsAdding(true)
                setEditingId(null)
                setFormData({ title: '', description: null, imageUrl: null, filePath: null })
              }}
            >
              Add Portfolio Item
            </Button>
          </YStack>
        ) : (
          <YStack gap="$4">
            <XStack justify="space-between" items="center">
              <H4>{editingId ? 'Edit Portfolio Item' : 'Add Portfolio Item'}</H4>
              <Button size="$2" variant="outlined" onPress={handleCancel}>
                Cancel
              </Button>
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
              <Button variant="outlined" onPress={handleCancel}>
                Cancel
              </Button>
              <Button
                theme="info"
                onPress={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingId ? 'Update' : 'Add'} Portfolio Item
              </Button>
            </XStack>
          </YStack>
        )}
      </ProfileFormPanel>

      {/* Results Panel */}
      <ProfileResultsPanel
        title="Your Portfolio"
        isLoading={isLoading}
        isEmpty={portfolioItems.length === 0}
        emptyIcon={ImageIcon}
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
                    <Button
                      size="$2"
                      variant="outlined"
                      icon={ArrowUp}
                      onPress={() => handleMoveUp(index)}
                      disabled={index === 0 || reorderMutation.isPending}
                    />
                    <Button
                      size="$2"
                      variant="outlined"
                      icon={ArrowDown}
                      onPress={() => handleMoveDown(index)}
                      disabled={index === portfolioItems.length - 1 || reorderMutation.isPending}
                    />
                    {/* Edit button */}
                    <Button
                      size="$2"
                      variant="outlined"
                      icon={Edit}
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
                      contentFit="cover"
                      borderRadius="$3"
                    />
                  )}
                  <YStack gap="$2">
                    <Text fontSize="$4" fontWeight="600">
                      {item.title}
                    </Text>
                    {item.description && (
                      <Text fontSize="$3" color="$color11" numberOfLines={3}>
                        {/* Render rich text description - simplified for now */}
                        {typeof item.description === 'string'
                          ? item.description
                          : 'Rich text description'}
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

