import { ScrollView, Text, Row, Stack } from '@scaffald/ui'

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
      <Stack
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius={16}
        paddingHorizontal={16}
        paddingVertical={20}
        backgroundColor="$color2"
        gap={8}
      >
        <Text>Photo Gallery</Text>
        <Text color="$gray11">No photos have been uploaded yet.</Text>
      </Stack>
    )
  }

  return (
    <Stack gap={12}>
      <Text>Photo Gallery</Text>
      <ScrollView horizontal={false} showsVerticalScrollIndicator>
        <Row gap={12} flexWrap="wrap">
          {photos.map((photo) => (
            <Stack key={photo.id} width="100%">
              <PhotoCard
                photo={photo}
                disabled={disabled}
                onUpdateCaption={onUpdateCaption}
                onUpdatePhotoType={onUpdatePhotoType}
                onToggleVisibility={onToggleVisibility}
                onDelete={onDelete}
              />
            </Stack>
          ))}
        </Row>
      </ScrollView>
    </Stack>
  )
}
