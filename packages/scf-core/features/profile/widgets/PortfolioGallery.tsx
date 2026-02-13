import { usePortfolioItems } from '@scf/core/utils/portfolio-sdk-hooks'
import { getStorageUrl } from '@scf/core/utils/supabase/storage'
import { DashboardWidget, ResponsiveModal } from '@scaffald/ui'
import { Eye } from 'lucide-react-native'
import { useState } from 'react'
import { Card, H4, Image, Spinner, Text, Row, Stack } from '@scaffald/ui'
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
  const { data: portfolioItems = [], isLoading } = usePortfolioItems(
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
        <Stack gap={16} align="center" paddingVertical={32}>
          <Spinner size="lg" />
          <Text color="$gray11">Loading portfolio...</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  if (portfolioItems.length === 0) {
    return null // Don't show widget if no portfolio items
  }

  return (
    <>
      <DashboardWidget>
        <Stack gap={16}>
          <H4>Portfolio</H4>

          {/* Grid Layout */}
          <Stack gap={12}>
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
                  <Stack gap={12}>
                    {imageUrl && (
                      <Image
                        source={{ uri: imageUrl }}
                        width="100%"
                        height={variant === 'compact' ? 150 : 200}
                        objectFit="cover"
                        borderRadius={12}
                      />
                    )}
                    <Stack gap={8} padding="sm">
                      <Text>{item.title}</Text>
                      {item.description && variant === 'full' && (
                        <Text color="$gray11">
                          {/* Render rich text description - simplified for now */}
                          {typeof item.description === 'string'
                            ? item.description
                            : 'Rich text description'}
                        </Text>
                      )}
                      {imageUrl && (
                        <Row gap={8} align="center" marginTop={8}>
                          <Eye size="md" color="$gray11" />
                          <Text color="$gray11">Click to view</Text>
                        </Row>
                      )}
                    </Stack>
                  </Stack>
                </Card>
              )
            })}
          </Stack>
        </Stack>
      </DashboardWidget>

      {/* Lightbox Modal */}
      {selectedItem && (
        <ResponsiveModal
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          title={selectedItem.title}
          size="lg"
        >
          <Stack gap={16}>
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
                      borderRadius={12}
                    />
                  )}
                  {selectedItem.description && (
                    <Stack gap={8}>
                      <Text>Description</Text>
                      <Text color="$gray11" lineHeight={16}>
                        {typeof selectedItem.description === 'string'
                          ? selectedItem.description
                          : 'Rich text description'}
                      </Text>
                    </Stack>
                  )}
                </>
              )
            })()}
          </Stack>
        </ResponsiveModal>
      )}
    </>
  )
}
