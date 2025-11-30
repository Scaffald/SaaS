import { api } from '@app/core/utils/api'
import { getStorageUrl } from '@app/core/utils/supabase/storage'
import { DashboardWidget, ResponsiveModal } from '@scaffald/neue-ui'
import { Eye } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { Card, H4, Image, Spinner, Text, XStack, YStack } from 'tamagui'
import type { ProfileWidgetProps } from './types'

interface PortfolioItem {
  id: string
  title: string
  description: unknown | null
  image_url: string | null
  file_path: string | null
  display_order: number
}

/**
 * PortfolioGallery Component
 *
 * Display-only component for viewing portfolio in public profile view.
 * Shows portfolio items in a grid layout with lightbox functionality.
 *
 * @param userId - User ID to display portfolio for
 * @param showEdit - Whether to show edit actions (always false for gallery)
 * @param variant - Display variant (compact or full)
 */
export function PortfolioGallery({ userId, variant = 'full' }: ProfileWidgetProps) {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Fetch portfolio items
  const { data: portfolioItems = [], isLoading } = api.portfolio.list.useQuery(
    userId ? { userId } : undefined,
    { enabled: !!userId }
  )

  const handleItemClick = (item: PortfolioItem) => {
    setSelectedItem(item)
    setLightboxOpen(true)
  }

  if (isLoading) {
    return (
      <DashboardWidget>
        <YStack gap="$4" items="center" py="$8">
          <Spinner size="large" />
          <Text color="$color11">Loading portfolio...</Text>
        </YStack>
      </DashboardWidget>
    )
  }

  if (portfolioItems.length === 0) {
    return null // Don't show widget if no portfolio items
  }

  return (
    <>
      <DashboardWidget>
        <YStack gap="$4">
          <H4>Portfolio</H4>

          {/* Grid Layout */}
          <YStack gap="$3">
            {portfolioItems.map((item: PortfolioItem) => {
              const imageUrl = item.file_path
                ? getStorageUrl('portfolio', item.file_path)
                : item.image_url

              return (
                <Card
                  key={item.id}
                  bordered
                  elevate
                  pressStyle={{ scale: 0.98 }}
                  cursor="pointer"
                  onPress={() => handleItemClick(item)}
                >
                  <YStack gap="$3">
                    {imageUrl && (
                      <Image
                        source={{ uri: imageUrl }}
                        width="100%"
                        height={variant === 'compact' ? 150 : 200}
                        objectFit="cover"
                        borderRadius="$3"
                      />
                    )}
                    <YStack gap="$2" p="$3">
                      <Text fontSize="$4" fontWeight="600" numberOfLines={2}>
                        {item.title}
                      </Text>
                      {item.description && variant === 'full' && (
                        <Text fontSize="$3" color="$color11" numberOfLines={3}>
                          {/* Render rich text description - simplified for now */}
                          {typeof item.description === 'string'
                            ? item.description
                            : 'Rich text description'}
                        </Text>
                      )}
                      {imageUrl && (
                        <XStack gap="$2" items="center" mt="$2">
                          <Eye size={14} color="$color10" />
                          <Text fontSize="$2" color="$color10">
                            Click to view
                          </Text>
                        </XStack>
                      )}
                    </YStack>
                  </YStack>
                </Card>
              )
            })}
          </YStack>
        </YStack>
      </DashboardWidget>

      {/* Lightbox Modal */}
      {selectedItem && (
        <ResponsiveModal
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          title={selectedItem.title}
          size="large"
        >
          <YStack gap="$4">
            {(() => {
              const imageUrl = selectedItem.file_path
                ? getStorageUrl('portfolio', selectedItem.file_path)
                : selectedItem.image_url

              return (
                <>
                  {imageUrl && (
                    <Image
                      source={{ uri: imageUrl }}
                      width="100%"
                      height={400}
                      objectFit="contain"
                      borderRadius="$3"
                    />
                  )}
                  {selectedItem.description && (
                    <YStack gap="$2">
                      <Text fontSize="$3" fontWeight="600">
                        Description
                      </Text>
                      <Text fontSize="$3" color="$color11" lineHeight="$4">
                        {typeof selectedItem.description === 'string'
                          ? selectedItem.description
                          : 'Rich text description'}
                      </Text>
                    </YStack>
                  )}
                </>
              )
            })()}
          </YStack>
        </ResponsiveModal>
      )}
    </>
  )
}
