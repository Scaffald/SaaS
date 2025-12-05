import { ScrollView, Text, XStack, YStack } from '@unicornlove/ui'

import type { ResolvedWorkLogPhoto, WorkLogPhotoType } from '../types/photos'
import { PhotoCard } from './PhotoCard'

export interface PhotoGalleryProps {
  photos: ResolvedWorkLogPhoto[]
  disabled?: boolean
  onUpdateCaption?: (photoId: string, caption: string | null) => Promise<void> | void
  onUpdatePhotoType?: (photoId: string, photoType: WorkLogPhotoType) => Promise<void> | void
  onToggleVisibility?: (photoId: string, showOnProfile: boolean) => Promise<void> | void
  onDelete?: (photoId: string) => Promise<void> | void
}

export function PhotoGallery({
  photos,
  disabled = false,
  onUpdateCaption,
  onUpdatePhotoType,
  onToggleVisibility,
  onDelete,
}: PhotoGalleryProps) {
  if (!photos.length) {
    return (
      <YStack
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$4"
        paddingHorizontal="$4"
        paddingVertical="$5"
        backgroundColor="$color2"
        gap="$2"
      >
        <Text fontWeight="600" fontSize="$4">
          Photo Gallery
        </Text>
        <Text color="$color11">No photos have been uploaded yet.</Text>
      </YStack>
    )
  }

  return (
    <YStack gap="$3">
      <Text fontWeight="600" fontSize="$4">
        Photo Gallery
      </Text>
      <ScrollView horizontal={false} showsVerticalScrollIndicator>
        <XStack gap="$3" flexWrap="wrap">
          {photos.map((photo) => (
            <YStack key={photo.id} width="100%">
              <PhotoCard
                photo={photo}
                disabled={disabled}
                onUpdateCaption={onUpdateCaption}
                onUpdatePhotoType={onUpdatePhotoType}
                onToggleVisibility={onToggleVisibility}
                onDelete={onDelete}
              />
            </YStack>
          ))}
        </XStack>
      </ScrollView>
    </YStack>
  )
}
