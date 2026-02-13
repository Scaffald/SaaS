/**
 * SongTitleListItem component
 * Song title list item with album art and metadata
 *
 * @example
 * ```tsx
 * import { SongTitleListItem } from '@scaffald/ui'
 *
 * <SongTitleListItem
 *   title="Song Title"
 *   type="Album"
 *   artist="Artist Name"
 *   year="2024"
 *   imageSrc="https://example.com/album-art.jpg"
 * />
 * ```
 */

import { View, Text, Image } from 'react-native'
import type { SongTitleProps } from '../ListItem.types'
import { getListItemStyles } from '../ListItem.styles'
import { useThemeContext } from '../../../theme'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { borderRadius } from '../../../tokens/borders'

export function SongTitleListItem({
  imageSrc,
  imagePlaceholder,
  title,
  type,
  artist,
  year,
  onPress,
  style,
  accessibilityLabel,
}: Omit<SongTitleProps, 'variant'>) {
  const { theme } = useThemeContext()
  const styles = getListItemStyles('song-title', theme)

  return (
    <View style={[styles.container, style]}>
      {/* Image */}
      <View style={styles.leftSection}>
        {imageSrc ? (
          <Image
            source={{ uri: imageSrc }}
            style={{ width: 50, height: 50, borderRadius: borderRadius.s }}
          />
        ) : (
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: borderRadius.s,
              backgroundColor: colors.gray[300],
            }}
          />
        )}
      </View>

      {/* Content */}
      <View style={styles.contentSection}>
        <Text style={styles.title}>{title}</Text>
        {/* Metadata with dot separators */}
        {(type || artist || year) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            {type && <Text style={styles.subtitle}>{type}</Text>}
            {artist && (
              <>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.gray[700],
                  }}
                />
                <Text style={styles.subtitle}>{artist}</Text>
              </>
            )}
            {year && (
              <>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.gray[700],
                  }}
                />
                <Text style={styles.subtitle}>{year}</Text>
              </>
            )}
          </View>
        )}
      </View>
    </View>
  )
}
