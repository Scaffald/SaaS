/**
 * CloudFileListItem component
 * Cloud file list item with icon and metadata
 *
 * @example
 * ```tsx
 * import { CloudFileListItem } from '@scaffald/ui'
 *
 * <CloudFileListItem
 *   name="File Name.pdf"
 *   service="Dropbox"
 *   size="2.5 MB"
 *   iconSrc="https://example.com/icon.png"
 * />
 * ```
 */

import { View, Text, Image, Platform } from 'react-native'
import type { CloudFileProps } from '../ListItem.types'
import { getListItemStyles } from '../ListItem.styles'
import { useThemeContext } from '../../../theme'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { borderRadius } from '../../../tokens/borders'

export function CloudFileListItem({
  icon,
  iconSrc,
  name,
  service,
  size,
  onPress,
  style,
  accessibilityLabel,
}: Omit<CloudFileProps, 'variant'>) {
  const { theme } = useThemeContext()
  const styles = getListItemStyles('cloud-file', theme)

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
            <Text style={{ fontSize: 20 }}>📁</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.contentSection}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[8] }}>
          <Text style={styles.title}>{name}</Text>
          {/* Metadata with dot separators */}
          {(service || size) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
              {service && (
                <>
                  <Text style={styles.subtitle}>{service}</Text>
                  {size && (
                    <>
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: colors.gray[700],
                        }}
                      />
                      <Text style={styles.subtitle}>{size}</Text>
                    </>
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
