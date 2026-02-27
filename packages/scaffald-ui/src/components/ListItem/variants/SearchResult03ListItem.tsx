/**
 * SearchResult03ListItem component
 * Search result list item with featured icon
 *
 * @example
 * ```tsx
 * import { SearchResult03ListItem } from '@scaffald/ui'
 *
 * <SearchResult03ListItem
 *   title="Feature Title"
 *   description="This is a description of the feature..."
 *   iconSrc="https://example.com/icon.png"
 * />
 * ```
 */

import { View, Text, Image, Platform } from 'react-native'
import type { SearchResult03Props } from '../ListItem.types'
import { getListItemStyles } from '../ListItem.styles'
import { useThemeContext } from '../../../theme'
import { colors } from '../../../tokens/colors'
import { borderRadius } from '../../../tokens/borders'

export function SearchResult03ListItem({
  icon,
  iconSrc,
  title,
  description,
  onPress,
  style,
  accessibilityLabel,
}: Omit<SearchResult03Props, 'variant'>) {
  const { theme } = useThemeContext()
  const styles = getListItemStyles('search-result-03', theme)

  return (
    <View style={[styles.container, style]}>
      {/* Featured Icon with gradient background */}
      <View style={styles.leftSection}>
        {icon || (iconSrc && <Image source={{ uri: iconSrc }} style={{ width: 40, height: 40 }} />) || (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: borderRadius.l,
              ...(Platform.OS === 'web'
                ? {
                    background: `linear-gradient(to bottom, ${colors.bg[theme].subtle || colors.gray[50]}, ${colors.bg[theme].default || colors.gray[100]})`,
                    boxShadow: `0px 0px 0px 2px ${colors.gray[0]}, 0px 0px 0px 3px ${colors.gray[100]}`,
                  }
                : {
                    backgroundColor: colors.bg[theme].subtle || colors.gray[50],
                  }),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.contentSection}>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
    </View>
  )
}
