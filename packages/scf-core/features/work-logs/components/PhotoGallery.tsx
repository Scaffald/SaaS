import { ScrollView, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  if (!photos.length) {
    return (
      <Stack
        borderWidth={1}
        borderColor={colors.border[t].default}
        borderRadius={16}
        paddingHorizontal={16}
        paddingVertical={20}
        backgroundColor={colors.bg[t].muted}
        gap={8}
      >
        <Text>Photo Gallery</Text>
        <Text style={{ color: colors.text[t].secondary }}>No photos have been uploaded yet.</Text>
      </Stack>
    )
  }

  return (
    <Stack gap={12}>
      <Text>Photo Gallery</Text>
      <ScrollView horizontal={false} showsVerticalScrollIndicator>
        <Row gap={12} wrap>
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
